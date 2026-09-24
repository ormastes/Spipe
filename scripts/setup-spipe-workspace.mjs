#!/usr/bin/env node
import { lstatSync, readdirSync, readFileSync, realpathSync, mkdirSync, symlinkSync, appendFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline/promises';
import { args, pathValue, present, safeRoot, managed, git, cleanPackage, isPackage, json, createFile, replaceJson, lock, cli, INITIAL_PIN, within } from './distribution-common.mjs';
import { install } from './install-spipe.mjs';

const surfaces = ['raw', 'wiki', 'doc', 'skills'];
const roots = ['companies', 'projects', 'users', 'hosts', 'runtime'];
function id(value, kind) {
  if (!value || !/^[a-z0-9][a-z0-9_-]{0,62}$/.test(value) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(value)) throw Error(`Invalid portable ${kind} ID`);
  return value;
}
export async function promptSetup(options, ask) {
  const answer = { ...options };
  answer.root ||= (await ask('Private workspace root [~/.spipe]: ')).trim() || join(homedir(), '.spipe');
  answer.user ||= (await ask('Stable user ID: ')).trim();
  answer.host ||= (await ask('Stable host ID: ')).trim();
  if (!Object.hasOwn(answer, 'company')) answer.company = (await ask('Company ID (empty for personal): ')).trim();
  if (answer.company && !answer.organizations) answer.organizations = (await ask('Organization IDs, comma separated (optional): ')).trim();
  if (!Object.hasOwn(answer, 'project-path')) answer['project-path'] = (await ask('Existing project Git root (empty for first-user setup): ')).trim();
  if (answer['project-path'] && !answer.project) answer.project = (await ask('Workspace-unique project ID: ')).trim();
  delete answer.apply;
  return answer;
}

export function workspaceSetup(options) {
  const root = pathValue(options.root || join(homedir(), '.spipe'));
  safeRoot(root);
  if (isPackage(root) || present(join(root, 'src'))) throw Error('Register a source repository from a separate private workspace');
  const user = id(options.user, 'user'), host = id(options.host, 'host');
  const company = options.company ? id(options.company, 'company') : null;
  const organizations = options.organizations ? [...new Set(options.organizations.split(',').map(value => id(value, 'organization')))] : [];
  if (organizations.length && !company) throw Error('Organizations require an explicit company');
  if (!!options.project !== !!options['project-path']) throw Error('project and project-path must be supplied together');
  const project = options.project ? id(options.project, 'project') : null;
  let projectPath;
  if (project) {
    projectPath = realpathSync(pathValue(options['project-path']));
    git(projectPath, ['rev-parse', '--show-toplevel']);
    if (within(root, projectPath) || within(projectPath, root) || git(projectPath, ['rev-parse', '--show-prefix'])) throw Error('Project must be an external Git worktree root');
  }
  const manifestPath = managed(root, 'workspace.json');
  const oldManifest = present(manifestPath) ? json(manifestPath) : null;
  if (oldManifest && (oldManifest.schema !== 2 || oldManifest.kind !== 'spipe-workspace' || typeof oldManifest.common?.path !== 'string' || !/^[a-f0-9]{40}$/.test(oldManifest.common.commit))) throw Error('Unsupported or invalid existing workspace manifest');
  const selected = options.common || process.env.SPIPE_HOME;
  const legacy = ['common', '.spipe/spipe', '.spipe'].map(path => join(root, path)).filter(path => isPackage(path));
  if (!selected && !oldManifest && legacy.length > 1) throw Error('Multiple common candidates; select --common explicitly');
  if (oldManifest && !within(root, pathValue(join(root, oldManifest.common.path)))) throw Error('Portable common path escapes workspace');
  const globalCommon = join(homedir(), 'spipe');
  const projectCommon = projectPath ? [join(projectPath, '.spipe/common'), join(projectPath, '.spipe/spipe'), join(projectPath, '.spipe/spipe_project'), join(projectPath, '.spipe')].find(isPackage) : null;
  const common = selected ? pathValue(selected) : oldManifest ? join(root, oldManifest.common.path) : legacy[0] || projectCommon || globalCommon;
  const exists = present(common);
  let commit = exists ? cleanPackage(common) : options['common-ref'] || INITIAL_PIN;
  if (!/^[a-f0-9]{40}$/.test(commit)) throw Error('common-ref must be a full lowercase commit hash');
  if (options['common-ref'] && options['common-ref'] !== commit) throw Error('Existing common pin differs from requested pin');
  if (oldManifest && oldManifest.common.commit !== commit) throw Error('Workspace pin differs; use a reviewed dependency update');
  const commonPath = within(root, common) ? relative(root, common).split('\\').join('/') : 'common';
  if (within(root, common) && !['common', '.spipe', '.spipe/spipe'].includes(commonPath)) throw Error('Use an approved common path or an external checkout');
  const route = join(root, commonPath);
  if (present(route) && (!exists || realpathSync(route) !== realpathSync(common))) throw Error('Common route conflicts with selected checkout');
  if (exists && within(root, common)) {
    const indexed = git(root, ['ls-files', '--stage', '--', commonPath], true);
    if (indexed && (!indexed.startsWith(`160000 ${commit} 0\t`) || indexed.split('\n').length !== 1)) throw Error('Common gitlink does not match its checkout');
  }
  const tracked = git(root, ['ls-files', '--', 'local', ...roots], true);
  if (tracked) throw Error('Private scope or runtime paths are tracked; review their ownership before setup');
  const files = new Map();
  const propose = (path, content, identity) => {
    const full = managed(root, path);
    if (present(full)) {
      if (!lstatSync(full).isFile()) throw Error(`Occupied scaffold file: ${path}`);
      if (identity) { const old = json(full); for (const [key, value] of Object.entries(identity)) if (old[key] !== value) throw Error(`Conflicting scope identity: ${path}`); }
    } else files.set(path, typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`);
  };
  const node = (path, title) => propose(join(path, 'index.md'), `# ${title}\n\nOwner-authored navigation. Registration does not grant authorization.\n`);
  const scope = (path, scopeId, kind, parent = null) => {
    const identity = { schema: 2, id: scopeId, kind, parent };
    propose(join(path, 'scope.json'), { ...identity, classification: 'private', authority: 'unconfigured' }, identity);
    node(path, scopeId);
    for (const surface of surfaces) node(join(path, surface), `${scopeId}: ${surface}`);
  };
  node('', 'Private SPipe workspace');
  for (const path of roots) node(path, path);
  if (company) {
    scope(`companies/${company}`, `company:${company}`, 'company');
    node(`companies/${company}/organizations`, 'Organizations');
    for (const org of organizations) scope(`companies/${company}/organizations/${org}`, `organization:${company}:${org}`, 'organization', `company:${company}`);
  }
  scope(`users/${user}`, `user:${user}`, 'user');
  scope(`hosts/machines/${host}`, `host:${host}`, 'host');
  node('hosts/profiles', 'Host setup profiles');
  const binding = `users/${user}/hosts/${host}`;
  for (const path of [`users/${user}/preferences.json`, `users/${user}/hosts/defaults.json`, `${binding}/preferences.json`, 'hosts/defaults.json']) propose(path, {});
  if (project) {
    const identity = { schema: 2, id: `project:${project}`, kind: 'project', owner: company ? `company:${company}` : `user:${user}` };
    propose(`projects/${project}/scope.json`, { ...identity, authority: 'unconfigured', classification: 'private' }, identity);
    node(`projects/${project}`, `Registered project ${project}`);
  }
  for (const category of ['cache', 'state', 'run', 'tmp']) managed(root, `runtime/${user}/${host}/${category}`);
  const mountsPath = managed(root, `${binding}/mounts.json`);
  const registryBytes = present(mountsPath) ? readFileSync(mountsPath, 'utf8') : null;
  const registry = registryBytes === null ? { schema: 2, user_id: user, host_id: host, mounts: {} } : JSON.parse(registryBytes);
  if (registry.schema !== 2 || registry.user_id !== user || registry.host_id !== host || !registry.mounts || Array.isArray(registry.mounts) || typeof registry.mounts !== 'object') throw Error('Conflicting user-host registry identity');
  const additions = { common: { path: exists ? realpathSync(common) : common, kind: 'common', commit } };
  if (project) additions[`project:${project}`] = { path: projectPath, kind: 'project', owner: company ? `company:${company}` : `user:${user}` };
  for (const [key, value] of Object.entries(additions)) {
    if (registry.mounts[key] && Object.entries(value).some(([field, item]) => registry.mounts[key][field] !== item)) throw Error(`Refusing conflicting mount rebind: ${key}`);
    registry.mounts[key] = { ...registry.mounts[key], ...value };
  }
  const ignorePath = managed(root, '.gitignore');
  const oldIgnore = present(ignorePath) ? readFileSync(ignorePath, 'utf8') : '';
  const ignores = [...roots, 'local', '.spipe-setup.lock', 'config.sdn'].map(path => `/${path}/`.replace('config.sdn/', 'config.sdn'));
  const missing = ignores.filter(line => !oldIgnore.split(/\r?\n/).includes(line));
  const plan = { operation: 'workspace-init', root, common, commit, user, host, company, organizations, project, create: [...files.keys()], register: Object.keys(additions), apply: !!options.apply };
  if (!exists) install({ ...options, checkout: common, workspace: root, 'common-ref': commit, apply: false, upstream: options['common-url'] || options.upstream });
  if (!options.apply) return plan;
  // Installation owns its own lock; scaffold writes acquire it only afterward.
  if (!exists) install({ ...options, checkout: common, workspace: root, 'common-ref': commit, apply: true, upstream: options['common-url'] || options.upstream });
  return lock(root, () => {
    if (cleanPackage(common) !== commit) throw Error('Common changed after planning');
    if ((present(mountsPath) ? readFileSync(mountsPath, 'utf8') : null) !== registryBytes) throw Error('Registry changed after planning');
    for (const [path, content] of files) createFile(managed(root, path), content);
    for (const category of ['cache', 'state', 'run', 'tmp']) mkdirSync(managed(root, `runtime/${user}/${host}/${category}`), { recursive: true, mode: 0o700 });
    if (!present(route)) symlinkSync(common, route, process.platform === 'win32' ? 'junction' : 'dir');
    if (!oldManifest) createFile(manifestPath, `${JSON.stringify({ schema: 2, kind: 'spipe-workspace', common: { path: commonPath, commit }, roots }, null, 2)}\n`);
    if (present(mountsPath) && readFileSync(mountsPath, 'utf8') === `${JSON.stringify(registry, null, 2)}\n`) { /* Existing exact registration. */ }
    else replaceJson(mountsPath, registry);
    if (missing.length) {
      const text = `${oldIgnore}${oldIgnore && !oldIgnore.endsWith('\n') ? '\n' : ''}${missing.join('\n')}\n`;
      // Only append ignore rules; never discard authored entries.
      if (present(ignorePath)) {
        if (readFileSync(ignorePath, 'utf8') !== oldIgnore) throw Error('Ignore file changed after planning');
        appendFileSync(ignorePath, text.slice(oldIgnore.length));
      } else createFile(ignorePath, text);
    }
    return plan;
  });
}

export function inspectLocal(options) {
  const root = pathValue(options.root || join(homedir(), '.spipe'));
  safeRoot(root);
  const base = managed(root, 'local');
  const entries = [];
  function walk(path) {
    for (const name of readdirSync(path).sort()) {
      const full = join(path, name), info = lstatSync(full);
      entries.push({ path: relative(root, full), kind: info.isSymbolicLink() ? 'link' : info.isDirectory() ? 'directory' : 'file', bytes: info.size, modified: info.mtime.toISOString(), classification: 'owner-review-required' });
      if (info.isDirectory() && !info.isSymbolicLink()) walk(full);
    }
  }
  if (present(base)) walk(base);
  return { operation: 'inspect-local', root, entries, apply: false };
}

cli(import.meta.url, async () => {
  const argv = process.argv.slice(2);
  const command = argv[0] && !argv[0].startsWith('--') ? argv.shift() : 'init';
  let options = args(argv, ['root', 'common', 'common-url', 'common-ref', 'user', 'host', 'company', 'organizations', 'project', 'project-path', 'config', 'source', 'mirror'], ['apply', 'dry-run', 'allow-local-source', 'interactive', 'help']);
  if (options.help) { console.log('setup-spipe-workspace.mjs init --user ID --host ID [--root PATH] [--company ID] [--organizations IDS] [--project ID --project-path PATH] [--common PATH] [--common-ref SHA] [--interactive] [--apply]\ninspect-local --root PATH inventories filenames only. Plan by default.'); return; }
  if (command === 'inspect-local') { if (options.apply) throw Error('inspect-local is read-only'); console.log(JSON.stringify(inspectLocal(options), null, 2)); return; }
  if (command !== 'init') throw Error('Expected init or inspect-local');
  if (options.interactive || (!argv.length && process.stdin.isTTY)) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) throw Error('Interactive setup requires a TTY; provide explicit flags for automation');
    const terminal = createInterface({ input: process.stdin, output: process.stdout });
    try {
      options = await promptSetup(options, question => terminal.question(question));
      console.log(JSON.stringify(workspaceSetup(options), null, 2));
      if (options['dry-run']) return;
      if ((await terminal.question('Apply this plan? [y/N] ')).trim().toLowerCase() !== 'y') return;
      options.apply = true;
    } finally { terminal.close(); }
  }
  console.log(JSON.stringify(workspaceSetup(options), null, 2));
});
