---
name: sstack
description: Run the self-sufficient eight-phase SPipe feature-development pipeline.
---

# SStack

Run these bounded phases in order: intake, research, architecture/design,
executable SPipe specification, implementation, refactor, verification, and
ship handoff. If an earlier artifact is missing, create it rather than failing.
Requirements remain user-selected. Each phase records its inputs, outputs, and
acceptance evidence; stop on an unresolved gate and never manufacture a PASS.
The ship phase submits an isolated work branch and uses the sibling guarded
release/sync skills rather than updating a protected ref directly.
