#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "doc/00_llm_process/spipe/self_review_skill.md";
const begin = "<!-- spipe-self-review-guidance:begin -->";
const end = "<!-- spipe-self-review-guidance:end -->";
const targets = Object.freeze([
  ".claude/skills/dev.md",
  ".claude/skills/sp_dev.md",
  ".codex/skills/dev/SKILL.md",
  ".codex/skills/sp_dev/SKILL.md",
  ".gemini/commands/dev.toml",
  ".gemini/commands/sp_dev.toml",
  ".claude/skills/release.md",
  ".codex/skills/release/SKILL.md",
  ".gemini/commands/release.toml",
  "doc/00_llm_process/skill_command/skills/pipe/self-review/skill.md",
  "doc/00_llm_process/skill_command/skills/pipe/release/repo_and_pull_req/skill.md",
  "doc/00_llm_process/skill_command/skills/pipe/release/skill.md",
  "plugin/skills/dev/SKILL.md",
  "plugin/skills/sp-dev/SKILL.md",
  "plugin/skills/release/SKILL.md",
  "plugin/skills/spipe/SKILL.md"
]);

function block(content, path) {
  const start = content.indexOf(begin);
  const finish = content.indexOf(end);
  if (start < 0 || finish < start || content.indexOf(begin, start + begin.length) >= 0 || content.indexOf(end, finish + end.length) >= 0) {
    throw new Error(`${path} must contain exactly one ordered self-review guidance block`);
  }
  return content.slice(start, finish + end.length);
}

const canonical = block(readFileSync(join(root, sourcePath), "utf8"), sourcePath);
const check = process.argv.slice(2).includes("--check");
const unknown = process.argv.slice(2).filter((arg) => arg !== "--check");
if (unknown.length) throw new Error(`unknown arguments: ${unknown.join(", ")}`);

const drift = [];
for (const target of targets) {
  const path = join(root, target);
  const content = readFileSync(path, "utf8");
  const projected = block(content, target);
  if (projected === canonical) continue;
  drift.push(target);
  if (!check) writeFileSync(path, content.replace(projected, canonical));
}

if (drift.length) {
  if (check) {
    console.error(`self-review guidance projection drift: ${drift.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log(`self-review guidance projected: ${drift.join(", ")}`);
  }
} else {
  console.log("self-review guidance projections: PASS");
}
