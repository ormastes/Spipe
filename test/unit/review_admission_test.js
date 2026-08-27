import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { createReviewRequest, validateReviewAdmission } from "../../src/review/admission.js";
import { runReviewCommand } from "../../src/cli/review_commands.js";
import { checksDigest, reviewSchemas } from "../../src/review/contract.js";
import { callTool, tools } from "../../mcp/protocol/tools.js";
import { callTool as callPluginTool, tools as pluginTools } from "../../plugin/mcp/protocol/tools.js";

const root = resolve(fileURLToPath(new URL("../../", import.meta.url)));
const head = "a".repeat(40);
const hash = "b".repeat(64);
const now = new Date("2026-08-26T12:00:00.000Z");

function request(overrides = {}) {
  return {
    schema: reviewSchemas.request, repository: "ormastes/Simple", pull_request_number: 0,
    session_id: "", feature_id: "", required_checks: ["build", "unit"],
    mode: "independent_verifier", request_actor: "github:user:7", request_id: "review-7",
    ...overrides
  };
}

function receipt(overrides = {}) {
  return {
    schema: reviewSchemas.admission, mode: "independent_verifier", repository: "ormastes/Simple",
    pull_request_number: 7, session_id: "", feature_id: "", head_sha: head,
    required_checks: ["build", "unit"], findings: [], request_actor: "github:user:7",
    request_id: "review-7", issuer_integration_id: "github-app:31415",
    issued_at: "2026-08-26T11:00:00.000Z", expires_at: "2026-08-26T13:00:00.000Z",
    audit_receipt_sha256: hash,
    verifier: { kind: "high_capability_model", identity: "reviewer:codex", provider: "openai", model: "gpt-5.6-sol", tier: "priority", effort: "high", verdict: "pass" },
    review_receipt_sha256: "c".repeat(64), ...overrides
  };
}

function authority(expected = receipt()) {
  return {
    integrationId: "github-app:31415",
    resolveAndVerify() {
      const modeEvidence = expected.mode === "independent_verifier"
        ? { verifier: expected.verifier, review_receipt_sha256: expected.review_receipt_sha256 }
        : { reason: expected.reason, attestor: expected.attestor, unavailable_verifier_receipt_sha256: expected.unavailable_verifier_receipt_sha256 };
      return {
        valid: true, integration_id: "github-app:31415", repository: expected.repository,
        pull_request_number: expected.pull_request_number, session_id: expected.session_id,
        feature_id: expected.feature_id, head_sha: expected.head_sha, mode: expected.mode,
        required_checks: expected.required_checks, findings: expected.findings,
        request_actor: expected.request_actor, request_id: expected.request_id,
        issued_at: expected.issued_at, expires_at: expected.expires_at,
        audit_receipt_sha256: expected.audit_receipt_sha256,
        ...modeEvidence
      };
    }
  };
}

test("review requests cover repository, PR, session, and feature without trusting a caller head", () => {
  const cases = [
    ["repository", request()],
    ["pull_request", request({ pull_request_number: 42 })],
    ["session", request({ session_id: "local-20260826-001" })],
    ["feature", request({ feature_id: "FR-SPIPE-42" })]
  ];
  for (const [scope, input] of cases) {
    const planned = createReviewRequest(input);
    assert.equal(planned.scope, scope);
    assert.equal(planned.mutation, "none");
    assert.equal(planned.required_checks_sha256, checksDigest(input.required_checks));
    assert.equal(Object.hasOwn(planned.request, "head_sha"), false);
  }
  assert.throws(() => createReviewRequest({ ...request(), head_sha: head }), /unknown fields: head_sha/);
  assert.throws(() => createReviewRequest(request({ pull_request_number: 3, feature_id: "FR-3" })), /only one/);
});

test("admission uses the pinned broker result for exact head, checks, and audit", () => {
  const admitted = validateReviewAdmission(receipt(), authority(), now);
  assert.deepEqual(admitted, {
    schema: reviewSchemas.admission, admitted: true, mutation: "none", mode: "independent_verifier", scope: "pull_request",
    head_sha: head, required_checks: ["build", "unit"], findings: [], request_actor: "github:user:7", request_id: "review-7",
    issued_at: "2026-08-26T11:00:00.000Z", expires_at: "2026-08-26T13:00:00.000Z", audit_receipt_sha256: hash,
    verifier: receipt().verifier, review_receipt_sha256: "c".repeat(64),
    status_context: "SPipe Review Admission", status_emission: "broker_only"
  });
  assert.throws(() => validateReviewAdmission(receipt({ head_sha: "d".repeat(40) }), authority(), now), /broker head_sha/);
  assert.throws(() => validateReviewAdmission(receipt({ required_checks: ["unit"] }), authority(), now), /required checks/);
  assert.throws(() => validateReviewAdmission(receipt(), undefined, now), /authority is not configured/);
  assert.throws(() => validateReviewAdmission(receipt({ issuer_integration_id: "github-app:owner" }), authority(), now), /issuer integration/);
  assert.throws(() => validateReviewAdmission(receipt(), { ...authority(), resolveAndVerify: () => ({ ...authority().resolveAndVerify(), mode: "owner_attested_fallback" }) }, now), /broker mode/);
  assert.throws(() => validateReviewAdmission(receipt(), { ...authority(), resolveAndVerify: () => ({ ...authority().resolveAndVerify(), review_receipt_sha256: "d".repeat(64) }) }, now), /review_receipt_sha256/);
});

