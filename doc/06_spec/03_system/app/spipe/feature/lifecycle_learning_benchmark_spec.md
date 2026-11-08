# Frozen incident cohorts

Status: AUTHORED / NOT_RUN. Manual counterpart of `test/03_system/app/spipe/feature/lifecycle_learning_benchmark_spec.spl`; not generated runtime evidence.

REQ-007 / REQ-008. Freeze disjoint incident cohorts using exact case identities, chronological cutoffs and separate root-cause families and repositories. Reject future training evidence, shared families/repositories, duplicate symptom/answer hashes across partitions, changed frozen cases, missing clearance digests and duplicate IDs. Structural validation does not authenticate clearance.

Retrieve a blinded incident only after authorization and owner verification of the full freeze, cleared retrieval corpus and separate scorer storage. Output contains only UID and symptom SHA-256; its type has no answer or answer digest. Non-held-out cases and denied or unverified corpus reads return no value.

Cross-partition checks cover all symptom/answer pairings. A training symptom equal to a held-out answer, or training answer equal to held-out symptom, fails even when IDs, families and repositories differ. Authenticated corpus/scorer isolation is still required beyond these content-digest checks.

Fixtures are synthetic contract inputs. No historical dataset is cleared or replayed, no real scorer/trainer ran, and no answer-isolation or performance claim is made for host integration. Actual corpus authentication, generated-manual review and admitted runner remain blockers.
