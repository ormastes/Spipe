#!/bin/sh
set -eu

MODULE_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
HOST_ROOT="${SPIPE_HOST_ROOT:-$(CDPATH= cd -- "${MODULE_ROOT}/../.." && pwd)}"
FORCE=0
DRY_RUN=0

usage() {
  cat <<'USAGE'
Usage: sh .spipe/spipe/scripts/setup-spipe-links.sh [--force] [--dry-run]

Links reusable SPipe process surfaces from .spipe/spipe into the host repo:
  doc/00_llm_process/skill_command
  doc/00_llm_process/spipe
  doc/00_llm_process/template
  doc/00_llm_process/project_expert
  doc/00_llm_process/domain_expert
  doc/00_llm_process/tool_expert

Set SPIPE_HOST_ROOT to override host repo detection.
Optional subproject links are read from .spipe/subproject_links.sdn.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --force) FORCE=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "setup-spipe-links: unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

link_one() {
  rel="$1"
  source="${MODULE_ROOT}/${rel}"
  link_target="../../.spipe/spipe/${rel}"
  target="${HOST_ROOT}/${rel}"

  if [ ! -e "$source" ]; then
    echo "missing_source $rel" >&2
    return 1
  fi

  mkdir -p "$(dirname "$target")"

  if [ -L "$target" ]; then
    current="$(readlink "$target")"
    if [ "$current" = "$link_target" ]; then
      echo "ok $rel"
      return 0
    fi
    if [ "$FORCE" -ne 1 ]; then
      echo "skip_existing $rel"
      return 0
    fi
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "would_replace $rel"
      return 0
    fi
    rm -f -- "$target"
  fi

  if [ -e "$target" ]; then
    if [ "$FORCE" -ne 1 ]; then
      echo "skip_existing $rel"
      return 0
    fi
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "would_replace $rel"
      return 0
    fi
    rm -rf -- "$target"
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "would_link $rel"
    return 0
  fi

  ln -s "$link_target" "$target"
  echo "linked $rel"
}

link_pair() {
  target_rel="$1"
  source_rel="$2"
  source="${HOST_ROOT}/${source_rel}"
  target="${HOST_ROOT}/${target_rel}"

  if [ ! -e "$source" ]; then
    echo "skip_missing_subproject_source $target_rel"
    return 0
  fi

  mkdir -p "$(dirname "$target")"

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
    rm -rf -- "$target"
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "would_link_subproject $target_rel"
    return 0
  fi

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

link_one "doc/00_llm_process/skill_command"
link_one "doc/00_llm_process/spipe"
link_one "doc/00_llm_process/template"
link_one "doc/00_llm_process/project_expert"
link_one "doc/00_llm_process/domain_expert"
link_one "doc/00_llm_process/tool_expert"
link_subprojects
