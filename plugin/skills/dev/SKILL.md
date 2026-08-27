---
name: dev
description: Full feature development from intake through verified ship handoff.
---

# Dev

Use the sibling `sstack` skill for the full self-sufficient pipeline. Keep one
semantic change in one isolated session, require real SPipe evidence, and hand
off only a verified result to guarded sync/release planning.

<!-- spipe-self-review-guidance:begin -->
## SPipe self-review admission

GitHub forbids a pull-request author from submitting an `APPROVED` review on
their own pull request. Do not retry or claim a provider approval. SPipe uses a
different merge gate: the pinned broker emits the short-lived required check
`SPipe Self Review Admission` for one exact head, base, diff, and ruleset.

Eligibility is not automatic authorization. Use this path only when the user
requests or authorizes self-review. Ordinary reviewed code/text is
default-eligible, but an operator `deny` or `constrain` record and fixed
secret/self-review-authority restrictions always win.

Constrain scopes are `code`, `text`, exact `file`, immediate
`directory_files`, and recursive `directory_recursive`. A new push, base or
merge-base movement, diff change, retarget, ruleset or policy change, receipt
change, or expiry invalidates the decision/check and requires a fresh exact-head
review and evaluation.

Call `spipe_self_review_privilege_evaluate` first. On deny, report its exact
`reason_code`, matched policy/restriction IDs, affected paths, and
`remediation`; never bypass or weaken the gate. On allow, call the
compatibility-named `spipe_self_review_approve`, which emits only the SPipe
status check and never a GitHub pull-request approval.
<!-- spipe-self-review-guidance:end -->
