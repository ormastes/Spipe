import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  approveSelfReview, changedPathsManifestDigest, diffIdentityDigest, evaluateSelfReviewPrivilege,
  parseSelfReviewPolicy, planSelfReviewRequest, selfReviewSchemas
} from "../../src/review/self_review.js";
import { tools } from "../../mcp/protocol/tools.js";
import { tools as pluginTools } from "../../plugin/mcp/protocol/tools.js";

const head = "a".repeat(40); const baseHead = "9".repeat(40); const mergeBase = "8".repeat(40); const blob = "b".repeat(40); const receipt = "c".repeat(64); const authorizationReceipt = "e".repeat(64);
const now = new Date("2026-08-27T12:00:00.000Z");
function request(overrides = {}) { return { schema: selfReviewSchemas.request, repo_id: "42", pull_request: 7, session_id: "session-7", reviewer_id: "codex:session-7", reviewer_provider: "openai", reviewer_model: "gpt-5.6-sol", higher_model_receipt_digest: receipt, user_authorization_actor: "github:user:2378857", user_authorization_receipt_digest: authorizationReceipt, user_authorized_at: "2026-08-27T10:30:00.000Z", request_id: "self-review-7", ...overrides }; }
const policyAuthority = { type: "operator_owned_external", id: "github:user:2378857", key_id: "operator-key-1" };
function policy(...records) { return parseSelfReviewPolicy([JSON.stringify({ schema: selfReviewSchemas.policy_db, record_type: "header", default_allow: true, max_ttl_seconds: 86400, authority: policyAuthority }), ...records.map(JSON.stringify)].join("\n")); }
function change(path, overrides = {}) { return { status: "modified", old_path: path, new_path: path, old_blob_sha: blob, new_blob_sha: "d".repeat(40), old_mode: "100644", new_mode: "100644", semantic_flags: [], ...overrides }; }
function manifest(changes) { return { schema: selfReviewSchemas.path_manifest, repository: { provider: "github", id: 42, node_id: "R_42", name: "ormastes/Simple" }, pull_request_number: 7, head_sha: head, base_repository: { provider: "github", id: 42, node_id: "R_42", name: "ormastes/Simple" }, base_ref: "refs/heads/main", base_sha: baseHead, merge_base_sha: mergeBase, changes }; }
function authority(changes, overrides = {}) {
  const exactManifest = { ...manifest(changes), ...overrides.manifest }; const inputPolicy = overrides.policy || policy();
  return {
    integrationId: "github-app:31415",
    policy: inputPolicy,
    resolveSelfReview: () => { const manifestSha = changedPathsManifestDigest(exactManifest); const result = { schema: selfReviewSchemas.resolution, valid: true, integration_id: "github-app:31415", repo_id: "42", pull_request: 7, session_id: "session-7", request_id: "self-review-7", head_sha: head, base_repo_id: "42", base_ref: "refs/heads/main", base_sha: baseHead, merge_base_sha: mergeBase, diff_sha256: diffIdentityDigest(exactManifest, manifestSha), target_repo_id: "42", target_ref: "refs/heads/main", target_ruleset_id: "github:ruleset:123", strict_up_to_date: true, protected_target: true, manifest: exactManifest, changed_paths_manifest_sha256: manifestSha, policy_db_sha256: inputPolicy.policy_db_sha256, policy_authenticated: true, reviewer_id: "codex:session-7", reviewer_provider: "openai", reviewer_model: "gpt-5.6-sol", higher_model_receipt_digest: receipt, user_authorization_actor: "github:user:2378857", user_authorization_receipt_digest: authorizationReceipt, user_authorized_at: "2026-08-27T10:30:00.000Z", user_authorization_authenticated: true, review_verdict: "pass", p0_findings: 0, p1_findings: 0, issued_at: "2026-08-27T11:00:00.000Z", expires_at: "2026-08-27T13:00:00.000Z", ...overrides.resolution }; if (overrides.omit_resolution_field) delete result[overrides.omit_resolution_field]; return result; },
    admitSelfReview: (command) => { const result = { admitted: true, integration_id: "github-app:31415", repo_id: command.repo_id, pull_request: command.pull_request, session_id: command.session_id, request_id: command.request_id, head_sha: command.head_sha, base_repo_id: command.base_repo_id, base_ref: command.base_ref, base_sha: command.base_sha, merge_base_sha: command.merge_base_sha, diff_sha256: command.diff_sha256, target_repo_id: command.target_repo_id, target_ref: command.target_ref, target_ruleset_id: command.target_ruleset_id, strict_up_to_date: command.strict_up_to_date, protected_target: command.protected_target, changed_paths_manifest_sha256: command.changed_paths_manifest_sha256, user_authorization_actor: command.user_authorization_actor, user_authorization_receipt_digest: command.user_authorization_receipt_digest, user_authorized_at: command.user_authorized_at, policy_audit_digest: command.policy_audit_digest, status_context: "SPipe Self Review Admission", check_run_id: "check:99", admitted_at: "2026-08-27T12:00:00.000Z", expires_at: command.expires_at, invalidation_registered: true, invalidation_at: command.expires_at, invalidation_mode: command.invalidation_mode, ...overrides.admission }; if (overrides.omit_admission_field) delete result[overrides.omit_admission_field]; return result; }
  };
}
function subject(changes, overrides = {}) { const exact = manifest(changes); return { schema: selfReviewSchemas.subject_policy, record_type: "subject_policy", policy_id: "policy-1", effect: "deny", subject: { repository: exact.repository, pull_request_number: exact.pull_request_number, head_sha: exact.head_sha, session_id: "session-7", reviewer: { provider: "openai", id: "codex:session-7", model: "gpt-5.6-sol" } }, changed_paths_manifest_sha256: changedPathsManifestDigest(exact), higher_model_receipt_digest: receipt, allow_scopes: [], deny_scopes: [], issued_by: policyAuthority, issued_at: "2026-08-27T10:00:00.000Z", not_before: "2026-08-27T10:00:00.000Z", expires_at: "2026-08-27T14:00:00.000Z", previous_record_sha256: "0".repeat(64), signature: "a".repeat(64), ...overrides }; }

