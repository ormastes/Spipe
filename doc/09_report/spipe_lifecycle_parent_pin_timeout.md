# Verified packaging fix: parent handoff blocked

Observed 2026-11-07 on the Windows host. This is a concrete tooling/performance issue record, not a claim that the guard's semantic result is FAIL or PASS.

## Proven state

SPipe PR #35 merged commit `d83f03160925c76a6a6617f7e52c1ebb3c557fd0`. Its only source change adds `schemas/` to the npm files allowlist. The preimage had zero schema assets; an actual postimage tgz had all eleven canonical descriptors and every extracted/source SHA-256 comparison matched. Both upstream CI platforms passed. This does not qualify the larger lifecycle implementation.

The proposed Simple release/1.0.0 handoff is local commit `a732c09b9ed3481b91cce5a3e2827404fec50655` on `work/spipe-schema-pin-20261107`. It changes one gitlink from `026772fd0c53377cb2aaa1d28d1f268787c0f980` to `d83f03160925c76a6a6617f7e52c1ebb3c557fd0`. It does not contain draft SPipe #34.

## Actual refusal

The push used the configured release upstream through `HEAD:refs/heads/work/spipe-schema-pin-20261107`, an exact absent-ref lease, and `MUST_CHECK_PUSH_BUDGET_S=900`. The actual hook selected the one-commit range from `b7b3845d2e0a6e0811638965be9b2ca902a9791d` to the proposed pin. Structural quick ratchets and twenty-gate registry integrity passed. Earlier blocking push checks returned success.

The private-import baseline guard then returned exit 124 after 917450 ms, exceeding the enclosing 900000 ms budget. The hook explicitly reported its verdict UNKNOWN and refused the push. Total blocking batch observation was 926753 ms. A dangling-symlink self-test was noted unavailable on the host; that note is not proof of the timeout's cause. No evidence establishes whether the remaining cost came from fixtures, per-path materialization, filesystem contention or another helper.

Logs retained at `C:/dev/spipe-schema-pin-20261107-push.log` and `C:/dev/spipe-schema-pin-20261107-land.log`. Local source and fixtures were preserved; no hook bypass, timeout-to-pass conversion, unchecked remote ref creation or repeated larger-budget push was performed. No parent PR was opened because the work ref was not published.

## Follow-up acceptance

Diagnose the exact slow segment in `scripts/check/check-private-import-baseline.shs` on the pinned host/source; record phase timings and fixture/real-scan separation. Repair or establish an appropriate admitted slow-tier receipt without weakening private-visibility or sparse/index negative coverage. Then verify the changed guard once and renew the exact-head push/handoff evidence. Do not rerun already-green unrelated gates solely to occupy time, and do not classify missing/timeout evidence as passing.

The full lifecycle still has zero executed scenarios and the independent bootstrap disk-floor blockers. Resolving this parent packaging handoff alone does not complete M0–M6.
