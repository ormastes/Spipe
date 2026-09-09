---
name: knowledge-ownership
description: Set up and maintain common, company, organization, project, user, and host SPipe knowledge without copying or leaking owner-controlled content.
---

# SPipe knowledge ownership

1. Use the installed shared common locator and workspace resolver. Resolve only
   active authorized company, organization, project, user, and host scopes before
   reading them. A folder, mount, supplied user ID, or parent company does not
   grant access. Diagnose missing required authority before protected work.
   Canonical global common is `~/spipe`; Simple's preferred project route is
   `.spipe/common`. Preserve `.spipe/spipe` and `.spipe/spipe_project` as later
   compatibility candidates and validate project version requirements before use.
2. Load relevant procedures and enter each authorized scope through `index.md`
   and `wiki/index.md`. Select relevant branches with bounded traversal. Compose
   common, company, explicitly ordered organizations, explicitly ordered
   projects, user, then host with applicability and provenance preserved.
3. Choose surface and owner before writing: observed evidence goes to `raw/`,
   synthesized knowledge to `wiki/`, accepted decisions/specifications to `doc/`,
   and procedures to `skills/`. Projects keep lifecycle documents in their own
   repositories. A company is distinct from its departments; user-host mounts
   and account paths stay private configuration.
4. Follow wiki references to normative `doc/` and exact `raw/` evidence as needed.
   Validate source revisions and gaps; a link or prior summary is not proof that
   raw evidence was read. Reuse runtime only after source, scope, authorization,
   and execution-compatibility checks.
5. Change the smallest owner-authorized canonical artifact, preserve its UID and
   references, and refresh dependent navigation/summaries. Generated views remain
   derived. Mandatory policy cannot be weakened by user preferences.
6. Keep rebalancing within fixed ownership boundaries. Physical moves require a
   reviewed plan and owner authorization. Publishing to common creates a sanitized
   independent artifact with approved public evidence; keep private provenance in
   its originating scope. Repeated use is not publication permission.
7. Classify runtime retention: `cache/` is reconstructible, `state/` retains runs,
   history and receipts, `run/` coordinates live processes, and `tmp/` is temporary.
   Never erase the entire `runtime/<user>/<host>/` during cache cleanup. Verified
   results enter canonical knowledge only through the appropriate writer workflow.
8. Preserve existing common pins and legacy reads during migration. Classify
   mixed `local/` data explicitly; do not guess company/department ownership or
   convert registry formats by renaming files. Use one authoritative writer.

Read the applicable guide from the common root:

- `doc/00_llm_process/knowledge/local_ownership_setup.md` for current setup and
  proposed workspace capabilities.
- `doc/00_llm_process/knowledge/llm_wiki_scope_resolution.md` for scope/context
  composition, raw evidence, and runtime validation.
- `doc/00_llm_process/knowledge/local_migration.md` before changing legacy layout.
