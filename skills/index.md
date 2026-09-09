# SPipe common skills

This is the stable entrypoint for procedures used by Claude, Codex, Gemini,
MCP, and other SPipe integrations. An agent should locate the common checkout
first, then read this index and the task-relevant skill before acting.

## Common checkout

The canonical global common checkout is `~/spipe`. In the Simple repository,
the project route is `.spipe/common`; `.spipe/spipe` and
`.spipe/spipe_project` remain compatibility routes for reviewed existing
pins. A project-local route must not silently upgrade or replace the global
checkout.

## Required bootstrap

1. Locate common using the shared resolver or its documented compatibility
   adapter.
2. Resolve the workspace and explicitly active, authorized scopes.
3. Read scope `index.md` and `wiki/index.md` before traversing leaves.
4. Load only the task-relevant skill and preserve mandatory restrictions.
5. Follow `wiki/` references to `doc/` or `raw/` when needed.
6. Treat `runtime/` as validated execution state/cache, never canonical truth.

## Routes

- [SPipe research skill](../plugin/skills/spipe-research/SKILL.md) — scope-aware
  evidence-grounded research and owner-correct write-back.
- [SPipe skill](../plugin/skills/spipe/SKILL.md) — executable SPipe specs and
  review-admission rules.
- [Agent/plugin bootstrap](../docs/PLUGIN_AGENT_BOOTSTRAP.md) — Claude,
  Codex, Gemini, and MCP discovery contract.
- [Knowledge-system research](../doc/00_llm_process/knowledge/research/spipe_workspace_ownership_llm_wiki_2026-09-09.md)
  — design and migration decisions.

Compatibility skill trees under `plugin/skills/` and
`doc/00_llm_process/skill_command/skills/` remain valid until all consumers
use the top-level common surfaces.
