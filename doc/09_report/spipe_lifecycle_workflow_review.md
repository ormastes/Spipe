# Astra workflow/trace review

Source review only; STATUS: TEST_BLOCKED. Reviewed by the lane supervisor,
separate from Sol implementation. No compiler, SSpec, durability, concurrency,
manual generation or performance PASS is asserted.

Reviewed actual store/status/trace modules, fixture and scenario source, manual,
and host graph validator/invalidation planner. The new layer calls existing gate
and transition functions and host graph validation/planning. Authorization occurs
before store lookup or graph validation. Returned successors must match the
admitted value; persistence errors propagate. Query edge authentication follows
whole graph/context authentication. Bounds reject rather than silently truncate.

Review findings addressed in source:

- Store owner is an explicit `mut` parameter; copied fixture state cannot serve
  as intended mutation evidence. Actual trait mutation still requires execution.
- Atomic commit carries context; fixture checks authoritative publication time
  and expiry. Production owner must enforce the same boundary durably.
- Persist failure is distinct from load failure and asserts unchanged state.
- Invalidation composes the host planner. Explicit graph closure is only for
  `depends_on`; production dependency inventory completeness is separate.
- Planning work preflight accounts for fixed-point passes and linear identity,
  membership and configuration probes. No measured latency claim follows.
- Scenarios include a three-node chain and dependency cycle, rather than naming
  a single edge a transitive test. Graph origins satisfy the reused host schema.
- Manual/report distinguish authored scenarios from generated execution evidence.

Remaining release-blocking dependencies are genuine: admitted runtime and
execution, durable atomic owner and crash/restart tests, canonical full receipt
identity, complete authenticated dependency producer, typed release/build graph
extension or checked companion, shared adapter composition, realistic incremental
index/performance and feature pilot evidence. Fixture digest identity policy is
not an admissible production receipt identity design. Snapshot validation on
every query is bounded source behavior, not an incremental-index performance win.

These sources advance lane A but do not complete M0–M6 or permit a finished-work
merge claim. Root owns combined review, integration and the required evidence.

## Concrete owner continuation

Root requested actual composition after the first port-oriented handoff. The
same Sol implemented a Git artifact owner, lifecycle policy adapter, full
canonical SDN bundle codec and checked build/release companion. The supervisor
reviewed their actual sources and shared the generic owner API with lane C.

The candidate uses host retained executable/cwd pins and exact-environment stdin
inspection. Fixed Git plumbing writes an immutable envelope blob, a tree and a
parent-linked commit, then updates only its hashed `refs/spipe/lifecycle/` ref
using expected-old CAS. This retains history through actual Git reachability,
instead of relying on a predecessor string inside a blob. Writes request object
and reference fsync; trusted platform/storage admission remains mandatory.

Further review findings addressed in source include retained pending process
leases across cleanup failures, refusal of new commands while cleanup is pending,
actual capability preflight, private arbitrary-version reads, bounded authorized
history traversal, full predecessor-state linkage and historical gate checks,
authoritative publication time, rejection of stderr warnings, and complete
immutable scope/source/policy envelopes. Release queries authenticate an explicit
requirement/criterion/test/symbol/observation/evidence chain and separate authenticated
build/verification/release identities without changing host graph kinds. Review
also caught invalid release fixture identity_scope/definition_id against the
existing host schema; final source now uses stable/test-fixture as required.

Exact host limitation: Windows `runtime_process_owned.c` capability provider near
line 6035 returns unavailable/ENOTSUP, cwd pin near 6044 returns zero, and pinned
inspection start near 6059 is unavailable. An admitted supported-host provider is
required; weaker process_run fallback is not acceptable. The frozen host branch
contains the relevant retained process APIs and traceability contracts; no host
source was changed by this lane.

Root must supply actual `GitArtifactHostAuthorityV1` and
`GitWorkflowHostAuthorityV1` policy implementations. These authenticate pins,
repository/config/alternate containment, exact environment, durability capability,
scope/key/source/policy grants, expiry and full lifecycle requirements. The
factory is not a request-supplied true bit. Constructors and API signatures are
documented in the Git owner design. No production grant currently exists.

All new scenarios remain NOT_RUN. Source composition does not establish Git
crash durability, process cleanup execution, mutable trait propagation, compiler
acceptance or native integration. Full history validation currently makes bounded
Git subprocess calls on status; incremental index/performance acceptance remains
unmet. No housekeeping result substitutes for these missing checks.

Final source inventory contains 28 authored `it` scenarios across four workflow
spec files; this is a source count, not executed case evidence. Generic Git owner
code has no in-memory substitute pretending to verify real persistence. Its
remaining integration/crash/concurrency/cleanup matrix is explicitly listed in
the manual and awaits an admitted host fixture.
