# Build and debug continuation

Reusable workflow for long builds, compiler bootstraps and test matrices. Host
commands, worker counts, machine measurements and private receipts belong to
their project or host scope, not to this common guide.

## Finish the runnable graph

Freeze a finite inventory with dependencies and explicit output/cache owners.
Always run independently eligible modules, binary builds and tests to terminal
results. One failed operation does not cancel healthy siblings or erase later
failures. Record blocked prerequisites truthfully rather than inventing input
artifacts. Group collected failures by their first actionable cause and assign
independent repairs to parallel agents with separate writable ownership.

Keep logic, performance and resource-policy defects distinguishable. An idle
supervisor may be waiting on a busy child; inspect actual child progress before
diagnosing a stall. Backend thread count is not a safe frontend process count;
schedule using the selected shared host and enclosing job budgets.

## Memory and performance defects during build discovery

Keep collecting logic errors and failed objects when a memory/performance
problem affects an optional diagnostic. Assign its root cause, reproducer,
regression and eventual repair to a separate agent with explicit ownership;
use the user-selected model, such as Astra, when requested and available.
Do not require that background repair to finish before healthy independent
builds continue. A crash, corruption or invalid artifact remains a real failure;
only its dependent work is blocked, never silently marked successful.

For object campaigns, retain an entry-by-entry ledger: producer and source
identities, target/backend/runtime, original command and private cache owner,
object or first actionable error, dependencies and next affected-only retry.
Group shared causes without inventing one bug per object. Preserve compatible
successes and retry changed or failed rows rather than rebuilding everything.
Do not substitute another producer or a rewritten cache identity to obtain a hit.

## Explicit diagnostic exceptions

When the user authorizes continuation past a time, memory or other policy check,
record the scoped instruction and exact disabled checker in a separate
DIAGNOSTIC attempt. Keep elapsed-time, memory, process-tree, progress and outcome
monitoring. Do not silently re-enable the disabled kill policy through an outer
wrapper. Use supported settings or a reviewed isolated diagnostic source change;
preserve the original failure receipt and do not keep asking for the same grant.

Identify every nested checker before applying the exception so an outer
watchdog does not retain the very abort policy the user disabled. Keep other
required resource bounds and time budgets unless they have separate applicable
authorization. If a measurement check becomes nonblocking, preserve raw metrics
and report incomplete/unknown measurement evidence separately from the actual
child exit status; a zero child exit does not erase an OOM, crash or failed test.
Where continuation depends on an independent hard guard, verify that it bounds
all supervised work before launch and preserves OOM/escape failure reporting.

Use a live configuration interface only when the implementation supports it.
If it has no safe hot reload, keep useful work running and apply the reviewed
exception at the next actual affected-stage restart with its existing cache.
Record which checker is still active; never claim a live policy changed merely
because a future launcher or a background fix was prepared.

This exception is not permission to forge producer/source hashes, pass missing
inputs, suppress failed assertions, hide zero executed tests or perform unsafe
memory access. Retain every real failure and label altered inputs/descendants.
Restore normal required checks before formal admission, deployment or release.
Review/signing authorization and publication gates are not build-policy bypasses.

## Compiler continuation and restart

Before a new compiler starts its dependent provisional phase, require it to
compile a real Hello World program and require the output executable to run with
the expected output and exit status. Freeze the actual compiler identity and
both commands. A version string or linked binary is insufficient. Full
verification may continue alongside provisional work; descendants remain
unadmitted until their normal gates pass.

At the next actual restart, use the requested latest source branch plus reviewed
applicable unmerged fixes in an isolated frozen source owner. Coordinate with
other owners and preserve live builds. Reuse compatible persisted frontend/HIR,
native and tool caches; never share mutable cache writers or rewrite identity
stamps to admit stale entries. Record actual cache hits, not directory counts.

## Convergence and truthful completion

Use finite per-cause repair budgets and record explicit user-directed extensions.
Never loop identical failing commands without changed inputs or a concrete
diagnostic hypothesis; do not replay green checks for unchanged identities.
An exhausted cause leaves a failed/blocked row while unrelated collection
finishes. Stop at convergence and report actual assertion counts and terminal
PASS/FAILED/BLOCKED/SKIPPED outcomes. Required failures keep the aggregate
unsuccessful, even when diagnostic continuation produced useful artifacts.

Procedures: [SPipe execution](../plugin/skills/spipe/SKILL.md) and
[bounded repair loop](../plugin/skills/spipe-loop/SKILL.md).
