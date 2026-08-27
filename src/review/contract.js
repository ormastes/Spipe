import { digest } from "../release/contract.js";

export const reviewSchemas = Object.freeze({ request: "spipe-review-request/1", admission: "spipe-review-admission/1" });
export const reviewCapabilities = Object.freeze({
  non_mutating_review_requests: true,
  server_resolved_review_heads: true,
  broker_verified_review_admission: true,
  external_review_mutation: false,
  default_allow_scoped_self_review: true,
  broker_only_self_review_admission_check: true,
  operator_owned_text_policy_db: true,
  provider_author_approval: false,
  user_authorized_self_review_only: true,
  structured_self_review_rejection_guidance: true
});

export const reviewRequestFields = Object.freeze([
  "schema", "repository", "pull_request_number", "session_id", "feature_id",
  "required_checks", "mode", "request_actor", "request_id"
]);
export const reviewAdmissionCommonFields = Object.freeze([
  "schema", "mode", "repository", "pull_request_number", "session_id", "feature_id",
  "head_sha", "required_checks", "findings", "request_actor", "request_id",
  "issuer_integration_id", "issued_at", "expires_at", "audit_receipt_sha256"
]);
export const independentAdmissionFields = Object.freeze([
  ...reviewAdmissionCommonFields, "verifier", "review_receipt_sha256"
]);
export const fallbackAdmissionFields = Object.freeze([
  ...reviewAdmissionCommonFields, "reason", "attestor", "unavailable_verifier_receipt_sha256"
]);

export function exactFields(input, fields, label) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error(`${label} must be a JSON object`);
  const unknown = Object.keys(input).filter((key) => !fields.includes(key)).sort();
  const missing = fields.filter((key) => !Object.hasOwn(input, key));
  if (unknown.length) throw new Error(`${label} contains unknown fields: ${unknown.join(", ")}`);
  if (missing.length) throw new Error(`${label} is missing fields: ${missing.join(", ")}`);
}

export function checksDigest(checks) {
  return digest({ domain: "spipe-review-required-checks/1", checks: [...checks].sort() });
}

export function reviewRequestDigest(request) {
  return digest({ domain: "spipe-review-request/1", request });
}
