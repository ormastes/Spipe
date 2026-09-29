# SPipe Guide

The canonical testing guide lives at:

**[doc/07_guide/testing/testing.md](../../07_guide/testing/testing.md)**

This file (formerly `doc/06_spec/app/compiler/spipe_guide.md`) is kept as a
pointer because the SPipe rename (2026-04-26) consolidated all skill+doc
material under `doc/00_llm_process/spipe/`.

For test-writing skill details see [`skill.md`](skill.md).
For the continuous-check loop see [`loop.md`](loop.md).
For provider review and self-review admission see
[`review_admission.md`](review_admission.md). GitHub authors cannot approve
their own pull requests; SPipe uses a separate short-lived exact-revision
required check and reports exact denial remediation.

## Deployment and private knowledge

Install SPipe core/common at `{home}/.spipe`. Keep private/local scopes, configuration,
and runtime under `{home}/spipe`, with `{home}/spipe/common` linked to `{home}/.spipe`
(a directory symlink, or a junction on Windows). `SPIPE_HOME` overrides core;
`SPIPE_WORKSPACE` overrides the private workspace. Explicit custom roots and
reviewed project pins remain supported.

From the identified core checkout, plan and then apply first-user setup.
Deployment scripts resolve literal `"{home}"` to the current account home on
Windows, Linux, macOS, and BSD. Keep the script executable path relative to the
checkout: shells do not expand `{home}` in a `node` script filename.

```sh
node scripts/setup-spipe-workspace.mjs init --interactive --dry-run --common "{home}/.spipe" --root "{home}/spipe"
node scripts/setup-spipe-workspace.mjs init --interactive --common "{home}/.spipe" --root "{home}/spipe" --apply
```

An existing inverse home layout needs reviewed migration; setup must not move
or overwrite private state automatically. See the [setup guide](https://github.com/ormastes/Spipe/blob/main/doc/00_llm_process/knowledge/local_ownership_setup.md),
[migration guide](https://github.com/ormastes/Spipe/blob/main/doc/00_llm_process/knowledge/local_migration.md), and
[LLM wiki scope contract](https://github.com/ormastes/Spipe/blob/main/doc/00_llm_process/knowledge/llm_wiki_scope_resolution.md).
