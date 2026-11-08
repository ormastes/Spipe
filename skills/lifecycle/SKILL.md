---
name: spipe-lifecycle
description: Coordinate a requested SPipe change, incident or learning workflow using canonical phase evidence and scoped authority. BDD spec authoring remains the separate spipe skill.
---

# SPipe lifecycle

Use the [phase map](references/phases.sdn) to route the requested workflow. This
skill is the canonical process source; provider copies are projections. It does
not authorize release publication, production mutation, dump export or training.

Before invoking a tool, inspect its actual capability/admission state. Current
source status is recorded in [the implementation report](../../doc/09_report/spipe_lifecycle_implementation_status.md).
An authored API, schema, spec or manual is not evidence that a command exists or
has executed. Unsupported owner, runtime or adapter capabilities stay blocked.

For a change, pin the source, selected REQ/NFR IDs and policy identity; choose the
next applicable phase from the existing run. Use the existing task/agent loop and
build runner. Submit exact evidence to shared lifecycle validation; do not create
another scheduler or duplicate validation in a provider wrapper. Gate outcomes
remain `pass`, `fail`, `waived` or `not_applicable`; `not_run` never means pass.

For incidents, preserve the timeline and restricted dump manifest before optional
analysis. Emergency containment can precede triage paperwork only with its own
checked authority/evidence; reconcile it before analysis. Root-cause confidence,
reproduction, prevention and recovery evidence are distinct. A metadata-only
offline reader cannot claim stack decoding or a successful historic replay.

For learning, resolve authorized ownership before discovery/read/cache retrieval.
Preserve archived claims and aliases with reviewed provenance. Keep hidden answers
outside replay input, split by root-cause family/time/repository and compare
repeated matched trials. Proposal recording is not model acceptance, training or
promotion. Reuse existing fine-tune attempt ownership and evaluation records.

Before advancing, bind receipts to run/generation, source, policy, executable,
selector and input identities. Recheck authority, expiry and atomic commit state;
inferred trace links and caller-authored verification flags cannot admit a gate.
Review the [knowledge authority](../../doc/00_llm_process/knowledge/llm_wiki_scope_resolution.md)
and [isolated VCS policy](../../doc/00_llm_process/skill_command/vcs_session_policy.md)
when their operations apply. Stop at a real unresolved gate and retain evidence.

Verification includes actual compiled/runtime cases, meaningful negative tests,
current manuals, applicable NFR measurements and exact-head review. Source-only
review and skipped runtime checks stay explicitly separate. Landing an approved
experimental foundation does not complete the full lifecycle roadmap.
