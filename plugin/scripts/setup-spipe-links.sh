#!/bin/sh
set -eu

MODULE_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)"
HOST_ROOT="${SPIPE_HOST_ROOT:-$(CDPATH= cd -- "${MODULE_ROOT}/../.." && pwd -P)}"
if [ ! -d "$HOST_ROOT" ]; then
  echo "setup-spipe-links: host repository does not exist: $HOST_ROOT" >&2
  exit 2
fi
HOST_ROOT="$(CDPATH= cd -- "$HOST_ROOT" && pwd -P)"
FORCE=0
DRY_RUN=0
DOC_ROOT="${SPIPE_DOC_ROOT:-}"

usage() {
  cat <<'USAGE'
Usage: sh .spipe/spipe/scripts/setup-spipe-links.sh [--force] [--dry-run] [--doc-root PATH]

Links reusable SPipe process surfaces from .spipe/spipe into the host repo:
  <doc-root>/skill_command
  <doc-root>/spipe
  <doc-root>/template
  <doc-root>/project_expert
  <doc-root>/domain_expert
  <doc-root>/tool_expert

Set SPIPE_HOST_ROOT to override host repo detection.
Set SPIPE_DOC_ROOT or --doc-root to override the host process-doc root.
Without either, .spipe/config.sdn host_process_doc is used when present,
otherwise the generic default is doc/llm_process.
Optional subproject links are read from .spipe/subproject_links.sdn.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --force) FORCE=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --doc-root)
      shift
      if [ "$#" -eq 0 ]; then
        echo "setup-spipe-links: --doc-root requires a path" >&2
        exit 2
      fi
      DOC_ROOT="$1"
      ;;
    --help|-h) usage; exit 0 ;;
    *) echo "setup-spipe-links: unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

configured_doc_root() {
  if [ -n "$DOC_ROOT" ]; then
    printf '%s\n' "$DOC_ROOT"
    return 0
  fi
  config="${HOST_ROOT}/.spipe/config.sdn"
  if [ -f "$config" ]; then
    value="$(sed -n 's/^[[:space:]]*host_process_doc:[[:space:]]*\([^[:space:]#][^[:space:]#]*\).*$/\1/p' "$config" | sed -n '1p')"
    if [ -n "$value" ]; then
      printf '%s\n' "$value"
      return 0
    fi
  fi
  printf '%s\n' "doc/llm_process"
}

DOC_ROOT="$(configured_doc_root)"

safe_relative_path() {
  case "$1" in
    ""|/*|../*|*/../*|*/..|*\\*|*//*|.|./*|*/./*|*/.|*/) return 1 ;;
  esac
  return 0
}

safe_relative_path "$DOC_ROOT" || {
  echo "setup-spipe-links: doc root must stay inside the host repository: $DOC_ROOT" >&2
  exit 2
}

canonical_existing_directory() {
  candidate="$1"
  while [ ! -d "$candidate" ]; do
    if [ -e "$candidate" ] || [ -L "$candidate" ]; then
      return 1
    fi
    next="$(dirname "$candidate")"
    [ "$next" != "$candidate" ] || return 1
    candidate="$next"
  done
  (CDPATH= cd -P -- "$candidate" && pwd -P)
}

