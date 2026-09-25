# Release task naming

A release task owns one stable name per release identity, spelled as the
full version: `1.0.0-rc.1`, `2.0.0-beta.3` (shorthand `rc1`, `beta3` is the
same rule in short form).

- Failed attempt → retry as `<full-version>_<N>`: `1.0.0-rc.1_1`,
  `1.0.0-rc.1_2`, and so on (short form `rc1_1`, `1.0.0-rc1_1`). Each suffix
  is one new `work/release/<full-version>_<N>` branch and worktree at the
  exact fetched target SHA.
- Never re-number the release (`1.0.0-rc.2`, or short `rc2`) merely because
  an attempt failed. The prerelease number advances only when the release
  content version advances (a new beta, RC, or patch after publication or a
  content/policy/toolchain change), never as an error counter.
- The immutable candidate attempt counter (`candidate/vX.Y.Z-rc.N/aNNN`) is
  independent of the task-name suffix.

Canonical references: `doc/07_guide/infra/software_release.md` (Release task
retry naming) and the SPipe release skill
(`examples/05_stdlib/spipe/doc/00_llm_process/skill_command/command/release.md`,
Retry naming for release tasks).
