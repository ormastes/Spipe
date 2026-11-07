# SPipe lifecycle requirements

Scope: the complete lifecycle proposal landed in Simple PR #7473. The user subsequently requested `impl`. This adopts the proposal's ten acceptance criteria; earlier delivery-order options do not narrow that scope. M0–M6 remain required. No implementation is declared complete by this document.

| ID | Required behavior |
| --- | --- |
| REQ-001 | Checked bidirectional requirement → scenario → test → symbol/build → verification → release trace, with stable identity and exact provenance. |
| REQ-002 | Hardening cannot become test-ready without verified failing positive and negative acceptance scenarios, unless an authorized scoped expiring waiver covers the gate. |
| REQ-003 | Missing tools, stale revisions/binaries, not-run results and invalid receipt dependencies fail closed. |
| REQ-004 | P1 incident workflow retains confidential dump manifests, hypotheses, reproducible and preventive tests, recovery evidence and reviewed lessons. |
| REQ-005 | Knowledge curation evaluates duplicate/false claims, archives with aliases, excludes superseded default retrieval and preserves provenance. |
| REQ-006 | Every new process rule has passing/adversarial fixtures and verified invocation at its owning phase. |
| REQ-007 | Frozen de-identified model evaluation isolates hidden answers, records exact model/skill/wiki/tool identities, repeated quality/safety/cost/latency metrics and escalation. |
| REQ-008 | Scope authorization precedes discovery, read, export and cache lookup; user-supplied private paths do not grant authority. |
| REQ-009 | Versioned canonical capability/phase validation is shared by provider adapters, CLI, MCP, caret and CI; unsupported surfaces fail closed. |
| REQ-010 | Incremental invalidation and bounded retrieval/scanning are measured on realistic fixtures; numeric budgets derive from actual baselines. |

The implementation must also deliver the eight schemas, read-only lifecycle doctor, shared state machine/receipts, compatible skill generation, operations/learning adapters, pilots and graduated enforcement specified by proposal milestones M0–M6. These are not optional follow-ups to the first core commit.

Authority: no new release tag/publication, production mutation, privileged dump export or model promotion is authorized by this implementation request. Existing protected PR integration remains authorized.
