/**
 * Scratch space for every studio command (Biku, 2026-10-06: "why is my local disk C filling up
 * even though my project is in F").
 *
 * The renderer writes a browser profile and a built copy of the engine into the system
 * temporary folder for every picture, and on Windows it leaves them behind: 5,500 folders and
 * about 16 GB on drive C after four days of drawing. Importing this file points the temporary
 * folder at `.cache/tmp/<process id>` inside the project instead, and that folder is deleted
 * when the command ends. Folders left by a command that crashed are deleted by the next one.
 */
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Where all scratch folders live. Ignored by git. */
export const scratchRoot = path.join(root, '.cache', 'tmp');
/** This command's own scratch folder. */
export const scratchDir = path.join(scratchRoot, String(process.pid));

const remove = (dir: string): boolean => {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    return true;
  } catch {
    // Something still holds a file open. The next command tries again.
    return false;
  }
};

const isRunning = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM means the process exists but belongs to someone else.
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
};

/** Delete the scratch folders of commands that are no longer running. Returns how many. */
export function clearStaleScratch(): number {
  let cleared = 0;
  let names: string[] = [];
  try {
    names = readdirSync(scratchRoot);
  } catch {
    return 0;
  }
  for (const name of names) {
    const pid = Number(name);
    if (Number.isInteger(pid) && pid !== process.pid && isRunning(pid)) continue;
    if (name === String(process.pid)) continue;
    if (remove(path.join(scratchRoot, name))) cleared += 1;
  }
  return cleared;
}

clearStaleScratch();
mkdirSync(scratchDir, { recursive: true });
// Node, Chrome and Python all read these to find the temporary folder.
for (const name of ['TEMP', 'TMP', 'TMPDIR']) process.env[name] = scratchDir;
process.on('exit', () => {
  remove(scratchDir);
});
