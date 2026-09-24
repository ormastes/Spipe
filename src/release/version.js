import { readFileSync } from "node:fs";
import { join } from "node:path";

const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-(?:alpha|beta|rc)\.[1-9][0-9]*)?$/;

function manifest(root) {
  const content = readFileSync(join(root, "release/version.sdn"), "utf8");
  const match = content.match(/^\s*semver:\s*(\S+)\s*$/m);
  if (!match || !SEMVER.test(match[1])) throw new Error("canonical SPipe version is missing or invalid");
  const projections = [...content.matchAll(/^\s*-\s+(\S+)\s*$/gm)].map((entry) => entry[1]);
  if (!projections.length || new Set(projections).size !== projections.length) throw new Error("canonical SPipe projection registry is empty or duplicated");
  return { version: match[1], projections };
}

function observedVersion(path, content) {
  if (path.endsWith(".json")) return JSON.parse(content).version || "";
  if (path.endsWith("release/version.sdn")) return content.match(/^\s*semver:\s*(\S+)\s*$/m)?.[1] || "";
  if (path.endsWith(".sdn")) return content.match(/^\s*version:\s*(\S+)\s*$/m)?.[1] || "";
  return "";
}

export function checkVersionAuthority(root) {
  const canonical = manifest(root);
  const drift = canonical.projections.filter((path) => {
    try { return observedVersion(path, readFileSync(join(root, path), "utf8")) !== canonical.version; }
    catch { return true; }
  });
  return { ...canonical, valid: drift.length === 0, drift };
}

export function canonicalVersion(root) {
  const result = checkVersionAuthority(root);
  if (!result.valid) throw new Error(`SPipe version projection drift: ${result.drift.join(",")}`);
  return result.version;
}
