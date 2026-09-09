# SPipe workspace ownership and LLM-wiki research

**Date:** 2026-09-09
**Status:** research/design record for the next SPipe workspace revision.
**Scope:** common SPipe distribution, private ownership scopes, agent/plugin
bootstrap, LLM-wiki research, and legacy documentation migration.

## Summary

SPipe should use one common checkout and one shared resolver. The preferred
global checkout is `~/spipe`; `~/.spipe` holds private workspace/configuration
and may expose `common -> ~/spipe`. Simple should resolve its common SPipe
through the project-owned `.spipe/common` route when configured, while
preserving existing `.spipe/spipe` and `.spipe/spipe_project` pins as explicit
compatibility routes. A project-local route must not silently upgrade the
reviewed common revision.

The logical ownership scopes are:

```text
common -> company -> organization(s) -> project(s) -> user -> host
```

Runtime state is separate:

```text
runtime/<user>/<host>/{cache,state,run,tmp}
```

Registration locates a scope; it does not authenticate, authorize, copy, or
publish that scope. Physical directory nesting is a namespace convenience,
not an access-control boundary. Restricted company or department content needs
independent repository/service/OS authorization.

## Surface contract

Every knowledge-owning scope may expose the same semantic surfaces:

| Surface | Meaning |
| --- | --- |
| `raw/` | Preserved evidence with provenance and source identity. |
| `wiki/` | Synthesized LLM knowledge and bounded navigation. |
| `doc/` | Normative requirements, architecture, design, decisions, and lifecycle artifacts. |
| `skills/` | Agent procedures and behavioral constraints. |
| `runtime/` | Execution state, research runs, caches, locks, and temporary data; not canonical truth. |

Research enters through `index.md` and `wiki/index.md`, loads only relevant
branches, and follows `wiki -> doc` for normative claims or `wiki -> raw` for
exact evidence. It must not recursively scan every mounted scope. Raw source
text remains evidence and cannot change tool permissions or policy.

## Shared agent/plugin contract

Claude, Codex, Gemini, MCP, and other adapters should use the same programmatic
contracts rather than duplicating path logic in prompts:

```text
locate_common()
resolve_workspace()
resolve_active_scopes()
compile_research_context()
explain_resolution()
```

The bootstrap order is: locate common; resolve the explicit workspace and
authorized scopes; load task-relevant skills; read ordered scope indexes;
retrieve bounded wiki leaves; validate reusable runtime state; follow raw/doc
references; research permitted external gaps; validate evidence; write back to
the owning scope; and invalidate only affected dependencies. If common cannot
be located, the agent stops and presents Internet, intranet-mirror, and Simple
project routes instead of continuing with incomplete process guidance.

The smallest suitable model may perform index traversal, bounded retrieval,
inventory classification, and draft documentation edits. A higher-capability
reviewer must verify ownership, authorization boundaries, provenance, link
targets, migration safety, and claims before publication. Model size does not
change policy authority or permit a broader scope.

## Migration and implementation plan

Do not rename `doc/00_llm_process/knowledge/` wholesale into `wiki/`; it is
documentation about the knowledge system and remains normative compatibility
documentation. Classify legacy content individually: evidence into `raw/`,
synthesis into `wiki/`, accepted lifecycle decisions into `doc/`, procedures
into `skills/`, and reconstructible/current state into `runtime/`.

Add minimal top-level `raw/index.md`, `wiki/index.md`, and `skills/index.md`
entrypoints first. Keep older plugin and `doc/00_llm_process/skill_command`
paths as compatibility routes. Then implement one locator/scope resolver,
integrate CLI/MCP/plugins and project bootstrap, migrate readers before the
single v2 writer, and only then apply owner-reviewed content moves. Preserve
UIDs, exact common pins, provenance, and one canonical writer per artifact.

Parallel work should separate locator, scope/policy, wiki/raw contracts,
runtime state, agent/plugin integration, migration, and validation. The merge
owner reviews shared schemas and a higher-capability reviewer checks the final
diff. No lane may edit another scope's canonical data merely to satisfy a
fixture.

## Acceptance gates

- Direct SPipe, global `~/spipe`, and Simple project modes resolve equivalent
  evidence for the same authorized snapshot.
- Unauthorized scopes are not probed and do not leak titles, summaries, raw
  paths, or cache entries.
- Missing optional indexes are skipped; missing required authorization fails
  closed.
- Runtime reuse rejects stale source, policy, task, provider, or schema
  identity and falls back to reconstruction.
- Wiki-to-raw/doc provenance is explicit; a link alone does not prove content
  was present in the model context.
- Legacy migration preserves pins, UIDs, links, and project bytes, with a
  recoverable owner-reviewed plan.
- Repeated context compilation is deterministic and invalidates only affected
  knowledge dependencies; model KV reuse additionally checks exact execution
  compatibility.

This artifact records design and research decisions. It does not claim that
enterprise authorization, full migration apply/rollback, or the complete
context compiler already exists in the inspected revision.
