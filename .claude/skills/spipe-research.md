---
name: spipe-research
description: Locate SPipe common and load its scope-aware research skill, wiki, guides, and knowledge indexes.
---

# SPipe research bootstrap

Run `node scripts/find-spipe.mjs --agent-guide` from an identified SPipe
checkout, or the same script from the installed common package. Respect an
explicit `SPIPE_HOME`; otherwise discovery covers project `.spipe/common`,
`~/spipe`, `~/.spipe/common`, direct checkouts, and legacy project mounts.

Read every existing path printed by the locator, beginning with the canonical
`plugin/skills/spipe-research/SKILL.md`. Use its authorization, wiki traversal,
evidence, and owner-correct writeback rules. A discovered path is not access
authorization.
