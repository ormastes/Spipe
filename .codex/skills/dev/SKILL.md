---
name: dev
description: "Full feature development via /sstack: intake, research, design, SPipe specs, implementation, refactor, verify, and ship."
---

# Dev -- Full Feature Development

`/dev` runs the full SPipe/SStack feature-development pipeline.

Use it for features, bug fixes, refactors, and TODO implementation that should
move through intake, research, architecture/design, SPipe specs, implementation,
refactor, verification, and ship handoff:

```
/dev <description of what to build or fix>
```

## Dispatch

Follow the full SStack orchestrator procedure in `.claude/skills/sstack.md`.
`/dev`, `/sp_dev`, and `/sstack` are the same feature-development pipeline.

## GUI/Web/2D Vulkan Checks

For macOS GUI/web/2D rendering work, verify Vulkan/RenderDoc evidence through
`scripts/setup/setup-gui-web-2d-vulkan-env.shs`. Start with `--check`, then use
`--run` to compare Electron Chromium, original Chrome, and Simple Engine2D
Vulkan on the same fixture. This top-level runbook is macOS-only; add Windows
and Linux later with their own host notes and the same evidence keys. The
wrapper records the selected Simple executable as
`gui_web_2d_vulkan_simple_bin`; a fresh Rust driver with macOS Vulkan loader
paths should report
`gui_web_2d_vulkan_simple_bin_selection_reason=macos-vulkan-loader-paths-present`.
Do not treat Electron or Chrome bitmaps as Vulkan proof when their logs record
`vulkan-angle-unavailable`, and do not claim RenderDoc completion without `.rdc`
files whose first bytes are `RDOC`.

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

1. Resolve the live PR head and perform a `high`, `xhigh`, `max`, or `ultra`
   review of that exact head. Record the session, model, effort, verdict, and
   finding counts; continue only for `PASS` with `P0=0` and `P1=0`.
2. Dispatch the protected host workflow once with the PR number, session ID,
   reviewer model, reviewer effort, and `self_attestation=PASS:0:0`. In Simple:
   `gh workflow run review-admission.yml --ref main -f pull_request_number="$PR_NUMBER" -f session_id="$SESSION_ID" -f reviewer_model="$REVIEWER_MODEL" -f reviewer_effort="$REVIEWER_EFFORT" -f self_attestation='PASS:0:0'`.
3. Poll the check runs on the resolved head until `SPipe Self Review Admission`
   succeeds or fails. Never treat a check on another SHA as evidence.
4. If the provider rejects author `APPROVE`, or the actor and author are the
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

Call `spipe_self_review_privilege_evaluate` first. On deny, report its exact
`reason_code`, matched policy/restriction IDs, affected paths, and
`remediation`; never bypass or weaken the gate. On allow, call the
compatibility-named `spipe_self_review_approve`, which emits only the SPipe
status check and never a GitHub pull-request approval.
<!-- spipe-self-review-guidance:end -->
