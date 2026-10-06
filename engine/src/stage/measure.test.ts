import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FPS, SIZES, storyboardSchema } from '@studio/shared';
import type { QaCheck, Storyboard, VoiceTrack } from '@studio/shared';
import { describe, expect, it, vi } from 'vitest';
import { ACTIONS } from '../rig/actions';
import { POSES } from '../rig/poses';
import {
  FACE_COVERED,
  JUMP,
  captionCheck,
  cutOff,
  faceCovered,
  headTravel,
  measurePart,
  pictureChecks,
} from './measure';

/**
 * The self-check's measurements of the pictures (Phase 4E): the worked plan measures clean,
 * each kind of fault is caught and named in plain words, and nothing the library draws on
 * purpose (a fall, a kneel, someone lying down) is mistaken for a fault.
 */

// Measuring every frame of a whole plan is real work; give it room on a busy machine.
vi.setConfig({ testTimeout: 60_000 });

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const farmer = storyboardSchema.parse(
  JSON.parse(
    readFileSync(join(root, 'runs', '2026-10-06-honest-farmer', 'storyboard.json'), 'utf8'),
  ),
);
const WIDE = SIZES['16:9'];
const TALL = SIZES['9:16'];

type Shot = Storyboard['scenes'][number]['shots'][number];
type Actor = Shot['actors'][number];

const measure = (storyboard: Storyboard, size: { width: number; height: number } = WIDE) =>
  pictureChecks({ storyboard, track: null, size, cards: {}, fps: FPS });
const found = (checks: QaCheck[], level?: 'problem' | 'note') =>
  checks.flatMap((c) =>
    c.findings
      .filter((f) => !level || f.level === level)
      .map((f) => `${c.id}: ${f.text} (${f.shot})`),
  );

/** The plan with one shot changed. */
const edited = (id: string, edit: (shot: Shot) => void): Storyboard => {
  const sb = structuredClone(farmer);
  const shot = sb.scenes.flatMap((s) => s.shots).find((s) => s.id === id);
  if (!shot) throw new Error(`no shot ${id}`);
  edit(shot);
  return sb;
};
/** One scene of the plan cut down to one shot, with its one person changed. */
const alone = (edit: (actor: Actor) => void): Storyboard => {
  const sb = structuredClone(farmer);
  const scene = sb.scenes.find((s) => s.shots.some((shot) => shot.id === 's2d'));
  const shot = scene?.shots.find((s) => s.id === 's2d');
  const actor = shot?.actors[0];
  if (!scene || !shot || !actor) throw new Error('no shot s2d');
  edit(actor);
  return { ...sb, scenes: [{ ...scene, shots: [shot] }] };
};

describe('the worked plan', () => {
  it('measures clean in a wide frame', () => {
    const checks = measure(farmer);
    expect(found(checks)).toEqual([]);
    expect(checks.map((c) => c.id)).toEqual([
      'in-frame',
      'faces-clear',
      'feet',
      'smooth',
      'held',
      'reach',
    ]);
  });

  it('has nothing to fix in a tall frame, and says who a narrow frame leaves out', () => {
    const checks = measure(farmer, TALL);
    expect(found(checks, 'problem')).toEqual([]);
    // A shot that favours one of two people has no room for the other in a tall frame.
    expect(found(checks, 'note').join('\n')).toContain(
      "is in this shot's plan but falls outside the picture (s4b)",
    );
  });
});

