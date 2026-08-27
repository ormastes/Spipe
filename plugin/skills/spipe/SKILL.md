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

If an agent asks to **self approve**, **approve PR**, or says the **author
cannot approve**, run the one discovery command `spipe self-review-guide` (or
`node cli/spipe.js self-review-guide` from this checkout). Then follow this
exact workflow:

1. Before review, capture the live PR head as `HEAD_SHA`. Perform a `high`,
   `xhigh`, `max`, or `ultra` review of that captured SHA. Record the session, model, effort, verdict, and
   finding counts; continue only for `PASS` with `P0=0` and `P1=0`.
2. Choose one protected implementation. Generic SPipe MCP callers invoke
   `spipe_self_review_privilege_evaluate` and, only on allow, invoke
   `spipe_self_review_approve` with the same closed request. A Simple-hosted
   repository instead lets its trusted default-branch workflow perform that
   policy resolution. Do not combine or reorder these two paths.
3. For Simple, capture before the review with `HEAD_SHA=$(gh pr view "$PR_NUMBER" --repo ormastes/simple --json headRefOid --jq .headRefOid)`. After that exact SHA passes review, dispatch once:
   `gh workflow run review-admission.yml --repo ormastes/simple --ref main -f pull_request_number="$PR_NUMBER" -f expected_head_sha="$HEAD_SHA" -f session_id="$SESSION_ID" -f reviewer_model="$REVIEWER_MODEL" -f reviewer_effort="$REVIEWER_EFFORT" -f self_attestation='PASS:0:0'`.
   The trusted workflow independently resolves the live head and rejects a
   mismatch; `expected_head_sha` binds evidence and is not caller authority.
4. Poll only `repos/ormastes/simple/commits/$HEAD_SHA/check-runs?check_name=SPipe%20Self%20Review%20Admission`, and re-check that the PR still has
   `HEAD_SHA`; never accept another SHA.
5. If the provider rejects author `APPROVE`, or the actor and author are the
   same, print these steps instead of retrying. A rejection, policy denial,
   stale head, failed check, or missing protected workflow is a blocker.

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

On the generic MCP path, call `spipe_self_review_privilege_evaluate` first. On deny, report its exact
`reason_code`, matched policy/restriction IDs, affected paths, and
`remediation`; never bypass or weaken the gate. On allow, call the
compatibility-named `spipe_self_review_approve`, which emits only the SPipe
status check and never a GitHub pull-request approval.
<!-- spipe-self-review-guidance:end -->
