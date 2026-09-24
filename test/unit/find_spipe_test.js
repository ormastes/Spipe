import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const locator = resolve("scripts/find-spipe.mjs");

function root(path, withGuides = false) {
  mkdirSync(join(path, "plugin", "skills", "spipe-research"), { recursive: true });
  writeFileSync(join(path, "package.json"), '{"name":"@simple-lang/spipe"}\n');
  if (withGuides) {
    for (const file of ["README.md", "index.md", "wiki/index.md", "skills/index.md",
      "docs/PLUGIN_AGENT_BOOTSTRAP.md", "docs/INTRANET_MIRROR_AND_DISCOVERY.md",
      "doc/00_llm_process/knowledge/index.md",
      "doc/00_llm_process/knowledge/local_ownership_setup.md",
      "doc/00_llm_process/knowledge/llm_wiki_scope_resolution.md"]) {
      mkdirSync(join(path, file, ".."), { recursive: true });
      writeFileSync(join(path, file), "fixture\n");
    }
    writeFileSync(join(path, "plugin", "skills", "spipe-research", "SKILL.md"), "fixture\n");
    mkdirSync(join(path, "doc", "00_llm_process", "skill_command", "skills"), { recursive: true });
  }
  return path;
}

function run(cwd, home, extra = {}, args = []) {
  const env = { ...process.env, HOME: home, USERPROFILE: home, ...extra };
  delete env.SPIPE_HOME;
  Object.assign(env, extra);
  return spawnSync(process.execPath, [locator, ...args], { cwd, env, encoding: "utf8" });
}

test("explicit SPIPE_HOME wins and an invalid explicit root fails closed", () => {
  const base = mkdtempSync(join(tmpdir(), "spipe locator "));
  try {
    const explicit = root(join(base, "explicit common"));
    const fallback = root(join(base, "home", "spipe"));
    const ok = run(base, join(base, "home"), { SPIPE_HOME: explicit });
    assert.equal(ok.status, 0);
    assert.equal(ok.stdout.trim(), explicit);
    assert.notEqual(ok.stdout.trim(), fallback);
    const bad = run(base, join(base, "home"), { SPIPE_HOME: join(base, "missing") });
    assert.equal(bad.status, 2);
    assert.match(bad.stderr, /SPIPE_HOME is not an identified SPipe package/);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("project common precedes home locations and legacy project mounts remain readable", () => {
  const base = mkdtempSync(join(tmpdir(), "spipe-locator-"));
  try {
    const home = join(base, "home");
    root(join(home, "spipe"));
    const project = join(base, "project");
    const common = root(join(project, ".spipe", "common"));
    const nested = join(project, "src", "nested"); mkdirSync(nested, { recursive: true });
    assert.equal(run(nested, home).stdout.trim(), common);
    rmSync(common, { recursive: true, force: true });
    const legacy = root(join(project, ".spipe", "spipe"));
    assert.equal(run(nested, home).stdout.trim(), legacy);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("home fallback order is ~/spipe then ~/.spipe/common", () => {
  const base = mkdtempSync(join(tmpdir(), "spipe-locator-"));
  try {
    const home = join(base, "home");
    const global = root(join(home, "spipe"));
    const linked = root(join(home, ".spipe", "common"));
    assert.equal(run(base, home).stdout.trim(), global);
    rmSync(global, { recursive: true, force: true });
    assert.equal(run(base, home).stdout.trim(), linked);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("agent guide exposes the common wiki, skills, guides, and compatibility knowledge", () => {
  const base = mkdtempSync(join(tmpdir(), "spipe-locator-"));
  try {
    const common = root(join(base, "common"), true);
    const result = run(base, join(base, "home"), { SPIPE_HOME: common }, ["--agent-guide"]);
    assert.equal(result.status, 0);
    const output = result.stdout.replaceAll("\\", "/");
    for (const path of ["wiki/index.md", "skills/index.md",
      "plugin/skills/spipe-research/SKILL.md", "docs/PLUGIN_AGENT_BOOTSTRAP.md",
      "doc/00_llm_process/knowledge/index.md", "doc/00_llm_process/skill_command/skills"]) {
      assert.match(output, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  } finally { rmSync(base, { recursive: true, force: true }); }
});
