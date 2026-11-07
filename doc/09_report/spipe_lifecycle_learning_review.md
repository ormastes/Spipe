# Lifecycle learning review and evidence

Status: source implementation and independent source/manual review complete; runtime verification TEST_BLOCKED pending root-qualified runner. M5/M6 are not complete. Lane C owns no production host, provider projection or training job.

## Existing owner integration

The normative authority remains `doc/00_llm_process/knowledge/llm_wiki_scope_resolution.md` and `doc/00_llm_process/skill_command/skills/pipe/knowledge_ownership/skill.md`. A mounted path, supplied scope ID or cache key does not grant authority. New learning domain owner ports must be composed by these existing owners; they cannot replace scope resolution.

The existing record-first loop is `doc/00_llm_process/spipe/llm_finetune.md`. `cli/spipe.js:733` (`commandFineTuneRecordEval`) records `eval_results.sdn`; `:752` (`commandFineTuneRecordDecision`) records `decisions.sdn`, in `.spipe/llm-finetune-process`. These structural registry writes do not establish authenticated model evaluation. Root integration must authenticate receipts and bind existing attempt IDs before recording a proposal, without inventing another trainer or claiming a proposal changes deployed models.

## Historical pilot boundary

Repository-owned historical candidate: `doc/00_llm_process/spipe/self_review_policy_cross_repo_bug.md`, observed SHA-256 `ddb577d8f9ee314b53d523c1174862f11d4991c16fe6ae2ccdea082ecf6183a8`. The document records a schema-identity collision across Simple and SPipe and pins both source revisions. This provides a useful root-cause-family candidate; it does not provide de-identification/license/privacy clearance, a frozen cohort, scorer isolation, real repeated model solves or authenticated evaluation receipts. No private source was probed and no model replay was executed. Pilot remains BLOCKED until the host curator clears a cohort and the admitted evaluator records actual results.

## Review checklist

Reviewed four domain modules and all three spec/manual pairs independently of the Sol implementer. Source fixes from this review bind baseline/candidate prompt/wiki/skill/tool/context identities, require a strictly positive promotion gain threshold, cap claim collections, reject cross-partition duplicate evidence despite relabeled case metadata, and exercise the proposal admission tail through an asserting fixture owner. Review also replaced an unsupported negative matcher and removed the fixture's unconditional failure placeholder.

The source now checks authorization before discovery and protected owner methods, same-scope active alias targets, provenance passed unchanged to CAS, stale review content, default exclusion of non-active claims, family/repository/time/content partition separation and symptom-only result projection. Trial admission recomputes submitted metrics and checks every receipt before owner review and attempt recording. Confidence uses distinct incident counts rather than repeated runs; the trusted owner must additionally certify independent root-cause-family sampling. Numeric budgets are supplied policy inputs, not purported measured baselines.

Manual review: the three authored manuals describe operator actions, required rejection behavior and explicit production/test boundaries. They do not print synthetic outputs as real evidence, claim model equivalence, or claim runtime generation. They remain AUTHORED / NOT_RUN until actual docgen and maintain-scan evidence exists.

## Remaining release-blocking gaps

- Concrete host owner composition must implement atomic claim status/alias persistence and immutable provenance, scoped bounded reads, revocation, authenticated freeze/corpus isolation, scorer-only hidden answers, exact trial receipts and existing attempt registry writes. Fixture owner assertions are not durable-store evidence.
- Blinded projection accepts an operator-side freeze containing hidden metadata; the transport must never expose that full freeze to the evaluated agent. Expose only the two-field blinded result after authorization and freeze authentication.
- Distinct-case confidence assumes independent cases. Production admission must certify independent families or use a separately reviewed clustered estimator; relabeled repeated incidents must not inflate sample size.
- Partition and trial matching currently use bounded quadratic comparisons (at most 4,096 cases and 16,384 trial records). These are finite defensive caps, not realistic performance qualification. Root must measure realistic cohorts and optimize/index as indicated before NFR-003/REQ-010 admission.
- Claim read returns an empty array on denial or an exceeded cap. Transport must retain authorization/budget diagnostics and must not interpret this as proof a required scope has no knowledge.
- Real historical clearance/replay, model metrics, admitted compile/SSpec runs, branch coverage and generated-manual/maintain-scan verification remain outstanding. No actual training, public/private export or model promotion was performed.

## Concrete host binding investigation

The existing Simple CLI explicitly leaves fine-tune writes to `cli/spipe.js`; its `src/spipe_cli/core.spl` config/path helpers do not implement knowledge grants. Searches of the checkout found no implementation of normative `resolve_active_scopes` or `compile_research_context`. An adapter must not manufacture authority from those path helpers.

