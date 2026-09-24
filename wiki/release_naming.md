# Release task naming

A release task owns one stable name per release identity (`rc1`, `beta15`).

- Failed attempt → retry as `<name>_<N>`: `rc1_1`, `rc1_2`, and so on. Each
  suffix is one new `work/release/...` branch and worktree at the exact
  fetched target SHA.
- Never re-number the release (`rc2`) merely because an attempt failed. The
  prerelease number advances only when the release content version advances
  (a new beta, RC, or patch after publication or a content/policy/toolchain
  change), never as an error counter.
- The immutable candidate attempt counter (`candidate/vX.Y.Z-rc.N/aNNN`) is
  independent of the task-name suffix.

Canonical references: `doc/07_guide/infra/software_release.md` (Release task
retry naming) and the SPipe release skill
(`examples/05_stdlib/spipe/doc/00_llm_process/skill_command/command/release.md`,
Retry naming for release tasks).
