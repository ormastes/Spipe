# Provider projection evidence

Inspected 2026-11-07. Current SPipe `scripts/project-self-review-guidance.js` and existing provider files establish the repository's Claude Markdown, Codex SKILL.md and Gemini command-TOML routes. The lifecycle planner preserves those formats rather than inventing a Gemini directory layout.

Kimi's official [skills source](https://github.com/moonshotai/kimi-cli/blob/main/docs/en/customization/skills.md) and [changelog](https://moonshotai.github.io/kimi-cli/en/release-notes/changelog.html) document repository skill discovery including `.kimi/skills` and the SKILL.md format. This informs a planned discovery adapter; it is not runtime installation or cross-provider equivalence evidence.

The canonical source is `skills/lifecycle/SKILL.md`; routing data is a separate dependency at `skills/lifecycle/references/phases.sdn`. The projection planner hashes only the canonical skill source. A complete phase/policy bundle must pin all dependencies separately before runtime admission. No empirical smaller-model equivalence or current model-training claim is derived from these sources.
