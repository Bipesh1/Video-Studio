import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { clearStaleScratch, scratchDir, scratchRoot } from './scratch';

/**
 * Scratch files stay inside the project (Biku, 2026-10-06: drive C filled up with thousands of
 * folders the renderer left in the system temporary folder).
 */
describe('scratch space for renders', () => {
  it('points the temporary folder at this command’s own folder inside the project', () => {
    expect(path.resolve(os.tmpdir())).toBe(path.resolve(scratchDir));
    expect(scratchDir.startsWith(scratchRoot)).toBe(true);
    expect(path.basename(scratchDir)).toBe(String(process.pid));
    expect(existsSync(scratchDir)).toBe(true);
  });

  it('deletes what a finished command left behind and keeps what a running one is using', () => {
    // No process has an id this high, so this folder belongs to a command that has ended.
    const dead = path.join(scratchRoot, '99999999');
    const running = path.join(scratchRoot, String(process.ppid));
    const hadRunning = existsSync(running);
    mkdirSync(path.join(dead, 'puppeteer_dev_chrome_profile-abc'), { recursive: true });
    writeFileSync(path.join(dead, 'puppeteer_dev_chrome_profile-abc', 'data'), 'x');
    mkdirSync(running, { recursive: true });
    try {
      expect(clearStaleScratch()).toBeGreaterThanOrEqual(1);
      expect(existsSync(dead)).toBe(false);
      expect(existsSync(running)).toBe(true);
      expect(existsSync(scratchDir)).toBe(true);
    } finally {
      if (!hadRunning) rmSync(running, { recursive: true, force: true });
    }
  });
});
