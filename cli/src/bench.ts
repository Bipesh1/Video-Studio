/**
 * `npm run bench`: renders the 5-second test scene at preview and final quality,
 * measures seconds of render time per second of video, checks the file plays,
 * and estimates how long a 2:30 video will take. Writes engine/out/bench.json.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { projectRoot, run } from './system.js';

const engineDir = path.join(projectRoot, 'engine');
const outDir = path.join(engineDir, 'out');
mkdirSync(outDir, { recursive: true });

// Half the CPU threads, also capped by free memory (about 0.5 GB per headless browser tab),
// so a laptop with little free memory does not time out launching tabs.
const freeGb = os.freemem() / 2 ** 30;
const concurrency = Math.max(
  1,
  Math.min(Math.floor(os.cpus().length / 2), Math.floor(freeGb / 0.5), 8),
);
const sceneSeconds = 5;
const targetSeconds = 150; // a 2:30 video

type Pass = { name: string; args: string[]; file: string };
const passes: Pass[] = [
  {
    name: 'preview (half size)',
    args: ['--scale=0.5', '--jpeg-quality=70'],
    file: 'test-916-preview.mp4',
  },
  { name: 'final (1080x1920)', args: [], file: 'test-916.mp4' },
];

function timed(args: string[], label: string): number {
  const started = Date.now();
  const r = run('npx', args, { cwd: engineDir, timeoutMs: 15 * 60_000 });
  const seconds = (Date.now() - started) / 1000;
  if (r.status !== 0) {
    console.error(r.stdout);
    console.error(r.stderr);
    throw new Error(`${label} failed with exit code ${r.status}`);
  }
  return seconds;
}

/**
 * Fixed cost of any render: bundling the project and launching the browser.
 * Measured by rendering one still, then subtracted so the per-second figure reflects frames only.
 */
function measureOverhead(): number {
  const still = path.join(outDir, 'bench-still.png');
  return timed(
    ['remotion', 'still', 'src/index.ts', 'Test916', still, '--frame=0'],
    'Still render',
  );
}

function render(p: Pass): { out: string; seconds: number } {
  const out = path.join(outDir, p.file);
  const seconds = timed(
    [
      'remotion',
      'render',
      'src/index.ts',
      'Test916',
      out,
      `--concurrency=${concurrency}`,
      '--codec=h264',
      ...p.args,
    ],
    `Render "${p.name}"`,
  );
  return { out, seconds };
}

function probe(file: string): { ok: boolean; info: string } {
  const r = run('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration:stream=codec_name,width,height,r_frame_rate',
    '-of',
    'default=nw=1',
    file,
  ]);
  const info = (r.stdout ?? '').trim().split(/\r?\n/).join(' | ');
  return { ok: r.status === 0 && info.includes('duration='), info };
}

console.log('Measuring fixed startup cost (bundle and browser launch)...');
const overhead = measureOverhead();
console.log(`  ${overhead.toFixed(1)} s`);

const results = passes.map((p) => {
  console.log(`Rendering ${p.name} with concurrency ${concurrency}...`);
  const { out, seconds } = render(p);
  const frameSeconds = Math.max(0.1, seconds - overhead);
  const ratio = frameSeconds / sceneSeconds;
  const info = probe(out);
  console.log(
    `  ${seconds.toFixed(1)} s total, ${frameSeconds.toFixed(1)} s of frames = ${ratio.toFixed(2)} s per video second`,
  );
  console.log(`  ffprobe: ${info.ok ? 'plays' : 'FAILED'} ${info.info}`);
  return {
    pass: p.name,
    file: out,
    renderSeconds: +seconds.toFixed(1),
    frameSeconds: +frameSeconds.toFixed(1),
    secondsPerVideoSecond: +ratio.toFixed(2),
    estimate230Minutes: +((overhead + ratio * targetSeconds) / 60).toFixed(1),
    plays: info.ok,
    probe: info.info,
  };
});

const report = {
  measuredAt: new Date().toISOString(),
  concurrency,
  cpuThreads: os.cpus().length,
  freeMemoryGb: +freeGb.toFixed(1),
  startupOverheadSeconds: +overhead.toFixed(1),
  sceneSeconds,
  note: 'Test scene is simpler than a real shot (no blur, one character). Expect real scenes to be slower.',
  results,
};
writeFileSync(path.join(outDir, 'bench.json'), JSON.stringify(report, null, 2));
console.log('');
for (const r of results) {
  console.log(
    `${r.pass}: a 2:30 video would take about ${r.estimate230Minutes} minutes to render.`,
  );
}
console.log(`Report written to ${path.join(outDir, 'bench.json')}`);
if (results.some((r) => !r.plays)) process.exitCode = 1;