test("headless request plan cannot accept caller head or diff", () => {
  const planned = planSelfReviewRequest(request(), now);
  assert.equal(selfReviewSchemas.request, "spipe-self-review-request/2");
  assert.equal(planned.decision, "pending");
  assert.match(planned.provider_guidance.provider_review_reason, /GitHub forbids/);
  assert.match(planned.default_policy, /explicit user authorization evidence/);
  assert.deepEqual(planned.scope_kinds, ["code", "text", "file", "directory_files", "directory_recursive"]);
  assert.ok(planned.invalidation.includes("new head commit"));
  assert.throws(() => planSelfReviewRequest({ ...request(), head_sha: head }, now), /unknown fields: head_sha/);
  assert.throws(() => planSelfReviewRequest({ ...request(), changed_paths: [] }, now), /unknown fields: changed_paths/);
  const { user_authorization_receipt_digest: _receipt, ...missingAuthorization } = request();
  assert.throws(() => planSelfReviewRequest(missingAuthorization, now), /missing fields: user_authorization_receipt_digest/);
  assert.throws(() => planSelfReviewRequest(request({ user_authorization_receipt_digest: "bad" }), now), /authorization_receipt_digest/);
  assert.throws(() => planSelfReviewRequest(request({ user_authorized_at: "2026-08-27T12:01:00.000Z" }), now), /authorization evidence is not current/);
  assert.throws(() => planSelfReviewRequest(request({ schema: "spipe-self-review-request/1" }), now), /schema must equal spipe-self-review-request\/2/);
});

test("MCP and plugin expose identical headless evaluate/admit request schemas", () => {
  assert.deepEqual(pluginTools, tools);
  for (const name of ["spipe_self_review_privilege_evaluate", "spipe_self_review_approve"]) {
    const tool = tools.find((candidate) => candidate.name === name); assert.ok(tool);
    assert.equal(Object.hasOwn(tool.inputSchema.properties, "head_sha"), false);
    assert.equal(Object.hasOwn(tool.inputSchema.properties, "changed_paths"), false);
    assert.ok(tool.inputSchema.required.includes("user_authorization_receipt_digest"));
    assert.ok(tool.inputSchema.required.includes("user_authorized_at"));
  }
});