describe('what the measurements catch', () => {
  it('someone the shot is about, standing outside the picture', () => {
    const sb = edited('s2d', (shot) => {
      const tomas = shot.actors[0];
      if (tomas) tomas.x = 1.7;
    });
    expect(found(measure(sb), 'problem').join('\n')).toContain(
      "in-frame: Tomas, the farmer's head is out of the picture (s2d)",
    );
  });

  it('a face under the title', () => {
    // In a tall frame a closer title shot puts his face where the ribbon is.
    const sb = edited('s1a', (shot) => {
      shot.camera.framing = 'medium';
    });
    expect(found(measure(sb), 'problem')).toEqual([]);
    expect(found(measure(sb, TALL), 'problem').join('\n')).toContain(
      "faces-clear: the title covers Tomas, the farmer's face (s1a)",
    );
  });

  it('a thing picked up from too far away, or from behind', () => {
    const far = edited('s1b', (shot) => {
      const bag = shot.props.find((p) => p.prop === 'bag');
      if (bag) bag.x = 0.9;
    });
    expect(found(measure(far), 'problem').join('\n')).toContain(
      'reach: the bag is too far from Tomas, the farmer to pick up, or behind them',
    );
    const behind = edited('s1b', (shot) => {
      const bag = shot.props.find((p) => p.prop === 'bag');
      if (bag) bag.x = 0.3;
    });
    expect(found(measure(behind), 'problem').join('\n')).toContain('reach: the bag is too far');
  });

  it('a picture held too long, and a shot over the longest the format allows', () => {
    const timed = edited('s2b', (shot) => {
      shot.startMs = 0;
      shot.endMs = 4600;
    });
    const scene = timed.scenes.find((s) => s.shots.some((shot) => shot.id === 's2b'));
    const shot = scene?.shots.find((s) => s.id === 's2b');
    if (!scene || !shot) throw new Error('no shot s2b');
    const one = { ...timed, scenes: [{ ...scene, shots: [shot] }] };
    const input = { storyboard: one, track: null, size: WIDE, cards: {}, fps: FPS };
    expect(found(pictureChecks(input)).join('\n')).toContain(
      'held: one picture is held for 4.6 s with nothing moving in it',
    );
    expect(found(pictureChecks(input, { maxShotS: 4 }), 'note').join('\n')).toContain(
      'held: the shot stays for 4.6 s, a little over the 4 s a shot should take',
    );
    expect(found(pictureChecks(input, { maxShotS: 3 }), 'problem').join('\n')).toContain(
      'held: the shot stays for 4.6 s; a shot may take up to 3 s',
    );
  });
});

describe('what the measurements leave alone', () => {
  it.each(POSES.map((p) => p.id))(
    'the %s pose: feet where they belong, nothing jumping',
    (pose) => {
      const sb = alone((actor) => {
        delete actor.action;
        Object.assign(actor, { pose, then: [], lookAt: 'ahead' });
      });
      const checks = measure(sb).filter((c) => c.id === 'feet' || c.id === 'smooth');
      expect(found(checks)).toEqual([]);
    },
  );

  it.each(Object.keys(ACTIONS))('the %s action: as fast as it was drawn to be', (action) => {
    const sb = alone((actor) => {
      delete actor.pose;
      Object.assign(actor, { action, then: [], lookAt: 'ahead' });
    });
    const checks = measure(sb).filter((c) => c.id === 'feet' || c.id === 'smooth');
    expect(found(checks)).toEqual([]);
  });

  it('walking into a kneel: the body takes at least ten frames to get down', () => {
    const sb = alone((actor) => {
      actor.then = [{ at: 0.4, pose: 'kneel' }];
    });
    expect(found(measure(sb).filter((c) => c.id === 'smooth'))).toEqual([]);
    const frames = measurePart({ storyboard: sb, track: null, size: WIDE, cards: {}, fps: FPS })[0]
      ?.frames;
    if (!frames) throw new Error('nothing measured');
    const heights = frames.map((m) => m.people[0]?.steady.y ?? 0);
    const top = Math.min(...heights);
    const bottom = heights[heights.length - 1] ?? 0;
    // Frames in which the head is well on its way down but not there yet.
    const onTheWay = heights.filter(
      (y) => y > top + (bottom - top) * 0.1 && y < bottom - (bottom - top) * 0.1,
    );
    expect(bottom - top).toBeGreaterThan(40);
    expect(onTheWay.length).toBeGreaterThanOrEqual(8);
  });
});

