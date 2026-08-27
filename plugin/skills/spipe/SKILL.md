---
name: spipe
description: Write executable SPipe BDD specifications with real assertions and traceable evidence.
---

# SPipe

Write executable `*_spec.spl` scenarios under the host test tree and keep
generated/manual Markdown outside executable test paths. Use `describe`,
`context`, `it`, setup/teardown hooks, and built-in matchers. Every scenario
must exercise real behavior; reject placeholder passes, empty bodies, and
unimplemented steps. Trace requirement IDs to scenarios and regenerate the
human-readable manual from the admitted executable specification.

For repo, pull-request, session, or feature review requests, use the packaged
`spipe_review_request_create` planning tool. Never supply or trust a caller head
SHA. A PASS claim requires `spipe_review_admission_validate` with a configured
dedicated broker that re-resolves the live head/check set and matches its pinned
integration identity.

<!-- spipe-self-review-guidance:begin -->
## SPipe self-review admission

GitHub forbids a pull-request author from submitting an `APPROVED` review on
their own pull request. Do not retry or claim a provider approval. SPipe uses a
different merge gate: the pinned broker emits the short-lived required check
`SPipe Self Review Admission` for one exact head, base, diff, and ruleset.

Eligibility is not automatic authorization. The closed request must carry a
current user-authorization actor, timestamp, and receipt digest, and the broker
must authenticate and repeat that evidence. Ordinary reviewed code/text is
default-eligible only after that proof; operator `deny`/`constrain` records and
fixed secret/ruleset/signing/review-authority restrictions always win.

Constrain scopes are `code`, `text`, exact `file`, immediate
`directory_files`, and recursive `directory_recursive`. Admission binds its
expiry and requires the broker to register fail-closed check invalidation on
bound-input change or expiry. A new push, base or merge-base movement, diff
change, retarget, ruleset/policy/review/user-authorization receipt change, or
expiry requires a fresh exact-head review, authorization, and evaluation.

Call `spipe_self_review_privilege_evaluate` first. On deny, report its exact
`reason_code`, matched policy/restriction IDs, affected paths, and
`remediation`; never bypass or weaken the gate. On allow, call the
compatibility-named `spipe_self_review_approve`, which emits only the SPipe
status check and never a GitHub pull-request approval.
<!-- spipe-self-review-guidance:end -->
