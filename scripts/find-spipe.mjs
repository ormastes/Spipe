#!/usr/bin/env node

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

function isSpipeRoot(path) {
  try {
    const packageJson = JSON.parse(readFileSync(join(path, "package.json"), "utf8"));
    return packageJson.name === "@simple-lang/spipe" && existsSync(join(path, "plugin"));
  } catch {
    return false;
  }
}

function projectCandidates(start) {
  const found = [];
  let current = resolve(start);
  while (true) {
    found.push(join(current, ".spipe", "common"));
    found.push(join(current, ".spipe", "spipe"));
    found.push(join(current, ".spipe", "spipe_project"));
    found.push(join(current, ".spipe"));
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return found;
}

const home = homedir();
const candidates = [];
if (process.env.SPIPE_HOME) {
  if (!isSpipeRoot(resolve(process.env.SPIPE_HOME))) {
    console.error(`SPIPE_HOME is not an identified SPipe package: ${process.env.SPIPE_HOME}`);
    process.exit(2);
  }
  candidates.push(process.env.SPIPE_HOME);
}
candidates.push(...projectCandidates(process.cwd()));
candidates.push(join(home, "spipe"));
candidates.push(join(home, ".spipe", "common"));
candidates.push(process.cwd());
candidates.push(join(home, ".spipe"));

const seen = new Set();
let root = null;
for (const candidate of candidates) {
  const absolute = resolve(candidate);
  if (seen.has(absolute) || !isSpipeRoot(absolute)) continue;
  seen.add(absolute);
  root = realpathSync(absolute);
  break;
}

if (!root) {
  console.error("SPipe common was not found.");
  console.error("Install ~/spipe from the approved Internet upstream or intranet mirror,");
  console.error("or configure Simple's .spipe/common route. Legacy nested mounts remain readable.");
  process.exit(2);
}

if (process.argv.includes("--agent-guide")) {
  console.log(`SPIPE_HOME=${root}`);
  for (const relative of [
    "README.md",
    "index.md",
    "wiki/index.md",
    "skills/index.md",
    "plugin/skills/spipe-research/SKILL.md",
    "docs/PLUGIN_AGENT_BOOTSTRAP.md",
    "docs/INTRANET_MIRROR_AND_DISCOVERY.md",
    "doc/00_llm_process/knowledge/index.md",
    "doc/00_llm_process/knowledge/local_ownership_setup.md",
    "doc/00_llm_process/knowledge/llm_wiki_scope_resolution.md",
    "doc/00_llm_process/skill_command/skills",
  ]) {
    const path = join(root, relative);
    if (existsSync(path)) console.log(path);
  }
} else {
  console.log(root);
}
