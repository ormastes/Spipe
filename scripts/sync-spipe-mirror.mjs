#!/usr/bin/env node
import { mkdtempSync, mkdirSync, rmSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, isAbsolute } from 'node:path';
import { args, config, source, present, safeRoot, directory, git, cleanPackage, pathValue, cli, UPSTREAM, within } from './distribution-common.mjs';

export function syncMirror(options) {
  const cfg = config(options);
  const checkout = pathValue(options.checkout || process.env.SPIPE_HOME || process.cwd());
  cleanPackage(checkout);
  const upstream = source(options.upstream || cfg.upstream || UPSTREAM, options['allow-local-source']);
  const rawDestination = options.mirror || cfg.mirror;
  if (!rawDestination) throw Error('Configure a dedicated spipe.mirror destination');
  const mirror = source(rawDestination, options['allow-local-source']);
  if (mirror === upstream) throw Error('Mirror source and destination must differ');
  const local = isAbsolute(mirror);
  function validateDestination() {
    if (!local) return;
    safeRoot(mirror); directory(mirror);
    if (within(checkout, mirror) || within(mirror, checkout) || (isAbsolute(upstream) && (within(upstream, mirror) || within(mirror, upstream)))) throw Error('Mirror must be separate from checkout and source');
    if (present(mirror) && (git(mirror, ['rev-parse', '--is-bare-repository']) !== 'true' || git(mirror, ['config', '--get', 'spipe.mirror-source'], true) !== upstream)) throw Error('Existing destination is not a dedicated SPipe mirror for this upstream');
  }
  validateDestination();
  const plan = { operation: 'mirror-sync', upstream, mirror, apply: !!options.apply, effect: 'Exact mirror synchronization can delete destination refs. Destination must be dedicated to SPipe.' };
  if (!options.apply) return plan;
  if (!options.dedicated) throw Error('--apply requires --dedicated acknowledgement for mirror ref replacement');
  if (!local && git(null, ['ls-remote', '--', mirror], true) === null) throw Error('Provision the hosted mirror repository before synchronization');
  const staging = mkdtempSync(join(tmpdir(), 'spipe-mirror-'));
  try {
    const bare = join(staging, 'mirror.git');
    git(null, ['clone', '--mirror', '--', upstream, bare]);
    let packageName;
    try { packageName = JSON.parse(git(bare, ['show', 'HEAD:package.json'])).name; } catch { throw Error('Upstream is not an identified SPipe repository'); }
    if (packageName !== '@simple-lang/spipe' || !git(bare, ['ls-tree', 'HEAD', '--', 'plugin'])) throw Error('Upstream is not an identified SPipe repository');
    validateDestination();
    if (local && !present(mirror)) {
      mkdirSync(dirname(mirror), { recursive: true, mode: 0o700 });
      // Clone from staging into an adjacent temporary directory for atomic publish.
      const adjacent = mkdtempSync(join(dirname(mirror), '.spipe-mirror-'));
      try {
        const target = join(adjacent, 'mirror.git');
        git(null, ['clone', '--mirror', '--no-hardlinks', '--', bare, target]);
        git(target, ['config', 'remote.origin.url', upstream]);
        git(target, ['config', 'spipe.mirror-source', upstream]);
        if (present(mirror)) throw Error('Mirror appeared during publication');
        renameSync(target, mirror);
      } finally { rmSync(adjacent, { recursive: true, force: true }); }
    } else {
      git(bare, ['push', '--mirror', '--', mirror]);
    }
    return { ...plan, head: git(bare, ['rev-parse', 'HEAD']) };
  } finally { rmSync(staging, { recursive: true, force: true }); }
}
cli(import.meta.url, () => {
  const options = args(process.argv.slice(2), ['config', 'checkout', 'upstream', 'mirror'], ['apply', 'dry-run', 'dedicated', 'allow-local-source', 'help']);
  if (options.help) console.log('sync-spipe-mirror.mjs [--config PATH] [--checkout PATH] [--mirror URL] [--apply --dedicated]\nPlan by default. --mirror replacement may delete refs. Hosted destinations must already exist.');
  else console.log(JSON.stringify(syncMirror(options), null, 2));
});
