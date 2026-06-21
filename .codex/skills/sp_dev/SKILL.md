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
Vulkan on the same fixture. The wrapper records the selected Simple executable
as `gui_web_2d_vulkan_simple_bin`; a fresh Rust driver with macOS Vulkan loader
paths should report
`gui_web_2d_vulkan_simple_bin_selection_reason=macos-vulkan-loader-paths-present`.
Do not treat Electron or Chrome bitmaps as Vulkan proof when their logs record
`vulkan-angle-unavailable`, and do not claim RenderDoc completion without `.rdc`
files whose first bytes are `RDOC`. Windows and Linux GUI/web/2D RenderDoc
runbooks are intentionally deferred; add them later with the same evidence keys.
