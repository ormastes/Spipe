import { createReviewRequest, planReviewAdmissionValidation } from "../review/admission.js";

export function runReviewCommand(command, args) {
  if (!["review-request-create", "review-admission-validate"].includes(command)) return { handled: false };
  if (args.length !== 1) throw new Error(`${command} requires exactly one JSON object argument`);
  let input;
  try { input = JSON.parse(args[0]); } catch { throw new Error(`${command} input must be valid JSON`); }
  const result = command === "review-request-create"
    ? createReviewRequest(input)
    : planReviewAdmissionValidation(input);
  console.log(JSON.stringify(result, null, 2));
  return { handled: true };
}