test("canonical policy DB v2 rejects both incompatible v1 shapes and authority ambiguity", () => {
  const simpleV1 = `${JSON.stringify({ schema: "spipe-self-review-policy-db/1", default_allow: true, max_ttl_seconds: 86400, authority: "operator_owned_external" })}\n`;
  const spipeV1 = `${JSON.stringify({ schema: "spipe-self-review-policy-db/1", record_type: "header", default_allow: true })}\n`;
  assert.throws(() => parseSelfReviewPolicy(simpleV1), /missing fields: record_type/);
  assert.throws(() => parseSelfReviewPolicy(spipeV1), /missing fields: max_ttl_seconds, authority/);
  const header = { schema: selfReviewSchemas.policy_db, record_type: "header", default_allow: true, max_ttl_seconds: 86400, authority: policyAuthority };
  const payload = JSON.stringify(header); const parsed = parseSelfReviewPolicy(payload);
  assert.equal(parsed.policy_db_sha256, createHash("sha256").update(payload).digest("hex"));
  assert.throws(() => parseSelfReviewPolicy(JSON.stringify({ ...header, max_ttl_seconds: 86401 })), /within 24 hours/);
  assert.throws(() => parseSelfReviewPolicy(JSON.stringify({ ...header, authority: { ...policyAuthority, type: "self_attested" } })), /operator_owned_external/);
  assert.throws(() => parseSelfReviewPolicy(` ${payload}`), /canonical non-empty JSONL/);
  const changes = [change("src/main.spl")];
  assert.throws(() => policy(subject(changes, { issued_at: "1787846400" })), /canonical UTC ISO timestamp/);
  assert.throws(() => policy(subject(changes, { expires_at: "2026-08-28T10:00:01.000Z" })), /max_ttl_seconds/);
  assert.throws(() => policy(subject(changes, { issued_by: { ...policyAuthority, id: "github:user:other" } })), /does not match the policy DB authority/);
  assert.throws(() => policy(subject(changes, { higher_model_receipt_digest: "self_attested" })), /higher_model_receipt_digest/);
  const oldFlat = subject(changes); delete oldFlat.subject; Object.assign(oldFlat, { repository_id: "42", session_id: "session-7", reviewer_id: "codex:session-7", issuer_key_id: "operator-key-1" });
  assert.throws(() => policy(oldFlat), /unknown fields/);
});

test("default allow covers ordinary code, text, and review policy after exact higher-model PASS", () => {
  const inputPolicy = policy(); const broker = authority([change("src/app/main.spl"), change("doc/guide.md"), change("src/review/admission.js")], { policy: inputPolicy });
  const decision = evaluateSelfReviewPrivilege(request(), inputPolicy, broker, now);
  assert.equal(decision.eligible, true); assert.equal(decision.reason_code, "default_allow_exact_review"); assert.match(decision.reason, /ordinary reviewed code\/text/); assert.match(decision.remediation, /user authorization/); assert.deepEqual(decision.matched_restriction_ids, []);
});

test("fixed secret, policy DB, and semantic authority restrictions cannot be overridden", () => {
  for (const [path, restriction] of [["config/.env.production", "SELF001"], [".spipe/self-review-policy.jsonl", "SELF005"]]) {
    const inputPolicy = policy(); const decision = evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change(path)], { policy: inputPolicy }), now);
    assert.equal(decision.eligible, false); assert.equal(decision.reason_code, "fixed_restriction"); assert.match(decision.remediation, /independent reviewer/); assert.deepEqual(decision.matched_restriction_ids, [restriction]);
  }
  const inputPolicy = policy(); const semantic = change("doc/deployment.md", { semantic_flags: ["credentials_or_secrets"] });
  assert.equal(evaluateSelfReviewPrivilege(request(), inputPolicy, authority([semantic], { policy: inputPolicy }), now).reason_code, "fixed_restriction");
  const authoritySemantic = change("doc/ordinary-name.md", { semantic_flags: ["self_review_authority"] });
  const authorityDecision = evaluateSelfReviewPrivilege(request(), inputPolicy, authority([authoritySemantic], { policy: inputPolicy }), now);
  assert.deepEqual(authorityDecision.matched_restriction_ids, ["SELF004"]);
  for (const [flag, restriction] of [["live_ruleset_or_environment_policy", "SELF002"], ["signing_or_publish_authority", "SELF003"], ["review_approval_policy_or_workflow", "SELF004"]]) {
    const semanticDecision = evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("doc/ordinary.md", { semantic_flags: [flag] })], { policy: inputPolicy }), now);
    assert.equal(semanticDecision.reason_code, "fixed_restriction"); assert.deepEqual(semanticDecision.matched_restriction_ids, [restriction]);
  }
});