canonical_existing_path() {
  candidate="$1"
  depth=0
  while [ -L "$candidate" ]; do
    depth=$((depth + 1))
    [ "$depth" -le 40 ] || return 1
    link_target="$(readlink "$candidate")" || return 1
    case "$link_target" in
      /*) candidate="$link_target" ;;
      *) candidate="$(dirname "$candidate")/$link_target" ;;
    esac
  done
  if [ -d "$candidate" ]; then
    (CDPATH= cd -P -- "$candidate" && pwd -P)
    return
  fi
  [ -e "$candidate" ] || return 1
  canonical_parent="$(canonical_existing_directory "$(dirname "$candidate")")" || return 1
  printf '%s/%s\n' "$canonical_parent" "$(basename "$candidate")"
}

assert_safe_source() {
  canonical_source="$(canonical_existing_path "$1")" || {
    echo "setup-spipe-links: subproject source cannot be resolved: $1" >&2
    return 1
  }
  case "$canonical_source" in
    "$HOST_ROOT"|"$HOST_ROOT"/*) return 0 ;;
    *)
      echo "setup-spipe-links: subproject source escapes the host repository: $1" >&2
      return 1
      ;;
  esac
}

assert_safe_target_parent() {
  target_parent="$(dirname "$1")"
  canonical_parent="$(canonical_existing_directory "$target_parent")" || {
    echo "setup-spipe-links: target parent is not a directory: $target_parent" >&2
    return 1
  }
  case "$canonical_parent" in
    "$HOST_ROOT"|"$HOST_ROOT"/*) return 0 ;;
    *)
      echo "setup-spipe-links: target parent escapes the host repository: $target_parent" >&2
      return 1
      ;;
  esac
}

ensure_parent() {
  assert_safe_target_parent "$1"
  parent=$(dirname "$1")
  if [ "$DRY_RUN" -eq 1 ]; then
    [ -d "$parent" ] || echo "would_mkdir ${parent#${HOST_ROOT}/}"
  else
    mkdir -p "$parent"
  fi
}

link_one() {
  name="$1"
  source="${MODULE_ROOT}/doc/00_llm_process/${name}"
  target="${HOST_ROOT}/${DOC_ROOT}/${name}"

  if [ ! -e "$source" ]; then
    echo "missing_source doc/00_llm_process/$name" >&2
    return 1
  fi

  ensure_parent "$target"

  if [ -L "$target" ]; then
    current="$(readlink "$target")"
    if [ "$current" = "$source" ]; then
      echo "ok ${DOC_ROOT}/${name}"
      return 0
    fi
    if [ "$FORCE" -ne 1 ]; then
      echo "skip_existing ${DOC_ROOT}/${name}"
      return 0
    fi
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "would_replace ${DOC_ROOT}/${name}"
      return 0
    fi
    assert_safe_target_parent "$target"
    rm -f -- "$target"
  fi

  if [ -e "$target" ]; then
    if [ "$FORCE" -ne 1 ]; then
      echo "skip_existing ${DOC_ROOT}/${name}"
      return 0
    fi
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "would_replace ${DOC_ROOT}/${name}"
      return 0
    fi
    assert_safe_target_parent "$target"
    rm -rf -- "$target"
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "would_link ${DOC_ROOT}/${name}"
    return 0
  fi

  assert_safe_target_parent "$target"
  ln -s "$source" "$target"
  echo "linked ${DOC_ROOT}/${name}"
}

link_pair() {
  target_rel="$1"
  source_rel="$2"
  safe_relative_path "$target_rel" && safe_relative_path "$source_rel" || {
    echo "setup-spipe-links: subproject link paths must stay inside the host repository" >&2
    return 1
  }
  source="${HOST_ROOT}/${source_rel}"
  target="${HOST_ROOT}/${target_rel}"

  if [ ! -e "$source" ]; then
    echo "skip_missing_subproject_source $target_rel"
    return 0
  fi

  assert_safe_source "$source"
  ensure_parent "$target"

  if [ -L "$target" ]; then
    current="$(readlink "$target")"
    if [ "$current" = "$source_rel" ] || [ "$current" = "$source" ]; then
      echo "ok_subproject $target_rel"
      return 0
    fi
    if [ "$FORCE" -ne 1 ]; then
      echo "skip_existing_subproject $target_rel"
      return 0
    fi
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "would_replace_subproject $target_rel"
      return 0
    fi
    assert_safe_target_parent "$target"
    rm -f -- "$target"
  fi

  if [ -e "$target" ]; then
    if [ "$FORCE" -ne 1 ]; then
      echo "skip_existing_subproject $target_rel"
      return 0
    fi
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "would_replace_subproject $target_rel"
      return 0
    fi
    assert_safe_target_parent "$target"
    rm -rf -- "$target"
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "would_link_subproject $target_rel"
    return 0
  fi

  assert_safe_target_parent "$target"
  ln -s "$source_rel" "$target"
  echo "linked_subproject $target_rel"
}

link_subprojects() {
  config="${SPIPE_SUBPROJECT_LINKS:-${HOST_ROOT}/.spipe/subproject_links.sdn}"
  if [ ! -f "$config" ]; then
    echo "subproject_links_config=missing"
    return 0
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ""|"#"*) continue ;;
    esac
    target_rel="${line%%|*}"
    source_rel="${line#*|}"
    if [ "$target_rel" = "$line" ] || [ -z "$target_rel" ] || [ -z "$source_rel" ]; then
      echo "skip_invalid_subproject_link $line" >&2
      continue
    fi
    link_pair "$target_rel" "$source_rel"
  done < "$config"
}

link_one "skill_command"
link_one "spipe"
link_one "template"
link_one "project_expert"
link_one "domain_expert"
link_one "tool_expert"
link_subprojects
