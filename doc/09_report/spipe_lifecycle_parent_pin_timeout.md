# Verified packaging fix: parent handoff landed after guard update

## Current result

Simple PR #7705 merged into `release/1.0.0` on 2026-11-07 at `07289867d86524cdc54b3c35d3531477a4c86f9e`. The release branch's actual `.spipe/spipe` entry was read back as `d83f03160925c76a6a6617f7e52c1ebb3c557fd0`. This packaging handoff is landed; the larger lifecycle implementation remains draft SPipe #34 with zero executed scenarios.

Another session had already landed guard change `aa56fbb348a5e2b2c9e2ee72757d284b1a2475d3`: batched tree-path resolution and committed-range push validation. Review confirmed that the range path checks readable commit endpoints, rejects empty/failed diffs, compares the full baseline for additions and rechecks affected sources. A real missing-base-blob negative fixture returned ERROR2; it did not produce a false PASS. No duplicate guard patch was made.

The unpublished pin was rebased onto release commit `8358d7ceb3ee5641cc1ee913dba9a0a6d49271de`, producing reviewed head `2d1f4eba9ba11aa9a684daf8ae8f2d80aae58188`. Its unchanged canonical push passed all eleven blocking gates in 23197 ms, including the private-import gate in 22415 ms. The landing check passed eleven quick ratchets and twenty registry integrity checks. No signed local-CI receipt was available; the configured push reported that explicitly. PR review found no P0/P1 in this packaging-only delta; the owner PR merge was used while server checks were pending. This is not a claim that those pending checks or lifecycle execution passed.

Receipts: `C:/dev/spipe-schema-pin-20261107-push-attempt2.log`, `C:/dev/spipe-schema-pin-20261107-land-attempt2.log`, and `C:/dev/spipe-schema-pin-20261107-landing.sdn`. The original timeout below is retained as historical evidence; its exact active fixture was not established.

## Original blocked attempt

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