describe('the measures themselves', () => {
  const head = { x: 500, y: 300, r: 50 };

  it('how much of a head is out of the picture', () => {
    expect(cutOff(head, WIDE)).toBe(0);
    expect(cutOff({ ...head, x: 0 }, WIDE)).toBeCloseTo(0.5, 6);
    expect(cutOff({ ...head, x: -60 }, WIDE)).toBeGreaterThan(1);
    expect(cutOff({ ...head, y: 25 }, WIDE)).toBeCloseTo(0.25, 6);
    expect(cutOff({ ...head, x: WIDE.width - 30 }, WIDE)).toBeCloseTo(0.2, 6);
  });

  it('how much of a face a box covers', () => {
    expect(faceCovered(head, null)).toBe(0);
    expect(faceCovered(head, { x: 0, y: 500, width: 1920, height: 100 })).toBe(0);
    expect(faceCovered(head, { x: 0, y: 0, width: 1920, height: 1080 })).toBeCloseTo(1, 6);
    // A caption across the chin: the bottom fifth of the face.
    const chin = faceCovered(head, { x: 300, y: 324, width: 400, height: 80 });
    expect(chin).toBeCloseTo(0.2, 6);
    expect(chin).toBeGreaterThan(FACE_COVERED);
    // The brim of a hat under a ribbon is not the face.
    expect(faceCovered(head, { x: 300, y: 180, width: 400, height: 75 })).toBe(0);
  });

  it('how far a head travels in one frame, against the size of a jump', () => {
    expect(headTravel(head, head)).toBe(0);
    // A walk, a body getting up, and the two-frame kneel Biku caught (L-0030).
    expect(headTravel(head, { ...head, x: 505 })).toBeCloseTo(0.05, 6);
    expect(headTravel(head, { ...head, y: 310 })).toBeLessThan(JUMP);
    expect(headTravel(head, { ...head, y: 364 })).toBeGreaterThan(JUMP);
  });
});

describe('captions', () => {
  const word = (text: string, startMs: number, endMs: number, lineId = 'n1') => ({
    text,
    startMs,
    endMs,
    lineId,
    emphasis: false,
  });
  const track = (words: VoiceTrack['words']): VoiceTrack => ({
    version: 1,
    audioFile: 'voice.wav',
    sampleRate: 48000,
    durationMs: 6000,
    timingSource: 'kokoro',
    loudnessLufs: -14,
    lines: [
      { id: 'n1', speaker: 'narrator', voice: 'af_heart', text: '', startMs: 0, endMs: 5000 },
    ],
    words,
  });
  const spoken = 'A poor farmer found 100 gold coins on an empty road.'
    .split(' ')
    .map((text, i) => word(text, 300 + i * 320, 300 + i * 320 + 300));

  it('fit in a wide frame and in a tall one', () => {
    for (const size of [WIDE, TALL]) {
      const check = captionCheck(track(spoken), size);
      expect(check.findings).toEqual([]);
      expect(check.detail).toMatch(
        /^\d+ captions of (one line|up to 2 lines); the widest takes \d+% of the width/,
      );
    }
  });

  it('are caught when a word is too wide for the screen', () => {
    const long = [word('Supercalifragilisticexpialidocious-and-then-some-more', 300, 1500)];
    const check = captionCheck(track(long), TALL);
    expect(check.findings.map((f) => f.text).join('\n')).toContain('is too wide for the screen');
  });

  it('are pointed out when one is gone before it can be read', () => {
    const quick = [word('Stop.', 300, 380), word('Now.', 400, 2000)];
    const check = captionCheck(track(quick), WIDE);
    expect(
      check.findings
        .filter((f) => f.level === 'note')
        .map((f) => f.text)
        .join('\n'),
    ).toContain('the caption "Stop." is up for only 0.10 s');
  });
});
