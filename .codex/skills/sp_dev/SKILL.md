---
name: sp_dev
description: "SPipe-prefixed full feature development alias for /dev and /sstack."
---

# SP Dev -- Full Feature Development Alias

`/sp_dev` is the SPipe-prefixed alias for `/dev` and `/sstack`. It runs the
full feature-development pipeline.

Use it when an explicit SPipe namespace is clearer for a feature, bug fix,
refactor, or TODO that should move through intake, research, design, SPipe
specs, implementation, refactor, verification, and ship handoff:

```
/sp_dev <description of what to build or fix>
```

## Dispatch

Follow the full SStack orchestrator procedure in `.claude/skills/sstack.md`.
There are no behavioral differences between `/sp_dev`, `/dev`, and `/sstack`.

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
