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

## Explicit diagnostic exceptions

When the user authorizes continuation past a time, memory or other policy check,
record the scoped instruction and exact disabled checker in a separate
DIAGNOSTIC attempt. Keep elapsed-time, memory, process-tree, progress and outcome
monitoring. Do not silently re-enable the disabled kill policy through an outer
wrapper. Use supported settings or a reviewed isolated diagnostic source change;
preserve the original failure receipt and do not keep asking for the same grant.

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
