import { createReleasePlan } from "../release/planner.js";
import {
  assertPublicExactBetaBackport, planPublicVerifiedBetaBackport, planVerifiedCandidate, releaseSessionStart,
  releaseSessionStatus, releaseSessionSync
} from "../release/session.js";

const commandOperations = Object.freeze({
  "release-session-plan": "isolated-session",
  "release-beta-backport-plan": "beta-backport",
  "release-candidate-plan": "candidate",
  "release-promotion-plan": "promotion",
  "release-withdrawal-plan": "withdrawal",
  "release-main-fix-discovery-plan": "main-fix-discovery",
  "release-forward-port-plan": "forward-port"
});

export function runReleaseCommand(command, args) {
  const operational = {
    "release-session-start": releaseSessionStart,
    "release-session-status": releaseSessionStatus,
    "release-session-sync": releaseSessionSync,
    "release-beta-backport-verified-plan": planPublicVerifiedBetaBackport,
    "release-candidate-verified-plan": planVerifiedCandidate
  };
  const operation = commandOperations[command];
  const handler = operational[command];
  if (!operation && !handler) return { handled: false };
  if (args.length !== 1) throw new Error(`${command} requires exactly one JSON object argument`);
  let input;
  try {
    input = JSON.parse(args[0]);
  } catch {
    throw new Error(`${command} input must be valid JSON`);
  }
  if (operation === "beta-backport") assertPublicExactBetaBackport(input);
  console.log(JSON.stringify(handler ? handler(input) : createReleasePlan(operation, input), null, 2));
  return { handled: true };
}
