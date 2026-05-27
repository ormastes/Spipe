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
  link_target="../../../.spipe/spipe/${rel}"
  target="${HOST_ROOT}/${rel}"

  if [ ! -e "$source" ]; then
    echo "missing_source $rel" >&2
    return 1
  fi

  mkdir -p "$(dirname "$target")"

  if [ -L "$target" ]; then
    current="$(readlink "$target")"
    if [ "$current" = "$source" ]; then
      echo "ok $rel"
      return 0
    fi
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

link_one "doc/00_llm_process/skill_command"
link_one "doc/00_llm_process/spipe"
link_one "doc/00_llm_process/template"
link_one "doc/00_llm_process/project_expert"
link_one "doc/00_llm_process/domain_expert"
link_one "doc/00_llm_process/tool_expert"