test("subject deny wins and constrain scopes narrow default allow", () => {
  const deniedChanges = [change("src/main.spl")]; const deniedPolicy = policy(subject(deniedChanges));
  const subjectDecision = evaluateSelfReviewPrivilege(request(), deniedPolicy, authority(deniedChanges, { policy: deniedPolicy }), now);
  assert.equal(subjectDecision.reason_code, "subject_denied"); assert.match(subjectDecision.remediation, /new explicit scoped policy/);
  const allowedChanges = [change("src/app/main.spl")]; const allowedPolicy = policy(subject(allowedChanges, { effect: "constrain", allow_scopes: [{ kind: "directory_files", path: "src/app" }], deny_scopes: [{ kind: "file", path: "src/app/blocked.spl" }] }));
  assert.equal(evaluateSelfReviewPrivilege(request(), allowedPolicy, authority(allowedChanges, { policy: allowedPolicy }), now).eligible, true);
  const nestedChanges = [change("src/app/nested/main.spl")]; const nestedPolicy = policy(subject(nestedChanges, { effect: "constrain", allow_scopes: [{ kind: "directory_files", path: "src/app" }], deny_scopes: [] }));
  const constrained = evaluateSelfReviewPrivilege(request(), nestedPolicy, authority(nestedChanges, { policy: nestedPolicy }), now);
  assert.equal(constrained.reason_code, "constraint_not_satisfied"); assert.match(constrained.remediation, /narrow the pull request/);
  const blockedChanges = [change("src/app/blocked.spl")]; const blockedPolicy = policy(subject(blockedChanges, { effect: "constrain", allow_scopes: [{ kind: "directory_files", path: "src/app" }], deny_scopes: [{ kind: "file", path: "src/app/blocked.spl" }] }));
  const pathDenied = evaluateSelfReviewPrivilege(request(), blockedPolicy, authority(blockedChanges, { policy: blockedPolicy }), now);
  assert.equal(pathDenied.reason_code, "path_denied"); assert.match(pathDenied.remediation, /split the denied paths/);
});

test("rename evaluates both endpoints and symlink/traversal shapes fail closed", () => {
  const renamed = change("src/new/file.spl", { status: "renamed", old_path: "src/old/file.spl", new_path: "src/new/file.spl" });
  const constrainedPolicy = policy(subject([renamed], { effect: "constrain", allow_scopes: [{ kind: "directory_recursive", path: "src/new" }], deny_scopes: [] }));
  assert.equal(evaluateSelfReviewPrivilege(request(), constrainedPolicy, authority([renamed], { policy: constrainedPolicy }), now).eligible, false);
  const inputPolicy = policy();
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/../secret")], { policy: inputPolicy }), now), /traversal/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("link", { old_mode: "120000", new_mode: "120000" })], { policy: inputPolicy }), now), /symbolic link/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("module", { old_mode: "160000", new_mode: "160000" })], { policy: inputPolicy }), now), /submodule/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl", { old_mode: 100644 })], { policy: inputPolicy }), now), /Git mode/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl", { new_mode: "10064x" })], { policy: inputPolicy }), now), /Git mode/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl", { old_blob_sha: "" })], { policy: inputPolicy }), now), /old endpoint must be complete/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/new.spl", { status: "added", old_path: "", old_blob_sha: blob, old_mode: "" })], { policy: inputPolicy }), now), /old endpoint must be complete/);
});

test("broker-only approval emits an exact-head admission check, never a PR approval", () => {
  const inputPolicy = policy(); const broker = authority([change("src/main.spl")], { policy: inputPolicy });
  const admitted = approveSelfReview(request(), inputPolicy, broker, now);
  assert.equal(admitted.admitted, true); assert.equal(admitted.mutation, "provider_status_check"); assert.equal(admitted.status_context, "SPipe Self Review Admission"); assert.equal(Object.hasOwn(admitted, "provider_review_id"), false);
  assert.equal(admitted.provider_review_action, "none"); assert.match(admitted.provider_review_reason, /GitHub forbids/);
  assert.equal(admitted.expires_at, "2026-08-27T13:00:00.000Z"); assert.equal(admitted.invalidation_registered, true); assert.equal(admitted.invalidation_at, admitted.expires_at); assert.match(admitted.invalidation_mode, /fails_check_on_change_or_expiry/);
  assert.throws(() => approveSelfReview(request(), inputPolicy, { integrationId: "x", resolveSelfReview: broker.resolveSelfReview }, now), /admission broker/);
  const moved = authority([change("src/main.spl")], { policy: inputPolicy, admission: { head_sha: "e".repeat(40) } });
  assert.throws(() => approveSelfReview(request(), inputPolicy, moved, now), /head_sha mismatch/);
  const deniedChanges = [change("src/main.spl")]; const deniedPolicy = policy(subject(deniedChanges));
  assert.throws(() => approveSelfReview(request(), deniedPolicy, authority([change("src/main.spl")], { policy: deniedPolicy }), now), /\[subject_denied\].*remediation: Use an independent reviewer/);
});

