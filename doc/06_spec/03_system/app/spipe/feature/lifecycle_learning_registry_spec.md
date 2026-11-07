# Existing attempt evaluation proposal projection

Status: AUTHORED / NOT_RUN. Manual counterpart of `test/03_system/app/spipe/feature/lifecycle_learning_registry_spec.spl`.

REQ-007 / REQ-008. Serialize a pending proposal for the existing attempt owner using the host canonical SDN encoder. Strict-parser round trips retain complete trials, model identities, receipt hashes, policy, recomputed metrics, scope and exact existing attempt path/content hash. Forged aggregate fields are ignored; escaped identity text remains escaped data. Invalid digests and attempt IDs containing paths fail.

Authenticate the proposal and existing attempt before retained persistence. Preparation requires checked trial receipts, owner review and an owner-verified exact existing attempt binding; denied authority invokes no protected owner methods. Synthetic fixtures exercise preparation only.

The persistence function uses the shared concrete admitted Git artifact owner for create-only immutable `evaluation_proposal` publication. This manual does not report executing it: trusted factory/admitted runtime and real Git receipt/readback are still required. No registry append, accepted decision, training or promotion occurred. The five-field `eval_results.sdn` projection is available for a future authorized canonical-owner import; serialization alone does not import it.
