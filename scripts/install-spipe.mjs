#!/usr/bin/env node
import { mkdirSync, mkdtempSync, renameSync, rmSync, symlinkSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { args, config, source, pathValue, present, safeRoot, directory, git, cleanPackage, lock, cli, UPSTREAM, within } from './distribution-common.mjs';

export function install(options) {
  const cfg = config(options);
  const checkout = pathValue(options.checkout || process.env.SPIPE_HOME || cfg.checkout || join(homedir(), 'spipe'));
  const workspace = pathValue(options.workspace || cfg.workspace || join(homedir(), '.spipe'));
  safeRoot(checkout); safeRoot(workspace);
  if (within(checkout, workspace) || within(workspace, checkout)) throw Error('Use separate common and private workspace roots');
  const mode = options.source || 'auto';
  if (!['auto', 'mirror', 'internet'].includes(mode)) throw Error('source must be auto, mirror, or internet');
  const upstream = source(options.upstream || cfg.upstream || UPSTREAM, options['allow-local-source']);
  const mirror = options.mirror || cfg.mirror;
  const sources = mode === 'internet' ? [upstream] : mirror ? [source(mirror, options['allow-local-source']), ...(mode === 'auto' && cfg.allow_public_fallback === 'true' ? [upstream] : [])] : mode === 'auto' ? [upstream] : [];
  if (!sources.length) throw Error('Mirror source requested but no mirror is configured');
  const branch = options.branch || cfg.branch || 'main';
  git(null, ['check-ref-format', `refs/heads/${branch}`]);
  const pin = options['common-ref'];
  if (pin && !/^[a-f0-9]{40}$/.test(pin)) throw Error('common-ref must be a full lowercase commit hash');
  const link = join(workspace, 'common');
  function validate() {
    directory(checkout); directory(workspace);
    if (present(link) && (!present(checkout) || realpathSync(link) !== realpathSync(checkout))) throw Error('Workspace common route is occupied by a different target');
    if (present(checkout)) {
      const head = cleanPackage(checkout);
      if (pin && head !== pin) throw Error('Existing common pin differs; upgrade is a separate operation');
      if (!pin && git(checkout, ['symbolic-ref', '--short', 'HEAD'], true) !== branch) throw Error('Existing common is detached or on a different branch');
      if (git(checkout, ['rev-parse', '--show-superproject-working-tree'])) throw Error('Global updater cannot update a project submodule');
    }
  }
  validate();
  const plan = { operation: 'install', checkout, workspace, sources, branch, pin: pin || null, apply: !!options.apply };
  if (!options.apply) return plan;
  return lock(workspace, () => {
    validate();
    if (!present(checkout)) {
      mkdirSync(dirname(checkout), { recursive: true, mode: 0o700 });
      const staging = mkdtempSync(join(dirname(checkout), '.spipe-install-'));
      try {
        let success = false;
        for (const origin of sources) {
          const destination = join(staging, 'common');
          if (git(null, ['clone', '--no-checkout', '--', origin, destination], true) !== null) { success = true; break; }
          rmSync(destination, { recursive: true, force: true });
        }
        if (!success) throw Error('No configured common source could be cloned');
        const destination = join(staging, 'common');
        git(destination, ['checkout', ...(pin ? ['--detach', pin] : ['-B', branch, `origin/${branch}`])]);
        cleanPackage(destination);
        if (present(checkout)) throw Error('Checkout appeared during installation');
        renameSync(destination, checkout);
      } finally { rmSync(staging, { recursive: true, force: true }); }
    } else if (!pin) {
      let fetched = false;
      for (const origin of sources) {
        if (git(checkout, ['fetch', '--no-tags', '--', origin, `refs/heads/${branch}`], true) !== null) { fetched = true; break; }
      }
      if (!fetched) throw Error('No configured common source could be fetched');
      if (JSON.parse(git(checkout, ['show', 'FETCH_HEAD:package.json'])).name !== '@simple-lang/spipe' || !git(checkout, ['ls-tree', 'FETCH_HEAD', '--', 'plugin']).startsWith('040000 tree ')) throw Error('Fetched revision is not an identified SPipe package');
      git(checkout, ['merge', '--ff-only', '--no-edit', 'FETCH_HEAD']);
    }
    if (!present(link)) symlinkSync(checkout, link, process.platform === 'win32' ? 'junction' : 'dir');
    return { ...plan, commit: cleanPackage(checkout) };
  });
}
cli(import.meta.url, () => {
  const options = args(process.argv.slice(2), ['config', 'checkout', 'workspace', 'source', 'upstream', 'mirror', 'branch', 'common-ref'], ['apply', 'dry-run', 'allow-local-source', 'help']);
  if (options.help) console.log('install-spipe.mjs [--source auto|mirror|internet] [--checkout PATH] [--workspace PATH] [--config PATH] [--common-ref SHA] [--apply]\nPlan by default. Local sources require --allow-local-source. Auto fallback from a configured mirror requires allow_public_fallback: true.');
  else console.log(JSON.stringify(install(options), null, 2));
});
