# LLM wiki scope resolution

**Status:** normative design for the next workspace revision, 2026-09-09.
Existing plugin capabilities are documented by their shipped entrypoints; this
contract does not claim a deployed enterprise policy or migration service.

## Common and workspace identity

A direct SPipe checkout, project-pinned common, and a global `~/spipe` checkout
expose the same common surfaces. Resolve common independently from the private
workspace. A direct checkout may be the logical workspace when explicitly
configured; ordinary setup must not infer permission to create private trees in
a source repository. A separate workspace uses `~/.spipe/common -> ~/spipe`.

The canonical global common is `~/spipe`. Simple's preferred project common route
is `.spipe/common`, pointing or resolving to that checkout. Discovery checks this
route before legacy `.spipe/spipe` and `.spipe/spipe_project` candidates. The shared
locator owns ordering and compatibility validation; prompt files consume its
resolved result. Establishing a host route does not itself change a recorded pin.

Preserve registered legacy `.spipe` and `.spipe/spipe` gitlinks and their exact
pins. Project requirements take precedence over an unrelated global revision.
Explicit invalid locations or incompatible pins produce diagnostics rather than
silently selecting another version. Read only named discovery candidates; never
crawl a home directory for similarly named repositories.

## Scope and surface contracts

Knowledge owners are common, company, organization, project, user, and host.
A company owns company-wide policy independently of its departments. Multiple
selected departments or projects retain explicit order and ownership; peer
conflicts require a decision instead of filesystem-order precedence.

| Surface | Authority and use |
| --- | --- |
| `raw/` | Observed evidence with origin, source UID/revision, observation time, hashes where feasible, rights and classification. |
| `wiki/` | Synthesized knowledge and bounded stable navigation, linked to supporting raw/doc artifacts. |
| `doc/` | Normative policies, requirements, architecture, decisions, and other canonical lifecycle artifacts. |
| `skills/` | Agent procedures, with declared extension points and preserved mandatory restrictions. |
| `runtime/` | Research execution state and caches; never canonical knowledge. |

Every existing traversable knowledge directory has `index.md`, including leaves.
Create scope surfaces lazily or as explicit bootstrap scaffolds. Keep repository
`README.md` and provider `SKILL.md` integration filenames. Existing
`doc/00_llm_process/knowledge/` documents the knowledge system and stays normative.
Classify individual legacy artifacts before selecting new raw/wiki/skills homes.

## Context compilation and research

Shared implementation targets are `locate_common()`, `resolve_workspace()`,
`resolve_active_scopes()`, `compile_research_context()`, and
`explain_resolution()`. CLI, MCP, plugin, and harness adapters call the same
contracts. A mounted scope or user-editable authority field cannot authorize a
read, write, provider export, or cache lookup.

1. Locate common and resolve the explicit workspace and trusted access decisions.
2. Select authorized company, organizations, projects, user, and host. Skip absent
   optional scopes; deny required unauthorized access before probing paths or
   revealing titles. Unavailable required policy stops protected operations.
3. Load task-relevant skills, then scope `index.md` and `wiki/index.md` in order:
   common → company → organizations → projects → user → host.
4. Traverse only relevant branches using bounded controller-owned traversal;
   retain original question, budgets, snapshot, visited identities and evidence.
5. Reuse matching runtime research state after validating its dependencies.
6. Follow `wiki -> doc` for normative claims and `wiki -> raw` for exact evidence.
   A manifest link alone does not establish source coverage.
7. Research remaining external gaps under export policy, preserving provenance.
8. Validate evidence, contradictions and applicability. Research workers propose
   updates; the authorized writer publishes them to the owning scope and refreshes
   only affected dependencies.

Knowledge composition preserves source disagreements. Preference fields have
schema-defined merge rules and origin explanations; mandatory constraints compose
restrictively. Host desired profiles remain distinct from timestamped observed
capabilities. None of these decisions is a generic last-file-wins merge.

## Runtime and cache semantics

```text
runtime/<user>/<host>/
├── cache/     reconstructible indexes, retrieval, summaries and KV metadata
├── state/     retained research runs, history, manifests and receipts
├── run/       live locks, sockets and coordination
└── tmp/       bounded temporary material
```

User-host paths organize state; OS/service authorization and security domains
provide isolation. Retention and privacy labels follow derived data. Cache cleanup
does not delete retained state or live coordination. Source identity, content
revision, applicable authorization, task/profile and serialization identity bound
reuse. Permission revocation denies lookup/use immediately even for unchanged
content. Validate summaries before promoting results to canonical knowledge.

Stable selected indexes and summaries are prefix candidates. Include raw evidence
only when selected. Logical knowledge invalidation follows actual dependencies;
exact KV reuse additionally depends on ordered tokens, model, tokenizer, adapter
and backend compatibility. Changing an early prompt segment invalidates the
dependent KV suffix even if later documents are unchanged. Unrelated leaf edits
must not rewrite every ancestor prefix. Runtime state is never the sole evidence
store, and a provider cache hit remains an observation rather than a promise.

## Write-back and acceptance

Public reusable knowledge belongs in common; company-wide material in company;
department material in organization; project artifacts in project; personal
knowledge in user; durable machine facts in host. Store account paths in private
user-host configuration. Keep one canonical writable artifact per UID. Derived
views route to it. Promotion requires a sanitized independent artifact and owner
authorization; rebalancing cannot cross ownership boundaries.

Required integration gates include equivalent evidence sets for the same question
and authorized snapshot in direct/global/project-pinned modes, no unauthorized
filesystem probes or metadata leaks, deterministic multi-scope order, stale runtime
rejection, optional-index handling, correct raw/doc provenance, and dependency-only
knowledge invalidation. These are acceptance targets, not test results claimed by
this document. See [setup](local_ownership_setup.md) and [migration](local_migration.md).