test("resolution is exact, authenticated, current, and bound to the higher-model receipt", () => {
  const inputPolicy = policy();
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { review_verdict: "fail" } }), now), /higher-model PASS/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { policy_authenticated: false } }), now), /authenticate/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { user_authorization_authenticated: false } }), now), /explicit user authorization/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { user_authorization_receipt_digest: "f".repeat(64) } }), now), /user_authorization_receipt_digest does not match/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { head_sha: "e".repeat(40) } }), now), /manifest repository, PR, or head mismatch/);
  assert.throws(() => evaluateSelfReviewPrivilege(request({ session_id: "session-8" }), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy }), now), /session_id does not match/);
  assert.throws(() => evaluateSelfReviewPrivilege(request({ request_id: "self-review-8" }), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy }), now), /request_id does not match/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { base_repo_id: "77" } }), now), /base_repo_id does not match/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { base_ref: "refs/heads/release" } }), now), /base_ref does not match/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { merge_base_sha: "7".repeat(40) } }), now), /merge_base_sha does not match/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { diff_sha256: "f".repeat(64) } }), now), /diff identity mismatch/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, manifest: { base_repository: { provider: "github", id: {}, node_id: "R_42", name: "ormastes/Simple" } } }), now), /positive safe integer/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { changed_paths_manifest_sha256: 42 } }), now), /manifest digest mismatch/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { expires_at: "2026-08-28T10:31:00.000Z" } }), now), /authorization lifetime/);
});

test("admission re-resolution rejects session replay and base or diff retargeting", () => {
  const inputPolicy = policy();
  for (const admission of [
    { session_id: "session-8" }, { request_id: "self-review-8" },
    { user_authorization_actor: "github:user:8" }, { user_authorization_receipt_digest: "f".repeat(64) }, { user_authorized_at: "2026-08-27T10:31:00.000Z" },
    { base_repo_id: "77" }, { base_ref: "refs/heads/release" },
    { base_sha: "7".repeat(40) }, { merge_base_sha: "6".repeat(40) },
    { diff_sha256: "f".repeat(64) }, { target_repo_id: "77" },
    { target_ref: "refs/heads/release" }, { target_ruleset_id: "github:ruleset:999" },
    { strict_up_to_date: false }, { protected_target: false }, { expires_at: "2026-08-27T12:59:00.000Z" }
  ]) {
    assert.throws(() => approveSelfReview(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, admission }), now), /mismatch/);
  }
  assert.throws(() => approveSelfReview(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, omit_admission_field: "target_ruleset_id" }), now), /missing fields: target_ruleset_id/);
  assert.throws(() => approveSelfReview(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, admission: { invalidation_registered: false } }), now), /register fail-closed status invalidation/);
  assert.throws(() => approveSelfReview(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, admission: { invalidation_at: "2026-08-27T12:59:00.000Z" } }), now), /register fail-closed status invalidation/);
  assert.throws(() => approveSelfReview(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, admission: { invalidation_mode: "none" } }), now), /register fail-closed status invalidation/);
  assert.throws(() => approveSelfReview(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, admission: { admitted_at: "2026-08-27T12:01:00.000Z" } }), now), /not current at check emission/);
});

test("provider contract denies unprotected, non-strict, retargeted, or unprovable targets", () => {
  const inputPolicy = policy(); const changed = [change("src/main.spl")];
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority(changed, { policy: inputPolicy, resolution: { strict_up_to_date: false } }), now), /strict up-to-date/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority(changed, { policy: inputPolicy, resolution: { protected_target: false } }), now), /protected target/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority(changed, { policy: inputPolicy, resolution: { target_ref: "refs/heads/release" } }), now), /target repository\/ref/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority(changed, { policy: inputPolicy, resolution: { target_repo_id: "77" } }), now), /target repository\/ref/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority(changed, { policy: inputPolicy, resolution: { target_ruleset_id: "" } }), now), /target_ruleset_id/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority(changed, { policy: inputPolicy, omit_resolution_field: "target_ruleset_id" }), now), /missing fields: target_ruleset_id/);
});