The inspected host `std.nogc_sync_mut.io.retained_file` exposes `retained_directory_open_trusted_v1(path)`, `RetainedDirectoryOwnerV1.open_file(name, maximum)` and `close`. The factory walks trusted no-follow directory descriptors on Linux; there is no retained-directory exclusive-create, append or atomic CAS writer. Generic `File.append` and `file_atomic_write_raw` use paths and do not establish retained-parent containment or transaction identity. This is the precise storage prerequisite for safe knowledge CAS and immutable proposal publication, including Windows support or explicit unsupported-platform rejection.

Minimum host integration requires an operator-issued scope/operation/resolved-root grant from the canonical knowledge owner, a retained trusted root handle, and an immutable publication transaction that authenticates the exact checked proposal. Updating the existing attempt owner's `eval_results.sdn` additionally requires its authorized safe writer. The existing eval writer accepts a textual `result`, so `proposal_pending_review` can be represented without recording `accepted` in `decisions.sdn`. None of these prerequisites may be replaced by a request boolean, path, unchecked digest or shell append.

## Shared Git proposal integration

The same Sol implementer added `registry.spl` and `persistence.spl`. Independent review confirmed imports and arguments against lane A's actual `workflow/git_artifact.spl`. `learning_prepare_eval_proposal` reuses the factored `learning_check_proposal`, authenticating all trials and owner review, then authenticates the exact existing attempt path/content digest. `learning_persist_eval_proposal` calls the same concrete `GitArtifactOwnerV1.commit_artifact` used by workflow, with kind `evaluation_proposal`, fixed scope/source/policy, a stable proposal UID and empty expected commit for create-only publication. It does not call `record_attempt` or append a registry.

Canonical encoding uses the host `sdn_encode_canonical`, preserving complete trial receipts, policy, recomputed metrics, scope and attempt source identity. Serialized `authenticated: false` prevents the artifact from claiming that text itself proves authority. The accompanying five-field evaluation projection has result `proposal_pending_review`; it is data for a future canonical-owner import, not an imported row. Four additional authored scenarios cover strict-parser round trips, escaping, altered source identity, unsafe attempt paths, forged summary recomputation and denied authority/trial/attempt binding.

There are six learning domain modules and four authored spec/manual pairs, with additional adversarial scenarios added during cross-review. This inventory is not an execution count. `capability_proposals.sdn` supplies five proposed canonical capability/role mappings for root's generator and excludes training, promotion, export and publication permissions. No generated provider file was edited by lane C.

The remaining end-to-end prerequisites are concrete `LearningOwnerV1` composition (canonical operator grant, authenticated frozen corpus/trials, immutable attempt bytes at the scoped revision) and admitted Git host process/environment/durability authority. Real commit/readback, concurrent/replay negatives, actual knowledge archival, registry import, compile/SSpec/docgen and historical replay remain NOT_RUN. A generic file write or source-only PASS cannot satisfy them.

## Independent cross-lane review

Lane B's Astra reviewer found two additional source defects: alias validation passed only the source record to the eventual commit, allowing the previously checked target to change before source CAS; partition checks compared like-role hashes but did not reject a training symptom identical to a held-out answer. The original Sol implementer repaired both with complete expected-target atomic revalidation and cross-role hash comparisons plus adversarial fixtures. Lane C reviewed target delivery, atomic owner contract, simulated target-change rejection and both cross-role leakage negatives. Runtime transaction races still require the concrete host writer and actual execution. These are source fixes, not runtime verification. Root's attempted full bootstrap stopped before compiler execution because available disk was below its mandatory floor; no threshold was bypassed.

Lane B independently accepted the source repairs after reviewing `claims.spl` SHA-256 `8975ccf71c32f1615c1d050857f6d8750d2b3efa66aa5e64d3e5425f02d919d4`, `contracts.spl` `4d1302fea93108b799c3bb967f4a40391c04a20d37c425db5c4a5e4e6a82b752` and `benchmark.spl` `a0c346f07581f9530d155108a2fa0d60f4695a89f2e11b517306f3995a17d8c3`, plus their adversarial fixtures. No remaining P0/P1 was identified in that bounded source review. The reviewer explicitly distinguished simulated owner rejection/argument propagation from actual concurrent backend CAS evidence, which remains NOT_RUN.

No compilation, SPipe execution, branch coverage, model equivalence, performance baseline or generated-manual PASS is claimed by this report. Fixtures test deterministic controls only. Overall milestones M0–M6 remain the destination.
