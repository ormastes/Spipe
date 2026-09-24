import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, realpathSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { install } from '../../scripts/install-spipe.mjs';
import { workspaceSetup, inspectLocal, promptSetup } from '../../scripts/setup-spipe-workspace.mjs';
import { syncMirror } from '../../scripts/sync-spipe-mirror.mjs';
import { source, config, git, args } from '../../scripts/distribution-common.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'spipe-distribution-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const upstream = join(root, 'upstream');
  mkdirSync(upstream);
  git(upstream, ['init', '-b', 'main']);
  git(upstream, ['config', 'user.email', 'fixture@example.invalid']);
  git(upstream, ['config', 'user.name', 'Fixture']);
  mkdirSync(join(upstream, 'plugin'));
  writeFileSync(join(upstream, 'plugin', 'index.md'), '# SPipe fixture\n');
  writeFileSync(join(upstream, 'package.json'), '{"name":"@simple-lang/spipe"}\n');
  git(upstream, ['add', '.']); git(upstream, ['commit', '-m', 'fixture']);
  const pin = git(upstream, ['rev-parse', 'HEAD']);
  const checkout = join(root, 'spipe'), workspace = join(root, 'workspace');
  const options = { upstream, checkout, workspace, source: 'internet', 'allow-local-source': true };
  const setup = { root: workspace, common: upstream, user: 'alice', host: 'build-01', company: 'acme', organizations: 'sw-dev,hr' };
  return { root, upstream, pin, checkout, workspace, options, setup };
}

