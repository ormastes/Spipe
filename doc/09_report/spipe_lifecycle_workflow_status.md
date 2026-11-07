# Workflow/trace lane A

STATUS: TEST_BLOCKED. Domain sources and executable scenario sources authored;
compiler, interpreter, native, mutation semantics, red/green, coverage, manual
generation and realistic pilot checks are NOT_RUN. The admitted runner is absent;
no rejected bootstrap candidate or Rust seed was executed.

Owned sources: `src/lifecycle/workflow/{store,status,trace,bundle_values,bundle,
git_artifact,git_owner,release_trace}.spl`. Owned specs/fixtures:
`test/03_system/app/spipe/feature/lifecycle_workflow_{fixtures,store_spec,
trace_spec,bundle_spec,release_fixtures,release_spec}.spl`.
Store spec assertions inspect publication through a `mut store` owner; actual
Simple trait mutation semantics still require admitted runtime verification.

Reused host contracts: `graph_types_v1`, `graph_schema_v1` and `incremental`.
Canonical bundle/envelope encoding additionally reuses host strict SDN parser
and canonical encoder. No additional parser, index or scheduler. Query authorization
precedes graph validation/access; graph and full accepted edge values require
trusted authentication. Directions preserve edge identity. No successful result
truncation. Host graph validation supplies typed relation and endpoint checks.

`invalidate_workflow_trace` is only the explicit `depends_on` reverse closure.
UIDs map to host planner `owner_path`/`key`, not filesystem paths. Move-only
locator changes preserve UID. Receipt reuse admission requires the production
owner's complete dependency classifier and `plan_workflow_invalidation`; that
function preserves `full_rebuild` and never claims rebuild execution. Missing
identity, unique identity, membership, configuration and policy/schema/extractor
changes remain represented by host planner inputs. Work preflight conservatively
bounds fixed-point passes and membership probes before host planning.

The in-memory fixture is test-only, single-threaded and has no durability claim.
Its digest-as-receipt-ID restriction is fixture policy, not production identity.
Production must use canonical authenticated full record identity; compare the
entire previous run; verify authoritative commit clock and exact context; reject
replay; publish immutable receipts/waivers and successor in one durable atomic
transaction; and return only after durability succeeds. Filesystem composition
and safe retained-directory handling belong to root.

Concrete local Git candidate now implements retained pinned process execution,
exact environment admission, complete canonical metadata/payload persistence,
commit/tree/parent-chain reachability, create-only initialization and CAS.
Pending process leases survive cleanup uncertainty and reject further commands
until explicit cleanup recovery. Native capability query fails closed before
Git execution. Lifecycle wrapper revalidates full historical gate chain and exact
previous run, trusted clock and commit-time expiry. Checked build/release
companion uses existing graph plus authenticated full link, without schema edits.
Pure bundle/release specs have real positive/negative assertions, NOT_RUN.

Open integration blockers: trusted root Git pins/config/storage/durability
admission factory and CLI/MCP/caret/CI composition; authenticated graph producer/index and
dependency classifier; realistic startup/request/RSS/invalidation measurements;
full M0–M6 pilot evidence. Current query validates a supplied bounded snapshot on
each call and has no warm persistent index performance claim. Status decisions
are explicitly unevaluated until explain receives authorized policy/evidence.

Root host API platform findings: `runtime_process_owned.c` Windows capability
implementation at 6035 reports unavailable/ENOTSUP, cwd pin at 6044 returns 0,
inspection start at 6059 is unavailable. Candidate queries actual capability
receipt and denies unsupported providers; it does not fall back to process_run.
Root reports no admitted runtime: disk preflight below threshold, archive bin
empty, WSL CreateInstance E_FAIL. Process field visibility and mutable retained
owner semantics follow existing host source patterns but await compiler/native
qualification. Git success/durability/crash/concurrency/cleanup integration and
cross-platform behavior are NOT_RUN. History verification is bounded full-chain
scanning (128 commits); this is not measured incremental index performance.

Actual housekeeping: `git diff --check` completed with exit 0 before final doc
addition; untracked lane files require root's final owned-file review. No test
PASS or production qualification is inferred from this check.
