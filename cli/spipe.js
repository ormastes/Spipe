#!/usr/bin/env node
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function printUsage() {
  console.log(`Usage: spipe <command> [args]

Commands:
  info                 Print module paths and available surfaces.
  experts              List project, tool, and domain experts.
  link-plan [host]     Show host links that setup will manage.
  doctor [host]        Check module files and host link status.
  skill                Print the SPipe skill guide.
`);
}

function rel(path) {
  return path.replace(`${moduleRoot}/`, "");
}

function listDirs(root) {
  const abs = join(moduleRoot, root);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

const surfaces = [
  "doc/00_llm_process/skill_command",
  "doc/00_llm_process/spipe",
  "doc/00_llm_process/template",
  "doc/00_llm_process/project_expert",
  "doc/00_llm_process/domain_expert",
  "doc/00_llm_process/tool_expert"
];

function linkPlan(hostRoot = resolve(moduleRoot, "..", "..")) {
  return surfaces.map((surface) => ({
    surface,
    source: join(moduleRoot, surface),
    target: join(resolve(hostRoot), surface)
  }));
}

function commandInfo() {
  console.log(`spipe_module=${moduleRoot}`);
  console.log(`spipe_skill=${join(moduleRoot, "doc/00_llm_process/spipe/skill.md")}`);
  for (const surface of surfaces) {
    console.log(`surface=${surface}`);
  }
}

function commandExperts() {
  const roots = {
    project_expert: "doc/00_llm_process/project_expert",
    domain_expert: "doc/00_llm_process/domain_expert",
    tool_expert: "doc/00_llm_process/tool_expert"
  };
  for (const [name, root] of Object.entries(roots)) {
    const dirs = listDirs(root);
    console.log(`${name}=${dirs.length ? dirs.join(",") : "(none)"}`);
  }
}

function commandLinkPlan(hostRoot) {
  for (const item of linkPlan(hostRoot)) {
    console.log(`${item.surface}`);
    console.log(`  source=${item.source}`);
    console.log(`  target=${item.target}`);
  }
}

function commandDoctor(hostRoot) {
  let failures = 0;
  for (const surface of surfaces) {
    const source = join(moduleRoot, surface);
    if (!existsSync(source)) {
      failures += 1;
      console.log(`missing_source ${surface}`);
    } else {
      console.log(`source_ok ${surface}`);
    }
  }

  for (const item of linkPlan(hostRoot)) {
    if (!existsSync(item.target)) {
      console.log(`target_missing ${item.surface}`);
      continue;
    }
    const stat = lstatSync(item.target);
    const kind = stat.isSymbolicLink() ? "link" : stat.isDirectory() ? "directory" : "file";
    console.log(`target_${kind} ${item.surface}`);
  }

  console.log(failures === 0 ? "spipe_doctor=pass" : `spipe_doctor=fail missing=${failures}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

function commandSkill() {
  const path = join(moduleRoot, "doc/00_llm_process/spipe/skill.md");
  process.stdout.write(readFileSync(path, "utf8"));
}

const [command, arg] = process.argv.slice(2);
switch (command) {
  case undefined:
  case "--help":
  case "-h":
    printUsage();
    break;
  case "--version":
  case "-v":
    console.log("0.1.0");
    break;
  case "info":
    commandInfo();
    break;
  case "experts":
    commandExperts();
    break;
  case "link-plan":
    commandLinkPlan(arg);
    break;
  case "doctor":
    commandDoctor(arg);
    break;
  case "skill":
    commandSkill();
    break;
  default:
    console.error(`spipe: unknown command: ${command}`);
    printUsage();
    process.exitCode = 2;
}