test('installation plan is offline and creates no paths', t => {
  const f = fixture(t);
  const plan = install({ ...f.options, upstream: 'https://invalid.example/Spipe.git' });
  assert.equal(plan.apply, false);
  assert.equal(existsSync(f.checkout), false); assert.equal(existsSync(f.workspace), false);
});
test('installs exact pin, routes workspace common, and preserves pin on repeat', t => {
  const f = fixture(t), options = { ...f.options, 'common-ref': f.pin, apply: true };
  assert.equal(install(options).commit, f.pin);
  assert.equal(realpathSync(join(f.workspace, 'common')), realpathSync(f.checkout));
  assert.equal(install(options).commit, f.pin);
  assert.throws(() => install({ ...options, 'common-ref': 'a'.repeat(40) }), /pin differs/);
});
test('dirty and divergent global common updates are refused', t => {
  const f = fixture(t); install({ ...f.options, apply: true });
  writeFileSync(join(f.checkout, 'private.txt'), 'private');
  assert.throws(() => install({ ...f.options, apply: true }), /dirty/);
  rmSync(join(f.checkout, 'private.txt'));
  git(f.checkout, ['config', 'user.email', 'fixture@example.invalid']); git(f.checkout, ['config', 'user.name', 'Fixture']);
  writeFileSync(join(f.checkout, 'local.txt'), 'local'); git(f.checkout, ['add', '.']); git(f.checkout, ['commit', '-m', 'local']);
  const head = git(f.checkout, ['rev-parse', 'HEAD']);
  writeFileSync(join(f.upstream, 'remote.txt'), 'remote'); git(f.upstream, ['add', '.']); git(f.upstream, ['commit', '-m', 'remote']);
  assert.throws(() => install({ ...f.options, apply: true }), /merge failed/);
  assert.equal(git(f.checkout, ['rev-parse', 'HEAD']), head);
});
test('branch updater fast-forwards clean common', t => {
  const f = fixture(t); install({ ...f.options, apply: true });
  writeFileSync(join(f.upstream, 'next.md'), '# Next'); git(f.upstream, ['add', '.']); git(f.upstream, ['commit', '-m', 'next']);
  assert.equal(install({ ...f.options, apply: true }).commit, git(f.upstream, ['rev-parse', 'HEAD']));
});
test('credential URLs, unsafe protocols, duplicate options and unapproved local sources fail', () => {
  for (const value of ['https://token@example.invalid/repo', 'https://user:secret@example.invalid/repo', 'ssh://git:secret@example.invalid/repo', 'file:///tmp/repo', 'ext::command']) assert.throws(() => source(value));
  assert.throws(() => source('/tmp/repo'), /allow-local-source/);
  assert.throws(() => args(['--apply', '--apply'], [], ['apply']));
});
test('strict SDN grammar rejects unknown and duplicate fields', t => {
  const f = fixture(t), path = join(f.root, 'config.sdn');
  writeFileSync(path, 'spipe:\n  mirror: https://mirror.example/Spipe.git\n  allow_public_fallback: false\n');
  assert.equal(config({ config: path }).allow_public_fallback, 'false');
  writeFileSync(path, 'spipe:\n  token: secret\n'); assert.throws(() => config({ config: path }), /Invalid distribution SDN/);
  writeFileSync(path, 'spipe:\n  branch: main\n  branch: other\n'); assert.throws(() => config({ config: path }));
});
test('workspace plan is read-only, scaffold is repeatable, personal settings retained', t => {
  const f = fixture(t);
  assert.equal(workspaceSetup(f.setup).apply, false); assert.equal(existsSync(f.workspace), false);
  workspaceSetup({ ...f.setup, apply: true });
  const prefs = join(f.workspace, 'users/alice/preferences.json');
  writeFileSync(prefs, '{"model":"personal"}\n');
  workspaceSetup({ ...f.setup, apply: true });
  assert.equal(readFileSync(prefs, 'utf8'), '{"model":"personal"}\n');
  for (const owner of ['companies/acme', 'companies/acme/organizations/hr', 'users/alice', 'hosts/machines/build-01']) for (const surface of ['raw', 'wiki', 'doc', 'skills']) assert.ok(existsSync(join(f.workspace, owner, surface, 'index.md')));
  const manifest = JSON.parse(readFileSync(join(f.workspace, 'workspace.json'))); assert.equal(manifest.common.commit, f.pin);
});
test('projects register without mutation; rebinding rejected', t => {
  const f = fixture(t), project = join(f.root, 'project'); mkdirSync(project); git(project, ['init', '-b', 'main']);
  writeFileSync(join(project, 'owned.txt'), 'owner data');
  const before = git(project, ['status', '--porcelain']);
  const options = { ...f.setup, project: 'firmware', 'project-path': project, apply: true };
  workspaceSetup(options); assert.equal(git(project, ['status', '--porcelain']), before);
  const other = join(f.root, 'other'); mkdirSync(other); git(other, ['init', '-b', 'main']);
  assert.throws(() => workspaceSetup({ ...options, 'project-path': other }), /rebind/);
});
test('portable IDs, conflicting identities and symlinked private scopes rejected', t => {
  const f = fixture(t);
  assert.throws(() => workspaceSetup({ ...f.setup, user: 'con' }), /portable/);
  workspaceSetup({ ...f.setup, apply: true });
  const scope = join(f.workspace, 'users/alice/scope.json'); writeFileSync(scope, '{"schema":2,"id":"user:other","kind":"user","parent":null}');
  assert.throws(() => workspaceSetup(f.setup), /Conflicting scope identity/);
  const other = join(f.root, 'linked-workspace'); mkdirSync(other); symlinkSync(f.workspace, join(other, 'users'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => workspaceSetup({ ...f.setup, root: other }), /symlink/);
});
test('read-only local inventory does not follow links or read bodies', t => {
  const f = fixture(t); mkdirSync(join(f.workspace, 'local'), { recursive: true });
  writeFileSync(join(f.workspace, 'local', 'secret'), 'DO-NOT-OUTPUT');
  symlinkSync(f.upstream, join(f.workspace, 'local', 'external'), process.platform === 'win32' ? 'junction' : 'dir');
  const report = inspectLocal({ root: f.workspace });
  assert.equal(report.entries.length, 2); assert.ok(!JSON.stringify(report).includes('DO-NOT-OUTPUT'));
});
test('interactive prompt routing supports first-user and project-clone modes', async () => {
  const prompts = [], answers = ['/private/workspace', 'alice', 'build-01', '', '/work/project', 'firmware'];
  const result = await promptSetup({ apply: true }, async question => { prompts.push(question); return answers.shift(); });
  assert.equal(result.project, 'firmware'); assert.equal(result.apply, undefined); assert.equal(prompts.length, 6);
  const personal = await promptSetup({ root: '/private', user: 'alice', host: 'build-01', company: '', 'project-path': '' }, async () => { throw Error('unexpected prompt'); });
  assert.equal(personal.user, 'alice');
});
test('mirror plan creates nothing and apply requires dedicated acknowledgement', t => {
  const f = fixture(t), mirror = join(f.root, 'mirror.git');
  const options = { checkout: f.upstream, upstream: f.upstream, mirror, 'allow-local-source': true };
  assert.equal(syncMirror(options).apply, false); assert.equal(existsSync(mirror), false);
  assert.throws(() => syncMirror({ ...options, apply: true }), /dedicated/);
  assert.equal(syncMirror({ ...options, apply: true, dedicated: true }).head, f.pin);
  assert.equal(git(mirror, ['rev-parse', '--is-bare-repository']), 'true');
  writeFileSync(join(f.upstream, 'next.md'), '# Next'); git(f.upstream, ['add', '.']); git(f.upstream, ['commit', '-m', 'next']);
  syncMirror({ ...options, apply: true, dedicated: true }); assert.equal(git(mirror, ['rev-parse', 'refs/heads/main']), git(f.upstream, ['rev-parse', 'HEAD']));
});
test('existing unmarked mirror cannot be overwritten', t => {
  const f = fixture(t), mirror = join(f.root, 'human.git'); mkdirSync(mirror); git(mirror, ['init', '--bare']);
  assert.throws(() => syncMirror({ checkout: f.upstream, upstream: f.upstream, mirror, 'allow-local-source': true, apply: true, dedicated: true }), /dedicated SPipe mirror/);
});
test('Node CLI help works without shell setup', () => {
  for (const name of ['setup-spipe-workspace', 'install-spipe', 'sync-spipe-mirror']) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL(`../../scripts/${name}.mjs`, import.meta.url)), '--help'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr); assert.match(result.stdout, /Plan by default|Plan by default\./i);
  }
});

