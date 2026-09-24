# SPipe common wiki

This is the stable entrypoint for reusable SPipe knowledge. Research adapters
compose it with authorized company, organization, project, user, and host wiki
roots. Follow links to canonical `doc/` or `raw/` evidence; do not treat runtime
state as knowledge.

## Must know

Research resolves common, company, selected organizations, selected projects,
user, and host in that order. Only active authorized scopes contribute content;
a mount or directory is a locator, not permission. Enter through indexes and
retrieve relevant leaves with bounded traversal.

Canonical global common is `~/spipe`; Simple's preferred project route is
`.spipe/common`. The shared locator retains legacy routes and validates the
project's reviewed common requirement before selecting content.

`raw/` preserves evidence; `wiki/` synthesizes knowledge; `doc/` holds canonical
lifecycle decisions and specifications; `skills/` defines agent procedures.
Keep evidence provenance and applicability when composing scopes. Start from
the [common skills index](../skills/index.md) so Claude, Codex, Gemini, and MCP
adapters use the same discovery and research contract.

## Routes

- [Scope resolution](../doc/00_llm_process/knowledge/llm_wiki_scope_resolution.md) — context, ownership, and runtime contracts.
- [Local setup](../doc/00_llm_process/knowledge/local_ownership_setup.md) — available setup and planned workspace layout.
- [Migration](../doc/00_llm_process/knowledge/local_migration.md) — classify legacy content and preserve pins.
- [Research procedure](../plugin/skills/spipe-research/SKILL.md) — agent research workflow.
- [Raw evidence](../raw/index.md) — provenance and source-material contract.
- [Common skills](../skills/index.md) — bootstrap, compatibility, and agent routes.
- [Dated workspace research](../doc/00_llm_process/knowledge/research/spipe_workspace_ownership_llm_wiki_2026-09-09.md)
  — ownership-aware workspace and LLM-wiki design.

`doc/00_llm_process/knowledge/` remains normative documentation about the
knowledge system. Its contents are classified individually before any migration.

## Boundary

`runtime/<user>/<host>/` contains reconstructible `cache/`, retained `state/`,
live-process `run/`, and bounded `tmp/`. It is not canonical knowledge; clearing
cache must preserve retained research history. Private scope content is never
published here merely because it was mounted, retrieved, or frequently used.
