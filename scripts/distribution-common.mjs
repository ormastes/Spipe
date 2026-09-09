import { existsSync, lstatSync, readFileSync, realpathSync, mkdirSync, writeFileSync, renameSync, unlinkSync, rmdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, join, dirname, isAbsolute, relative, parse } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const UPSTREAM = 'https://github.com/ormastes/Spipe.git';
export const INITIAL_PIN = 'e14002ef440852e70751f673145995f7448dc8f9';
export function args(argv, values, flags = []) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--') || Object.hasOwn(result, key)) throw Error(`Unexpected or duplicate argument: ${argv[i]}`);
    if (flags.includes(key)) result[key] = true;
    else if (values.includes(key) && argv[i + 1] && !argv[i + 1].startsWith('--')) result[key] = argv[++i];
    else throw Error(`Unknown option or missing value: --${key}`);
  }
  if (result.apply && result['dry-run']) throw Error('Choose --apply or --dry-run');
  return result;
}
export function pathValue(value) {
  return resolve(value === '~' ? homedir() : value.startsWith('~/') || value.startsWith('~\\') ? join(homedir(), value.slice(2)) : value);
}
export function present(path) { try { lstatSync(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }
export function directory(path) {
  if (present(path) && (lstatSync(path).isSymbolicLink() || !lstatSync(path).isDirectory())) throw Error(`Expected real directory: ${path}`);
}
export function managed(root, relativePath = '') {
  const target = resolve(root, relativePath);
  if (relative(root, target).startsWith('..') || isAbsolute(relative(root, target))) throw Error('Managed path escapes workspace');
  let part = root;
  directory(part);
  for (const segment of relative(root, target).split(/[\\/]/).filter(Boolean)) {
    part = join(part, segment);
    if (present(part) && lstatSync(part).isSymbolicLink()) throw Error(`Managed symlink refused: ${part}`);
  }
  return target;
}
export function git(root, argv, optional = false) {
  const result = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', ...(root ? ['-C', root] : []), ...argv], { encoding: 'utf8', windowsHide: true, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  if (result.error || result.status !== 0) {
    if (optional) return null;
    // Git can echo credential-helper errors. Avoid forwarding arbitrary stderr.
    throw Error(`Git ${argv[0]} failed${result.error ? `: ${result.error.code}` : ` (exit ${result.status})`}`);
  }
  return result.stdout.trim();
}
export function isPackage(root) {
  try { return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name === '@simple-lang/spipe' && lstatSync(join(root, 'plugin')).isDirectory(); }
  catch { return false; }
}
export function cleanPackage(root) {
  if (!isPackage(root)) throw Error(`Not an identified SPipe package: ${root}`);
  if (realpathSync(git(root, ['rev-parse', '--show-toplevel'])) !== realpathSync(root)) throw Error('Common must be a Git worktree root');
  if (git(root, ['status', '--porcelain', '--untracked-files=all'])) throw Error(`Common checkout is dirty: ${root}`);
  const head = git(root, ['rev-parse', 'HEAD']);
  const parent = git(root, ['rev-parse', '--show-superproject-working-tree']);
  if (parent && !git(parent, ['ls-files', '--stage', '--', relative(parent, root)]).startsWith(`160000 ${head} 0\t`)) throw Error('Common checkout differs from its recorded project gitlink');
  return head;
}
export function source(value, localAllowed = false) {
  if (isAbsolute(value) || value.startsWith('~/') || value.startsWith('~\\')) {
    if (!localAllowed) throw Error('Local Git sources require --allow-local-source');
    return pathValue(value);
  }
  let url;
  try { url = new URL(value); } catch { throw Error('Use an HTTPS/SSH URL or an explicitly allowed absolute local source'); }
  if (!['https:', 'ssh:'].includes(url.protocol) || !url.hostname || url.password || (url.protocol === 'https:' && url.username) || url.search || url.hash) throw Error('Unsupported Git URL or embedded credentials');
  return value;
}
export function config(options) {
  const explicit = options.config || process.env.SPIPE_CONFIG;
  const file = explicit ? pathValue(explicit) : isPackage(process.cwd()) && existsSync(join(process.cwd(), 'config.sdn')) ? join(process.cwd(), 'config.sdn') : join(homedir(), '.spipe', 'config.sdn');
  const out = {};
  if (!existsSync(file)) { if (explicit) throw Error('Selected configuration is missing'); return out; }
  let section = false;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (line === 'spipe:' && !section) { section = true; continue; }
    const match = /^  ([a-z_]+): (.+)$/.exec(line);
    if (!section || !match || !['upstream', 'mirror', 'branch', 'checkout', 'workspace', 'allow_public_fallback'].includes(match[1]) || Object.hasOwn(out, match[1])) throw Error('Invalid distribution SDN: use one spipe section, two-space scalar fields, and supported keys');
    out[match[1]] = match[2].startsWith('"') ? JSON.parse(match[2]) : match[2];
    if (typeof out[match[1]] !== 'string') throw Error('Configuration values must be strings');
  }
  if (out.allow_public_fallback && !['true', 'false'].includes(out.allow_public_fallback)) throw Error('allow_public_fallback must be true or false');
  return out;
}
export function safeRoot(root) {
  if (root === parse(root).root || root === homedir()) throw Error('Choose a dedicated directory, not a filesystem or home root');
  directory(root);
}
export function within(root, target) { const value = relative(root, target); return value === '' || (!value.startsWith('..') && !isAbsolute(value)); }
export function json(path) { return JSON.parse(readFileSync(path, 'utf8')); }
export function createFile(path, text) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, text, { flag: 'wx', mode: 0o600 });
}
export function replaceJson(path, value) {
  const temporary = `${path}.spipe-${process.pid}`;
  createFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  try { renameSync(temporary, path); } finally { if (present(temporary)) unlinkSync(temporary); }
}
export function lock(root, callback) {
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const path = join(root, '.spipe-setup.lock');
  mkdirSync(path, { mode: 0o700 });
  try { return callback(); } finally { rmdirSync(path); }
}
export function cli(meta, callback) {
  if (process.argv[1] && meta === pathToFileURL(resolve(process.argv[1])).href) {
    try { Promise.resolve(callback()).catch(error => { console.error(`SPipe: ${error.message}`); process.exitCode = 1; }); }
    catch (error) { console.error(`SPipe: ${error.message}`); process.exitCode = 1; }
  }
}
