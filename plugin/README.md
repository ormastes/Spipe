# Plugin

This directory contains plugin metadata for packaging SPipe as a reusable
agent-process module.

- `.codex-plugin/plugin.json` describes the skill, command, and MCP surfaces.
- `manifest.sdn` is a plain process manifest for non-Codex installers.

The canonical version is projected from `../release/version.sdn`. The plugin
includes guarded token-owned local sessions, read-only main fix discovery,
reviewed beta backports, release-first forward ports, immutable candidates,
promote-without-rebuild, and non-destructive withdrawal. The CLI and MCP
interfaces can fetch, create a local worktree/branch, and rebase only the clean
owned session after exact-state checks. They do not cherry-pick fixes or execute
builds, tags, protected-ref pushes, deletions, overwrites, or publication.
Installing the plugin does not confer protected repository or publication
authority.

The shipped CLI/MCP beta-backport planners accept only exact patch-equivalent
cherry-picks. Adapted backports fail closed as unsupported until an
authenticated adaptation-review broker is configured and exposed publicly.

The plugin also projects non-mutating repo/PR/session/feature review requests
and broker-verified `spipe-review-admission/1` validation. It cannot emit a
PASS status without separately configured dedicated broker authority in an
operator-owned MCP process. CLI receipt checks are shape/time planning only and
always remain non-authoritative.

GitHub forbids a pull-request author from submitting an `APPROVED` review on
their own PR. User-authorized self-review therefore uses
`spipe_self_review_privilege_evaluate` and the compatibility-named
`spipe_self_review_approve`. The request must include current explicit user
authorization evidence authenticated by the broker. Ordinary code/text is
default-eligible only after an exact-head higher-model PASS with no P0/P1,
subject to operator deny/constrain and fixed authority restrictions. The
approval-named tool emits `SPipe Self Review Admission` through the pinned
broker; it never submits a provider PR approval.
Both resolution and admission bind session/request IDs, base repository/ref/SHA,
merge base, and diff digest so receipt replay or PR retargeting fails closed.
The broker also binds the protected target repository/ref and ruleset ID and
must attest strict up-to-date required-status enforcement at resolution and
check emission. Providers that cannot prove this contract are denied. New
head/base/diff, retarget, ruleset/policy/review/authorization receipt change, or
expiry invalidates the result; the broker must register fail-closed status
invalidation. Denied decisions expose the exact reason, affected policy/path,
and remediation.