test("admission is closed, time-bounded, and blocks high findings on PASS", () => {
  assert.throws(() => validateReviewAdmission(receipt({ expires_at: "2026-08-26T11:30:00.000Z" }), authority(), now), /expired/);
  assert.throws(() => validateReviewAdmission(receipt({ issued_at: "2026-08-26T12:30:00.000Z" }), authority(), now), /not yet valid/);
  assert.throws(() => validateReviewAdmission(receipt({ expires_at: "2026-08-28T13:00:00.000Z" }), authority(), now), /at most 86400/);
  const p1 = { id: "finding-1", severity: "p1", path: "src/main.spl", summary: "blocking issue" };
  assert.throws(() => validateReviewAdmission(receipt({ findings: [p1] }), authority(), now), /cannot contain open p0 or p1/);
  assert.throws(() => validateReviewAdmission(receipt({ verifier: { ...receipt().verifier, verdict: "fail" } }), authority(), now), /must be pass for admission/);
  assert.throws(() => validateReviewAdmission({ ...receipt(), owner_approved: true }, authority(), now), /unknown fields: owner_approved/);
});

test("owner fallback is exact and does not masquerade as an independent model review", () => {
  const independent = receipt();
  const { verifier: _verifier, review_receipt_sha256: _review, ...common } = independent;
  const fallback = {
    ...common, mode: "owner_attested_fallback", reason: "no eligible independent reviewer",
    attestor: { type: "User", id: 2378857 }, unavailable_verifier_receipt_sha256: "d".repeat(64)
  };
  const admitted = validateReviewAdmission(fallback, authority(fallback), now);
  assert.equal(admitted.admitted, true);
  assert.equal(admitted.mode, "owner_attested_fallback");
  assert.deepEqual(admitted.attestor, fallback.attestor);
  assert.equal(admitted.unavailable_verifier_receipt_sha256, fallback.unavailable_verifier_receipt_sha256);
  assert.equal(Object.hasOwn(admitted, "verifier"), false);
  assert.throws(() => validateReviewAdmission({ ...fallback, attestor: { type: "User", id: 7 } }, authority(fallback), now), /pinned repository owner/);
  assert.throws(() => validateReviewAdmission({ ...fallback, verifier: independent.verifier }, authority(fallback), now), /unknown fields: verifier/);
  const p2 = { id: "finding-2", severity: "p2", path: "src/main.spl", summary: "non-blocking review issue" };
  assert.throws(() => validateReviewAdmission({ ...fallback, findings: [p2] }, authority(fallback), now), /cannot contain review findings/);
  assert.throws(() => validateReviewAdmission(fallback, { ...authority(fallback), resolveAndVerify: () => ({ ...authority(fallback).resolveAndVerify(), unavailable_verifier_receipt_sha256: "e".repeat(64) }) }, now), /unavailable_verifier_receipt_sha256/);
});

test("MCP advertises request and broker-only admission tools", () => {
  assert.deepEqual(pluginTools, tools);
  for (const name of ["spipe_review_request_create", "spipe_review_admission_validate", "spipe_review_capabilities"]) assert.ok(tools.some((tool) => tool.name === name));
  const planned = JSON.parse(callTool(root, "spipe_review_request_create", request({ feature_id: "FR-9" })).content[0].text);
  assert.deepEqual(callPluginTool(root, "spipe_review_request_create", request({ feature_id: "FR-9" })), callTool(root, "spipe_review_request_create", request({ feature_id: "FR-9" })));
  assert.equal(planned.scope, "feature");
  const liveReceipt = receipt({ issued_at: new Date(Date.now() - 60_000).toISOString(), expires_at: new Date(Date.now() + 3_600_000).toISOString() });
  const admitted = JSON.parse(callTool(root, "spipe_review_admission_validate", liveReceipt, { reviewAuthority: authority(liveReceipt) }).content[0].text);
  assert.equal(admitted.status_context, "SPipe Review Admission");
});

test("CLI cannot turn caller-controlled broker environment into admission authority", () => {
  const liveReceipt = receipt({ issued_at: new Date(Date.now() - 60_000).toISOString(), expires_at: new Date(Date.now() + 3_600_000).toISOString() });
  const writes = []; const originalLog = console.log;
  try {
    console.log = (value) => writes.push(value);
    runReviewCommand("review-admission-validate", [JSON.stringify(liveReceipt)], {
      SPIPE_REVIEW_BROKER_COMMAND: "/caller/fake-broker",
      SPIPE_REVIEW_BROKER_INTEGRATION_ID: liveReceipt.issuer_integration_id
    });
  } finally {
    console.log = originalLog;
  }
  const planned = JSON.parse(writes[0]);
  assert.equal(planned.admitted, false);
  assert.equal(planned.authoritative, false);
  assert.equal(planned.broker_verified, false);
});