test('updater rejects a fast-forward that removes package identity before changing HEAD', t => {
  const f = fixture(t); install({ ...f.options, apply: true });
  writeFileSync(join(f.upstream, 'package.json'), '{"name":"different-package"}');
  git(f.upstream, ['add', '.']); git(f.upstream, ['commit', '-m', 'not SPipe']);
  assert.throws(() => install({ ...f.options, apply: true }), /Fetched revision/);
  assert.equal(git(f.checkout, ['rev-parse', 'HEAD']), f.pin);
});

test('legacy common submodule pin remains exact during workspace bootstrap', t => {
  const f = fixture(t); mkdirSync(f.workspace); git(f.workspace, ['init', '-b', 'main']);
  git(f.workspace, ['-c', 'protocol.file.allow=always', 'submodule', 'add', f.upstream, '.spipe/spipe']);
  const options = { root: f.workspace, user: 'alice', host: 'build-01', common: join(f.workspace, '.spipe/spipe'), apply: true };
  workspaceSetup(options);
  assert.equal(git(f.workspace, ['ls-files', '--stage', '--', '.spipe/spipe']).split(' ')[1], f.pin);
  assert.equal(JSON.parse(readFileSync(join(f.workspace, 'workspace.json'))).common.path, '.spipe/spipe');
});

test('failed fresh clone leaves no checkout and releases cooperative setup lock', t => {
  const f = fixture(t);
  assert.throws(() => install({ ...f.options, upstream: join(f.root, 'missing-repository'), apply: true }), /could be cloned/);
  assert.equal(existsSync(f.checkout), false);
  assert.equal(existsSync(join(f.workspace, '.spipe-setup.lock')), false);
});

test('project common route is discovered and its submodule pin survives repeat setup', t => {
  const f = fixture(t), project = join(f.root, 'project'); mkdirSync(project); git(project, ['init', '-b', 'main']);
  git(project, ['-c', 'protocol.file.allow=always', 'submodule', 'add', f.upstream, '.spipe/common']);
  const previous = process.env.SPIPE_HOME;
  delete process.env.SPIPE_HOME;
  try {
    const options = { root: f.workspace, user: 'alice', host: 'build-01', project: 'firmware', 'project-path': project, apply: true };
    assert.equal(workspaceSetup(options).commit, f.pin);
    assert.equal(workspaceSetup(options).commit, f.pin);
    assert.equal(realpathSync(join(f.workspace, 'common')), realpathSync(join(project, '.spipe/common')));
  } finally { if (previous !== undefined) process.env.SPIPE_HOME = previous; }
});

test('project legacy pin wins when a global common checkout also exists', t => {
  const f = fixture(t), project = join(f.root, 'legacy-project'), fakeHome = join(f.root, 'home');
  mkdirSync(project); mkdirSync(fakeHome); git(project, ['init', '-b', 'main']);
  git(project, ['-c', 'protocol.file.allow=always', 'submodule', 'add', f.upstream, '.spipe/spipe']);
  const global = join(fakeHome, 'spipe');
  git(f.root, ['clone', f.upstream, global]);
  const previous = process.env.HOME, previousProfile = process.env.USERPROFILE;
  process.env.HOME = fakeHome;
  process.env.USERPROFILE = fakeHome;
  try {
    const options = { root: f.workspace, user: 'alice', host: 'build-01', project: 'legacy', 'project-path': project, apply: true };
    assert.equal(workspaceSetup(options).commit, f.pin);
    assert.equal(realpathSync(join(f.workspace, 'common')), realpathSync(join(project, '.spipe/spipe')));
  } finally {
    if (previous === undefined) delete process.env.HOME; else process.env.HOME = previous;
    if (previousProfile === undefined) delete process.env.USERPROFILE; else process.env.USERPROFILE = previousProfile;
  }
});
