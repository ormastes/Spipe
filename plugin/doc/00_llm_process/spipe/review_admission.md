# SPipe Review Admission

SPipe exposes a non-mutating request and a fail-closed admission validator for
repository, pull-request, isolated-session, and feature reviews.

`review-request-create` accepts a closed `spipe-review-request/1` object. It
contains the repository, exactly one optional PR/session/feature selector, the
canonical required-check identities, review mode, and request identity. It
must not contain `head_sha`: the dedicated verifier broker resolves the live
head from provider-owned state.

`review-admission-validate` accepts a closed `spipe-review-admission/1`
receipt. Independent receipts record the high-capability verifier identity,
provider, model, service tier, effort, verdict, findings, exact head and checks,
audit and review digests, and issue/expiry times. Owner fallback is a distinct
mode, requires the pinned owner plus an independently issued unavailability
receipt, carries no review findings, and can never masquerade as an independent
review. Independent admission requires a PASS verdict and no P0/P1 findings.
The broker response and admitted output repeat the mode-specific verifier or
fallback evidence so the two modes remain mechanically distinguishable.

Admission requires both `SPIPE_REVIEW_BROKER_COMMAND` and
`SPIPE_REVIEW_BROKER_INTEGRATION_ID`. SPipe invokes that executable without a
shell. The broker must authenticate the receipt, re-resolve the repository/PR/
session/feature head, return the canonical required checks, and match the
pinned integration ID. Missing broker configuration, a changed head/check set,
an invalid audit receipt, an expired receipt, or an open P0/P1 finding on a
PASS verdict rejects. Only the broker may emit the `SPipe Review Admission`
status context. A repository owner or administrator cannot self-post PASS.
These variables are authoritative only in an operator-owned MCP server process;
they must not be caller-writable. The CLI deliberately ignores them and performs
shape/time planning only, returning `admitted: false` and `authoritative: false`.

Both commands return `mutation: none`. They do not create reviews, statuses,
checks, branches, commits, tags, releases, or package publications. Existing
release and npm environment approvals remain separate and mandatory.
