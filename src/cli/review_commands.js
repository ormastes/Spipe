import { createReviewRequest, validateReviewAdmission } from "../review/admission.js";
import { configuredReviewAuthority } from "../review/broker.js";

export function runReviewCommand(command, args, env = process.env) {
  if (!["review-request-create", "review-admission-validate"].includes(command)) return { handled: false };
  if (args.length !== 1) throw new Error(`${command} requires exactly one JSON object argument`);
  let input;
  try { input = JSON.parse(args[0]); } catch { throw new Error(`${command} input must be valid JSON`); }
  const result = command === "review-request-create"
    ? createReviewRequest(input)
    : validateReviewAdmission(input, configuredReviewAuthority(env));
  console.log(JSON.stringify(result, null, 2));
  return { handled: true };
}
