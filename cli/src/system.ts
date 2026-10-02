import { spawnSync } from 'node:child_process';
import type { SpawnSyncReturns } from 'node:child_process';
import { statfsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const isWindows = process.platform === 'win32';

export type ToolReport = { name: string; ok: boolean; version: string };

/**
 * On Windows, a long-lived terminal keeps the PATH it started with, so tools installed later
 * (Scoop adds folders to the user PATH and sets ESPEAK_DATA_PATH) are invisible to it.
 * Read the current user and machine values from the registry and merge them in.
 */
function freshEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  if (!isWindows) return env;
  const read = (name: string, scope: 'User' | 'Machine'): string => {
    const r = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-Command', `[Environment]::GetEnvironmentVariable('${name}','${scope}')`],
      { encoding: 'utf8' },
    );
    return (r.stdout ?? '').trim();
  };
  const pathKey = Object.keys(env).find((k) => k.toLowerCase() === 'path') ?? 'Path';
  const parts = [env[pathKey] ?? '', read('Path', 'User'), read('Path', 'Machine')]
    .join(';')
    .split(';')
    .filter((p) => p.length > 0);
  env[pathKey] = [...new Set(parts)].join(';');
  if (!env.ESPEAK_DATA_PATH) {
    const espeak = read('ESPEAK_DATA_PATH', 'User');
    if (espeak) env.ESPEAK_DATA_PATH = espeak;
  }
  return env;
}

export const toolEnv = freshEnv();

/** Quote one argument for cmd.exe or a POSIX shell so paths with spaces survive. */
function quote(arg: string): string {
  if (/^[A-Za-z0-9_\-.,:=/\\@+]+$/.test(arg)) return arg;
  return isWindows ? `"${arg.replace(/"/g, '""')}"` : `'${arg.replace(/'/g, `'\\''`)}'`;
}

/**
 * Run a command safely on Windows and macOS. Windows needs a shell to find npm/npx (.cmd files),
 * so the command is built as one string with every argument quoted.
 */
export function run(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeoutMs?: number } = {},
): SpawnSyncReturns<string> {
  const line = [cmd, ...args].map(quote).join(' ');
  return spawnSync(line, {
    cwd: opts.cwd ?? projectRoot,
    encoding: 'utf8',
    shell: true,
    env: toolEnv,
    timeout: opts.timeoutMs ?? 120_000,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** Run a command and return its first line of output. Never throws. */
export function firstLine(
  cmd: string,
  args: string[],
  opts: { cwd?: string } = {},
): { ok: boolean; text: string } {
  const r = run(cmd, args, opts);
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
  const line = out.split(/\r?\n/).find((l) => l.trim().length > 0) ?? '';
  if (r.error) return { ok: false, text: r.error.message };
  if (r.status !== 0) return { ok: false, text: line || `exit code ${r.status}` };
  return { ok: true, text: line };
}

export function machineSummary() {
  const cpus = os.cpus();
  const disk = statfsSync(projectRoot);
  return {
    platform: `${os.type()} ${os.release()} (${process.platform} ${os.arch()})`,
    cpu: `${cpus[0]?.model.trim() ?? 'unknown'} x${cpus.length} threads`,
    memoryGb: {
      total: +(os.totalmem() / 2 ** 30).toFixed(1),
      free: +(os.freemem() / 2 ** 30).toFixed(1),
    },
    projectDiskFreeGb: +((disk.bavail * disk.bsize) / 2 ** 30).toFixed(1),
    node: process.version,
  };
}
