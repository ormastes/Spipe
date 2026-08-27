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

## Scoped self-review gate

After an exact-head higher-model PASS with no P0/P1, call
`spipe_self_review_privilege_evaluate` with the session and exact
reviewer/model/receipt digest, never a caller head/diff. On allow only,
`spipe_self_review_approve` emits the broker-owned
`SPipe Self Review Admission` check; it never submits a provider PR approval.
Require broker proof that the exact target repo/ref is protected by the bound
ruleset with strict up-to-date required-status enforcement. Missing proof,
base movement, retargeting, or ruleset replacement denies admission.
