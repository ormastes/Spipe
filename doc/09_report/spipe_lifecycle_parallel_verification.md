# Three-lane lifecycle verification — 2026-11-07

STATUS: FAIL — full lifecycle acceptance is not proven. Executable verification is TEST_BLOCKED. This report does not authorize a finished-work merge, runtime activation, model promotion or release publication.

## Team and source review

The user requested three Astra lanes with three Sol implementers. All six ran on the shared isolated branch defined in `doc/03_plan/agent_tasks/spipe_lifecycle_parallel.md`. Each Astra designed interfaces, reused one Sol implementer, and reviewed its actual changes. Astra learning and operations also cross-reviewed the other lane. Root reviewed integration and the skill projection planner.

- Workflow: canonical full bundle codec, status/next/explain, checked trace query/invalidation, retained pinned-process Git object/tree/commit/ref-CAS candidate, historical chain checks and typed release companion.
- Operations: incident transition state, restricted dump validation/slicing, retained local reader candidate and metadata-only offline summary. Its internal `spipe-incident-state/1` is distinct from the existing aggregate `spipe-incident/1` manifest.
- Learning: claims/aliases, family/repository/time/hash partition checks, blinded case projection, repeated-trial summaries and immutable proposal persistence bound to existing attempts. No existing registry append, training, promotion or real replay is claimed.
- Root: canonical lifecycle skill/routing data and deterministic provider projection planning. No generated provider copy was installed and no generation execution is claimed. The source digest covers SKILL.md, not its entire referenced phase/policy bundle.

Source findings repaired and separately reviewed include dump callback revocation, masked grant-negative test preconditions, alias-target TOCTOU contract, cross-role benchmark hash overlap, incomplete skill frontmatter and incident schema-family collision. The lane review reports retain exact inspected hashes and remaining host obligations. These reviews are not compiler or runtime PASS results.

Root also added the existing `schemas/` directory to the npm package allowlist; it was absent even though canonical schema readers require those artifacts. npm's required JSON manifest remains interoperability configuration. This packaging fix does not install missing plugin projections or qualify the runtime.

The packaging fix was separately verified and merged upstream as SPipe PR #35. Its Simple release pin was refused when the existing private-import baseline guard overran the 900-second push budget and returned UNKNOWN. The concrete tooling issue and exact local handoff identity are retained in `spipe_lifecycle_parent_pin_timeout.md`. No parent landing or full lifecycle qualification is claimed.

## Actual runtime attempts

Evidence is retained outside canonical documents under `C:/dev/spipe-lifecycle-runtime-evidence-20261107`.

1. Existing local candidate had failed sanity. Current x86-64 Linux and Windows phase-ladder jobs in run `42278875926` failed; a published release name is not admission. WSL Ubuntu returned `Wsl/Service/CreateInstance/E_FAIL`.
2. The v0.9.5 Windows archive matched published SHA-256 `561e70688257504854c6ca7b2f7aa1bdf3b99adf17a3420a711d9254c18a7bd9`. Its standard bin directory was empty; other archive paths were not exhaustively assessed and no admission was established. The rejected downloaded archive was removed after retaining this evidence.
3. Canonical full bootstrap, stopping after Stage 2, attempt 1 failed `disk-space(15GiB<20)` before Cargo or any compiler stage. No feature tests ran.
4. Root made the required `RetainedFile.close` visibility change in its isolated host branch, commit `1d5e0404507d5976eaad5b81f5fd67f1507d1e25`. This host fix is committed locally but is not compiled or landed.
5. After free space rose above 21 GiB, a fresh canonical bootstrap attempt 2 used that committed source. At the actual preflight, capacity had fallen again; it failed `disk-space(18GiB<20)` before Cargo or any compiler stage. Its terminal result and logs are retained. No further identical retry or threshold bypass is authorized by this report.

The startup includes silent preflight self-tests. Observation did not establish a runaway loop or a measured performance regression; the proven terminal cause is the disk guard. A sustained-capacity host or qualified runtime/admission receipt is needed before another executable attempt.

## Acceptance audit

| REQ | Current evidence and required remaining proof |
| --- | --- |
| 001 | Checked trace and release-companion source exists; no complete actual request-to-release run, persistent producer/index or backward trace execution. INCOMPLETE. |
| 002 | Positive/negative red gates and source scenarios exist; no observed red/green execution or authorized real waiver pilot. NOT_RUN. |
| 003 | Actual bootstrap failures remain failures; lifecycle binary/receipt/caps scenarios are authored but unexecuted. Partial failure-handling evidence is not criterion-wide PASS. |
| 004 | Restricted reader source and benign fixture exist; original historic raw dump/producer and verified recovery are absent. Decoder capabilities remain explicitly unsupported. INCOMPLETE. |
| 005 | Archive/alias/active retrieval source exists; no concrete admitted knowledge owner, concurrent durable CAS or live retrieval exclusion proof. INCOMPLETE. |
| 006 | Adversarial source cases and source reviews exist; compiled phase invocation, actual assertions, generated manuals and rule regressions have not run. NOT_RUN. |
| 007 | Frozen/summarized-trial and proposal code exists; no licensed cleared frozen replay, real matched large/small repeated model trials, or measured cost/latency/safety receipts. NOT_RUN. |
| 008 | Pre/post access checks are in source; retained-directory and pinned-process owners do not support the current Windows capabilities. Host grants and actual access-denial tests remain unqualified. INCOMPLETE. |
| 009 | Canonical routing/projection planner exists; CLI/MCP/caret/CI dispatch, actual generated provider installation and equivalent execution golden tests remain incomplete. |
| 010 | Security quotas and bounded candidate algorithms exist; no realistic startup/latency/RSS/token baseline or complete incremental dependency producer/index has been measured. NOT_RUN. |

## Release-blocking integration gaps

Concrete host grants must authenticate complete process/root/repository/storage/config/alternate/fsync identities, scope/key/source/policy and fresh expiry. An abstract `admit` or request boolean is not an operator grant. Windows currently reports unsupported V4 pinned process/cwd inspection; the retained-directory opener is also unsupported. No weaker process/path fallback is substituted.

Full M0–M6 remains in scope. In particular safe runtime/adapters and authoritative stores, canonical aggregate incident mapping, complete schema golden coverage, generated provider application/checking, real incident/model pilots, required manuals and measured NFRs remain blockers. Authored manuals are labeled NOT_RUN, not presented as docgen output. No CI green distribution check may be cited as lifecycle compilation or SSpec execution.
