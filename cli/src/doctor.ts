/**
 * `npm run doctor`: reports the machine and the version of every tool the studio needs.
 * Phase 0 acceptance: every tool reports its version.
 */
import path from 'node:path';
import { firstLine, machineSummary, projectRoot, run } from './system.js';
import type { ToolReport } from './system.js';

const audioDir = path.join(projectRoot, 'audio');
const engineDir = path.join(projectRoot, 'engine');

type Tool = { name: string; cmd: string; args: string[]; cwd?: string; pick?: RegExp };

const tools: Tool[] = [
  { name: 'node', cmd: 'node', args: ['--version'] },
  { name: 'npm', cmd: 'npm', args: ['--version'] },
  { name: 'git', cmd: 'git', args: ['--version'] },
  { name: 'uv', cmd: 'uv', args: ['--version'] },
  { name: 'python (audio env)', cmd: 'uv', args: ['run', 'python', '--version'], cwd: audioDir },
  { name: 'ffmpeg', cmd: 'ffmpeg', args: ['-version'] },
  { name: 'ffprobe', cmd: 'ffprobe', args: ['-version'] },
  { name: 'espeak-ng', cmd: 'espeak-ng', args: ['--version'] },
  { name: 'fluidsynth', cmd: 'fluidsynth', args: ['--version'] },
  {
    name: 'remotion',
    cmd: 'npx',
    args: ['remotion', 'versions'],
    cwd: engineDir,
    pick: /On version: (\S+)/,
  },
];

/** Tools whose useful version is not on the first line get a regex to pull it from the full output. */
function report(t: Tool): ToolReport {
  if (!t.pick) {
    const r = firstLine(t.cmd, t.args, { cwd: t.cwd });
    return { name: t.name, ok: r.ok, version: r.text };
  }
  const r = run(t.cmd, t.args, { cwd: t.cwd });
  const match = `${r.stdout ?? ''}${r.stderr ?? ''}`.match(t.pick);
  return match?.[1]
    ? { name: t.name, ok: true, version: match[1] }
    : { name: t.name, ok: false, version: `no version found (exit code ${r.status})` };
}

const reports: ToolReport[] = tools.map(report);

const m = machineSummary();
console.log('Machine');
console.log(`  platform : ${m.platform}`);
console.log(`  cpu      : ${m.cpu}`);
console.log(`  memory   : ${m.memoryGb.total} GB total, ${m.memoryGb.free} GB free`);
console.log(`  disk     : ${m.projectDiskFreeGb} GB free on the project drive`);
console.log('');
console.log('Tools');
for (const r of reports) {
  console.log(`  ${r.ok ? 'OK     ' : 'MISSING'}  ${r.name.padEnd(20)} ${r.version}`);
}
const missing = reports.filter((r) => !r.ok);
console.log('');
if (missing.length === 0) {
  console.log('All tools report a version.');
} else {
  console.log(
    `${missing.length} tool(s) did not report a version: ${missing.map((r) => r.name).join(', ')}`,
  );
  process.exitCode = 1;
}
