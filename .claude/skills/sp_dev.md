---
name: sp_dev
description: SPipe-prefixed full feature development alias for /dev and /sstack.
---

# SP Dev Skill -- Full Feature Development Alias

`/sp_dev` is the SPipe-prefixed alias for `/dev` and `/sstack`. It runs the
full feature-development pipeline: intake, research, architecture/design, SPipe
specs, implementation, refactor, verification, and ship handoff.

Use it when a command surface needs an explicit SPipe/SStack namespace while
keeping the same lifecycle behavior:

```
/sp_dev <description of what to build or fix>
```

Argument: `$ARGUMENTS`

## Dispatch

Read `.claude/skills/sstack.md` and execute its full orchestrator procedure
with the user request. There are no behavioral differences between `/sp_dev`,
`/dev`, and `/sstack`.

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
