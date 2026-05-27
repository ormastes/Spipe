#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

required_paths="
README.md
doc/00_llm_process/spipe/skill.md
doc/00_llm_process/skill_command
doc/00_llm_process/template
doc/00_llm_process/project_expert
doc/00_llm_process/domain_expert
doc/00_llm_process/tool_expert
.claude/skills/spipe.md
.claude/templates/spipe_template.spl
.codex/skills/dev/SKILL.md
.codex/skills/sp_dev/SKILL.md
.gemini/commands/dev.toml
.gemini/commands/sp_dev.toml
plugin
mcp
cli
"

missing=0
for path in $required_paths; do
  if [ ! -e "$path" ]; then
    echo "missing $path" >&2
    missing=$((missing + 1))
  fi
done

if [ "$missing" -ne 0 ]; then
  echo "spipe_build_status=fail missing=$missing"
  exit 1
fi

echo "spipe_build_status=pass"
