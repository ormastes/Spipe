# Workflow/trace lane A contract

Status: implementation contract, not executed evidence. M0–M6 remain in scope.

Reuse lifecycle contracts, gate evaluator and transition function. Reuse host
`std.common.traceability.graph_types_v1` and graph codec/schema functions; do not
introduce another graph serialization or parser. The existing SCV lifecycle
store overwrites `.scvl` files without CAS and is not an admissible receipt store.
Host filesystem composition belongs to root; a missing atomic owner fails closed.

## Public surface and ownership

All declarations crossing files are `pub`. `workflow/store.spl` owns:

- `WorkflowContextV1`: `authority_scope: text`, `source_revision: text`,
  `policy_sha256: text`, `now_ms: i64`.
- `WorkflowCommitV1`: `previous: LifecycleRunV1`, `next: LifecycleRunV1`,
  `receipts: [GateEvidenceV1]`, `waivers: [GateWaiverV1]`, `authority_scope: text`,
  `context: WorkflowContextV1` (supervisor-approved exact clock/context binding).
- `WorkflowStoreV1` trusted port: `fn authorize(self, context: WorkflowContextV1,
  run_id: text, operation: text) -> bool`; `me load(run_id: text) ->
  Result<LifecycleRunV1, text>`; `me commit_atomic(commit: WorkflowCommitV1) ->
  Result<LifecycleRunV1, text>`. Atomic owner checks entire previous run and exact
  context, rejects overwrite/replay, durably persists immutable receipt values
  with successor in one transaction, and returns only after durable success.
- `commit_workflow_transition(context: WorkflowContextV1, run_id: text,
  expected_generation: i64, target: text, requirements: [GateRequirementV1],
  receipts: [GateEvidenceV1], waivers: [GateWaiverV1], authority:
  LifecycleAuthorityV1, mut store: WorkflowStoreV1) -> Result<LifecycleRunV1, text>`.
  Authorize before load, check scope/source/policy binding, call existing
  transition evaluator, then atomic owner. No check-then-write file simulation.

`workflow/status.spl` owns `WorkflowStatusV1` containing run, next state and
gate decisions. `workflow_status(context, run_id, mut store) -> Result<WorkflowStatusV1,
text>` authorizes before loading. `workflow_next(state: text) -> Result<text,text>`
returns a suggested legal next phase, exceptional states explicitly need recovery
policy. `workflow_explain(run, requirements, receipts, waivers, authority, now_ms)
-> Result<[GateDecisionV1],text>` reuses gate evaluation; it does not grant commit.

`workflow/trace.spl` owns checked trace queries over host `TraceGraphV1`.
`WorkflowTraceAuthorityV1` trusted port authorizes scope before graph access and
authenticates full graph context and each accepted edge; inferred links never
count as evidence. `WorkflowTraceQueryV1` binds scope, source revision, policy
digest, node UID, relation, direction and positive result/work limits.
`query_workflow_trace(graph: TraceGraphV1, query: WorkflowTraceQueryV1,
authority: WorkflowTraceAuthorityV1) -> Result<[TraceGraphEdgeV1],text>` validates
host graph and allowed typed edges and supports both directions with identical
checked identities. Never return successful truncation.
`invalidate_workflow_trace(graph: TraceGraphV1, changed_uids: [text], max_work: i64)
-> Result<[text],text>` computes transitive reverse dependency closure using
stable UIDs and bounded work. Missing/duplicate IDs and quota exhaustion reject.
This is a pure closure over a supplied snapshot, not a new scheduler or index.
Content-change producers must provide changed UID set; move-only locators preserve
UID/content. Root owns persistent index producer integration and measurements.

The convenience closure covers explicit `depends_on` edges only. Production
receipt reuse requires `plan_workflow_invalidation(input: TraceInvalidationInput,
max_work: i64) -> Result<TraceInvalidation,text>` with owner-supplied complete
dependencies and classifier change sets. Preserve `full_rebuild`; callers must
actually rebuild before reuse. This composes the existing host planner.

Compose host `std.common.traceability.incremental.plan_trace_invalidation` for
closure, mapping stable UIDs into its artifact owner/key identity slots. Prebound
the worst-case work before calling the planner, and reject incomplete/full-rebuild
results instead of treating them as current cached facts. The host closed graph
schema has no release-artifact node; full REQ-001 release linkage requires a host
schema extension or an approved checked companion, owned by root integration.

## Error and fixture contract

Errors are stable nonempty text codes, including `workflow_unauthorized`,
`workflow_context_mismatch`, `workflow_store_conflict`, `workflow_store_unavailable`,
`trace_unchecked`, `trace_quota_exceeded`, plus existing evaluator errors. A failed
store operation never claims transition success. Port implementations are trusted
composition, never selected/deserialized from request booleans.

Only matching `lifecycle_workflow_*` specs and fixture files are lane-owned. Shared
fixture_run/requirement/evidence/waiver are reused. Public lane helpers:
`workflow_fixture_context`, `workflow_fixture_graph`, `workflow_fixture_query`;
fixture class names `WorkflowFixtureStoreV1`, `WorkflowFixtureTraceAuthorityV1`.
Manual `step` labels: "authorize workflow access", "commit checked transition",
"reject stale or replayed receipt", "query checked trace in both directions",
"invalidate changed dependencies", "explain blocked next phase". Specs assert
actual outcomes and counts, including denied access before lookup, conflict,
persist failure, forged/stale links, cycles, bounds and context mismatch.

Admitted runner, durable filesystem composition and realistic pilot are separate
required evidence. Missing runner is TEST_BLOCKED; authored specs are NOT_RUN.
