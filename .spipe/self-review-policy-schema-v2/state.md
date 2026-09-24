# Feature: self-review-policy-schema-v2

## Raw Request
Cross-repo P1: current Spipe/Simple self-review JSONL policy DB contracts incompatible (header fields/record_type, TTL/authority, identity nesting, timestamp format, higher-model vs self_attested). Audit exact current mains and design/implement canonical compatible schema or explicit adapter preserving fail-closed semantics, projections/tests/docs/plugin. Work in fresh isolated branches for each repo, push PR(s), no merge. Coordinate integration order and high-risk restrictions.

## Task Type
bug

## Refined Goal
Define and enforce one canonical, versioned self-review JSONL policy database contract in Spipe that Simple can consume without weakening expiry, authority, identity, timestamp, attestation, or fixed high-risk restrictions.

## Acceptance Criteria
- AC-1: Record the exact Spipe and Simple main SHAs and reproduce the current producer/consumer incompatibilities before source edits.
- AC-2: Claim the incompatibility in a tracked bug record before source edits, identify the authoritative owner, and document why the defect belongs at the policy boundary rather than a lower runtime layer.
- AC-3: Publish a closed canonical schema with explicit header and record types, UTC RFC3339 timestamps, bounded TTL, operator-owned authority identity, nested subject identity, higher-model receipt requirements, and no self-attested authority shortcut.
- AC-4: Reject unknown fields, missing/expired timestamps, overlong TTL, mismatched authority/identity, malformed receipts, self-attested records, and every fixed high-risk restriction fail closed.
- AC-5: Preserve compatibility only through an explicit, typed adapter whose accepted legacy shapes are enumerated and whose output is revalidated against the canonical schema; no heuristic or permissive fallback is allowed.
- AC-6: Root, plugin, CLI, MCP, generated Claude/Codex/Gemini/Pipe projections, and operator docs expose the same contract and remediation.
- AC-7: Focused adversarial tests cover the exact mismatch plus adjacent header, timestamp, TTL, identity, attestation, and authority-confusion cases; root/plugin parity and the full standalone build pass once.
- AC-8: Integration order is explicit: land Spipe canonical contract first, then land Simple consumption pinned to that schema; until both land, old Simple policy files remain rejected rather than silently upgraded.
- AC-9: Knowledge updates cover canonical Spipe operator docs and generated skills; Simple `doc/` research/design/guide and feature/layer expert entries are updated by the paired PR; no unrelated bug or TODO is created.

## Scope Exclusions
No provider review approval, release/signing authority, live ruleset mutation, secret handling, merge, or automatic policy-file rewrite.

## Cooperative Review
No sidecars: the active session policy forbids unrequested delegation. The root task owner is merge owner and final highest-capability reviewer. Shared interfaces are `spipe-self-review-policy-db/2` and `adaptSelfReviewPolicyDatabase`; manual flow is parse, adapt if explicitly legacy, revalidate, authorize; all unsupported paths fail closed.

## Phase
dev-done

## Log
- dev: Created state file with 9 acceptance criteria (type: bug).
