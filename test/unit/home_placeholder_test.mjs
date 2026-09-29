import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = name => fileURLToPath(new URL(`../../scripts/${name}`, import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'spipe-home-placeholder-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const home = join(root, 'home with spaces'), upstream = join(home, 'upstream');
  mkdirSync(join(upstream, 'plugin'), { recursive: true });
  writeFileSync(join(upstream, 'plugin/index.md'), 'fixture');
  writeFileSync(join(upstream, 'package.json'), '{"name":"@simple-lang/spipe"}\n');
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  for (const key of ['SPIPE_HOME', 'SPIPE_WORKSPACE', 'SPIPE_CONFIG']) delete env[key];
  const run = (command, args, extra = {}) => {
    const result = spawnSync(command, args, { cwd: root, env, encoding: 'utf8', ...extra });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const git = args => run('git', ['-C', upstream, ...args]);
  git(['init', '-b', 'main']); git(['add', '.']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture']);
  return { root, home, upstream, env, run, pin: git(['rev-parse', 'HEAD']) };
}

test('home placeholder expands only the leading complete token without shell evaluation', t => {
  const f = fixture(t);
  const module = new URL('../../scripts/distribution-common.mjs', import.meta.url).href;
  const result = JSON.parse(f.run(process.execPath, ['--input-type=module', '-e', `
    import { pathValue, source } from ${JSON.stringify(module)};
    const values = ['{home}', '{home}/private space', '{home}\\\\private', '{home}//private', 'relative/{home}', '{home}suffix', '{home}/$(touch EXPANDED)'];
    let rejected = false; try { source('{home}/upstream'); } catch { rejected = true; }
    console.log(JSON.stringify({paths: values.map(pathValue), local: source('{home}/upstream', true), rejected}));
  `]));
  assert.deepEqual(result.paths.slice(0, 4), [f.home, join(f.home, 'private space'), join(f.home, 'private'), join(f.home, 'private')]);
  assert.equal(result.paths[4], join(f.root, 'relative/{home}'));
  assert.equal(result.paths[5], join(f.root, '{home}suffix'));
  assert.equal(result.paths[6], join(f.home, '$(touch EXPANDED)'));
  assert.equal(existsSync(join(f.root, 'EXPANDED')), false);
  assert.equal(result.local, f.upstream); assert.equal(result.rejected, true);
});

test('home placeholder launch arguments and SDN config install and register the same core', t => {
  const f = fixture(t);
  writeFileSync(join(f.home, 'bootstrap.sdn'), 'spipe:\n  upstream: "{home}/upstream"\n  checkout: "{home}/.spipe"\n  workspace: "{home}/spipe"\n');
  const install = JSON.parse(f.run(process.execPath, [script('install-spipe.mjs'), '--config', '{home}/bootstrap.sdn', '--allow-local-source', '--common-ref', f.pin, '--apply']));
  assert.equal(install.checkout, join(f.home, '.spipe'));
  assert.equal(install.workspace, join(f.home, 'spipe'));
  const setup = JSON.parse(f.run(process.execPath, [script('setup-spipe-workspace.mjs'), 'init', '--root', '{home}/spipe', '--common', '{home}/.spipe', '--user', 'alice', '--host', 'build-01', '--apply']));
  assert.equal(setup.common, join(f.home, '.spipe'));
  assert.equal(realpathSync(join(f.home, 'spipe/common')), realpathSync(join(f.home, '.spipe')));
  const registry = JSON.parse(readFileSync(join(f.home, 'spipe/users/alice/hosts/build-01/mounts.json')));
  assert.equal(registry.mounts.common.path, realpathSync(join(f.home, '.spipe')));
  assert.equal(existsSync(join(f.root, '{home}')), false);
});

test('home placeholder environment overrides guide discovery and private workspace planning', t => {
  const f = fixture(t);
  const env = { ...f.env, SPIPE_HOME: '{home}/upstream', SPIPE_WORKSPACE: '{home}/private' };
  assert.equal(f.run(process.execPath, [script('find-spipe.mjs')], { env }), realpathSync(f.upstream));
  const setup = JSON.parse(f.run(process.execPath, [script('setup-spipe-workspace.mjs'), '--user', 'alice', '--host', 'build-01'], { env }));
  assert.equal(setup.common, f.upstream); assert.equal(setup.root, join(f.home, 'private'));
});

test('home placeholder legacy user destination writes only into expanded private home', t => {
  const f = fixture(t);
  const env = { ...f.env, SPIPE_HOME: '{home}/upstream' };
  if (process.platform === 'win32') {
    f.run('pwsh', ['-NoProfile', '-NonInteractive', '-File', script('setup-local-knowledge.ps1'), '-Mode', 'user', '-Destination', '{home}/legacy-private', '-CommonUrl', '{home}/upstream', '-AllowLocalSource', '-Project', 'example', '-Yes'], { env });
  } else {
    f.run('sh', [script('setup-local-knowledge.sh'), '--mode', 'user', '--destination', '{home}/legacy-private', '--common-url', '{home}/upstream', '--allow-local-source', '--project', 'example', '--yes'], { env });
  }
  assert.equal(realpathSync(join(f.home, 'legacy-private/common')), realpathSync(f.upstream));
  assert.match(readFileSync(join(f.home, 'legacy-private/local/scopes.sdn'), 'utf8'), /project:example\|/);
  assert.equal(existsSync(join(f.root, '{home}')), false);
});
