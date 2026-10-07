import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIZES, storyboardSchema } from '@studio/shared';
import type { Shot, Storyboard } from '@studio/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import library from '../../../library/index.json';
import fixture from '../../../shared/src/fixtures/moon-tax.storyboard.json';
import { sceneBackground } from '../backgrounds/places';
import { layoutScale, shotTransform } from '../camera/Framing';
import { lookFrom } from '../wardrobe/cast';
import { unbuildable } from './buildable';
import {
  basePose,
  headPoint,
  lookTarget,
  placeActor,
  shotAt,
  shotFocus,
  stageFor,
  stageX,
  timedShots,
} from './layout';
import { HEAD_EFFECTS } from './names';
import { HELD_PROPS, STANDING_PROPS } from './props';
import { ShotPicture } from './ShotPicture';

/**
 * The storyboard builder (Phase 4D): any shot of any storyboard becomes a picture, in a tall
 * frame or a wide one, and nothing the library offers goes quietly missing.
 */

// Drawing every shot of a whole storyboard twice is real work; give it room on a busy machine.
vi.setConfig({ testTimeout: 40_000 });

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const farmer = storyboardSchema.parse(
  JSON.parse(
    readFileSync(join(root, 'runs', '2026-10-06-honest-farmer', 'storyboard.json'), 'utf8'),
  ),
);
const moonTax = storyboardSchema.parse(fixture);
const TALL = SIZES['9:16'];
const WIDE = SIZES['16:9'];
const fps = 30;

const shotOf = (sb: Storyboard, id: string): Shot => {
  const found = sb.scenes.flatMap((s) => s.shots).find((s) => s.id === id);
  if (!found) throw new Error(`no shot ${id}`);
  return found;
};
const sceneOf = (sb: Storyboard, id: string) => {
  const found = sb.scenes.find((s) => s.shots.some((shot) => shot.id === id));
  if (!found) throw new Error(`no scene for ${id}`);
  return found;
};
const placed = (sb: Storyboard, id: string, size = WIDE) => {
  const shot = shotOf(sb, id);
  const stage = stageFor(sceneOf(sb, id), size, sb.seed);
  const placements = new Map(
    shot.actors.map((a) => [
      a.character,
      { placement: placeActor(a, stage, 1), pose: basePose(a) },
    ]),
  );
  return { shot, stage, placements };
};

describe('what the builder can put on screen', () => {
  const ids = (kind: string) =>
    library.assets.filter((a) => a.kind === kind).map((a) => a.id.slice(kind.length + 1));

  it('can hold or stand every prop in the library', () => {
    const props = ids('prop').filter((p) => p !== 'in-hand');
    const neither = props.filter((p) => !HELD_PROPS.includes(p) && !STANDING_PROPS.includes(p));
    expect(neither).toEqual([]);
  });

  it('shows every effect that sits on a head, and says which two it cannot show yet', () => {
    const effects = ids('effect');
    for (const e of HEAD_EFFECTS) expect(effects).toContain(e);
    expect(effects.filter((e) => !HEAD_EFFECTS.includes(e)).sort()).toEqual([
      'impact',
      'motion-lines',
    ]);
  });

  it('can build both worked storyboards as they stand', () => {
    expect(unbuildable(farmer, {})).toEqual([]);
    expect(unbuildable(moonTax, {})).toEqual([]);
  });

  it('says it cannot show a thing being put down yet', () => {
    const sb = structuredClone(farmer);
    const shot = shotOf(sb, 's1b');
    const tomas = shot.actors[0];
    if (!tomas) throw new Error('no tomas');
    // He takes the bag and then lets go of it again, with the bag standing in the shot.
    tomas.then = [
      { at: 0.3, pose: 'hold-object', holds: 'bag' },
      { at: 0.7, pose: 'stand', holds: null },
    ];
    expect(unbuildable(sb, {}).join('\n')).toContain(
      'the builder cannot show "tomas" putting the bag down in shot "s1b" yet',
    );
    expect(unbuildable(farmer, {})).toEqual([]);
  });

  it('names what it cannot build before any frame is drawn', () => {
    const sb = structuredClone(farmer);
    const shot = shotOf(sb, 's1a');
    shot.effects = [{ effect: 'impact', on: 'tomas' }];
    shot.props = [{ prop: 'cart', x: 0.7 }];
    const actor = shot.actors[0];
    if (actor) actor.holds = 'trident';
    const first = sb.scenes[0];
    if (first) first.place = 'harbor';
    const tomas = sb.cast[0];
    if (tomas) tomas.look = { outfit: { costume: 'pirate' } };
    const found = unbuildable(sb, {}).join('\n');
    expect(found).toContain('cannot show the effect "impact" yet');
    expect(found).toContain('cannot stand the prop "cart"');
    expect(found).toContain('cannot put the prop "trident" in a hand');
    expect(found).toContain('no place called "harbor"');
    expect(found).toContain('unknown costume "pirate"');
  });
});

describe('the stage', () => {
  it('gives people a bigger share of a wide frame than of a tall one', () => {
    const scene = sceneOf(farmer, 's1a');
    const tall = stageFor(scene, TALL, 1);
    const wide = stageFor(scene, WIDE, 1);
    expect(wide.head / WIDE.height).toBeGreaterThan(tall.head / TALL.height);
    // Someone standing fits between the top of the frame and the caption band, in both.
    for (const [stage, size] of [
      [tall, TALL],
      [wide, WIDE],
    ] as const) {
      expect(stage.groundY - 3.6 * stage.head).toBeGreaterThan(0);
      expect(stage.groundY).toBeLessThan(size.height * 0.82);
    }
  });

  it('spreads spots evenly about the middle and never too far apart', () => {
    const stage = stageFor(sceneOf(farmer, 's4a'), WIDE, 1);
    expect(stageX(stage, 0.5)).toBe(WIDE.width / 2);
    expect(stageX(stage, 0.3) + stageX(stage, 0.7)).toBeCloseTo(WIDE.width, 6);
    expect(stageX(stage, 1) - stageX(stage, 0)).toBeLessThanOrEqual(9.5 * stage.head + 1e-6);
    expect(stageX(stage, 0)).toBeGreaterThanOrEqual(0);
  });

  it('puts a place in the light the scene asks for', () => {
    expect(sceneBackground('castle', 'atmospheric', 'cold-dawn', 1).moon).toBeNull();
    expect(sceneBackground('castle', 'atmospheric', 'cold-dawn', 1).stars).toBe(0);
    expect(sceneBackground('castle', 'atmospheric', 'storm-slate', 1).moon).not.toBeNull();
    expect(sceneBackground('field', 'simple', 'dusk-violet', 1).moon).not.toBeNull();
    expect(sceneBackground('home-interior', 'simple', 'dusk-violet', 1).moon).toBeNull();
    expect(
      sceneBackground('throne-room', 'atmospheric', 'warm-interior', 1).interior,
    ).not.toBeNull();
  });

  it('falls back to an open field for a place it does not know, so a still can be made', () => {
    const scene = { ...sceneOf(farmer, 's1a'), place: 'harbor' };
    expect(stageFor(scene, WIDE, 1).background.hills).toBe(true);
  });
});

describe('a tall frame and a wide one', () => {
  const scene = sceneOf(farmer, 's5b');

  it('lays a scene out as many heads wide in both, so people stand as far apart', () => {
    const tall = stageFor(scene, TALL, farmer.seed);
    const wide = stageFor(scene, WIDE, farmer.seed);
    expect(tall.span / tall.head).toBeCloseTo(9.5, 6);
    expect(wide.span / wide.head).toBeCloseTo(9.5, 6);
    // The soldier who points stands more than an arm away from Tomas in either shape.
    for (const stage of [tall, wide]) {
      expect((stageX(stage, 0.62) - stageX(stage, 0.26)) / stage.head).toBeGreaterThan(3);
    }
  });

  it('draws a place at its own size in a tall frame: as big beside a person as in a wide one', () => {
    // Biku, 2026-10-07: "everything like bush and grass in vertical is shown too big".
    expect(layoutScale(WIDE)).toBe(1);
    expect(layoutScale(TALL)).toBeCloseTo((0.105 * 1920) / ((0.86 * 1080) / 9.5), 6);
    const tall = stageFor(scene, TALL, farmer.seed);
    const wide = stageFor(scene, WIDE, farmer.seed);
    expect(wide.scale).toBe(1);
    expect(tall.scale).toBeGreaterThan(2);
    // In a wide shot a head is the size the shot asks for, and the place is drawn one to one:
    // the layout is closed in on by exactly as much as the place was drawn smaller into it.
    expect(tall.head * tall.scale).toBeCloseTo(0.105 * 1920, 6);
    // Feet stand the same little way below the horizon on screen in both shapes.
    const below = (stage: typeof tall, size: { width: number; height: number }) =>
      ((stage.groundY - stage.background.horizon * size.height) * stage.scale) / size.height;
    expect(below(tall, TALL)).toBeCloseTo(below(wide, WIDE), 6);
    // The picture wraps the place in that scale in a tall frame, and in nothing in a wide one.
    const shots = timedShots(farmer, fps);
    const ts = shots.find((x) => x.shot.id === 's5b');
    if (!ts) throw new Error('no shot s5b');
    const looks = new Map(farmer.cast.map((m) => [m.id, lookFrom(m.look ?? {}, m.id)]));
    const picture = (size: { width: number; height: number }) =>
      renderToStaticMarkup(
        <svg>
          <ShotPicture
            ts={ts}
            shots={shots}
            storyboard={farmer}
            cards={{}}
            looks={looks}
            track={null}
            size={size}
            frame={ts.startFrame + 10}
            fps={fps}
          />
        </svg>,
      );
    expect(picture(TALL)).toContain(`scale(${1 / tall.scale})`);
    expect(picture(WIDE)).not.toContain(`scale(${1 / tall.scale})`);
    expect(picture(WIDE)).not.toMatch(/scale\(0\.\d+\)/);
  });

  it('keeps a whole body in a wide shot: sliding first, moving back only if it must', () => {
    const focus = { x: 540, y: 800, head: 98 };
    const plain = shotTransform('wide', focus, TALL);
    const inside = (t: { scale: number; x: number }, left: number, right: number) =>
      left * t.scale + t.x >= 0.03 * TALL.width - 1 &&
      right * t.scale + t.x <= 0.97 * TALL.width + 1;
    // Already in the picture: nothing changes.
    expect(shotTransform('wide', { ...focus, keep: { left: 450, right: 630 } }, TALL)).toEqual(
      plain,
    );
    // A little off to one side: the camera slides over and stays as close.
    const slid = shotTransform('wide', { ...focus, keep: { left: 240, right: 640 } }, TALL);
    expect(slid.scale).toBeCloseTo(plain.scale, 6);
    expect(inside(plain, 240, 640)).toBe(false);
    expect(inside(slid, 240, 640)).toBe(true);
    // Someone lying down beside someone standing: too wide to slide, so the camera moves back.
    const back = shotTransform('wide', { ...focus, keep: { left: 200, right: 900 } }, TALL);
    expect(back.scale).toBeLessThan(plain.scale);
    expect(back.scale).toBeGreaterThanOrEqual(1);
    expect(inside(back, 200, 900)).toBe(true);
    // A push-in is going to close in: the camera leaves room for where it ends.
    const pushed = shotTransform(
      'wide',
      { ...focus, keep: { left: 200, right: 900, zoom: 1.2 } },
      TALL,
    );
    expect(pushed.scale).toBeLessThan(back.scale);
    // A closer shot is meant to cut bodies off: the rule is for wide shots only.
    const { stage, shot, placements } = placed(farmer, 's9a');
    const whole = new Set(shot.actors.map((a) => a.character));
    expect(shotFocus(shot, stage, placements, whole).keep).toBeDefined();
    const closer = { ...shot, camera: { ...shot.camera, framing: 'medium' as const } };
    expect(shotFocus(closer, stage, placements, whole).keep).toBeUndefined();
    expect(shotFocus(shot, stage, placements).keep).toBeUndefined();
  });
});

describe('where people look and what the camera frames', () => {
  it('turns eyes to another person, a thing on the ground, a thing in a hand, or up', () => {
    const home = placed(farmer, 's4b');
    const wife = home.shot.actors[1];
    const tomasHead = headPoint(
      home.placements.get('tomas')?.placement ??
        placeActor(home.shot.actors[0] as never, home.stage, 1),
      basePose(home.shot.actors[0] as never),
    );
    if (!wife) throw new Error('no wife');
    expect(lookTarget(wife, home.shot, home.stage, home.placements)).toEqual(tomasHead);

    const road = placed(farmer, 's2d');
    const walker = road.shot.actors[0];
    if (!walker) throw new Error('no tomas');
    // He walks in looking ahead and sees the bag once he has stopped.
    const tomas = { ...walker, lookAt: 'bag' };
    const atBag = lookTarget(tomas, road.shot, road.stage, road.placements);
    expect(atBag?.x).toBeCloseTo(stageX(road.stage, 0.6), 6);
    expect(atBag?.y).toBeLessThan(road.stage.groundY);
    expect(atBag?.y).toBeGreaterThan(road.stage.groundY - road.stage.head);

    // The queen turns her coin over in her hand and looks at it.
    const coin = placed(farmer, 's6a');
    const holder = coin.shot.actors[1];
    if (!holder) throw new Error('no holder');
    const atCoin = lookTarget(holder, coin.shot, coin.stage, coin.placements);
    // She faces left, so her hand and the coin in it are to the left of where she sits.
    expect(atCoin?.x).toBeLessThan(stageX(coin.stage, 0.7));

    const up = placed(farmer, 's3b');
    const thinker = up.shot.actors[0];
    if (!thinker) throw new Error('no thinker');
    const above = lookTarget(thinker, up.shot, up.stage, up.placements);
    expect(above?.y).toBeLessThan(0);
    const calm = placed(farmer, 's4d');
    expect(
      lookTarget(calm.shot.actors[0] as never, calm.shot, calm.stage, calm.placements),
    ).toBeNull();
  });

  it('keeps a thing someone looks at in the picture with them', () => {
    const { shot, stage, placements } = placed(farmer, 's1a');
    const focus = shotFocus(shot, stage, placements);
    const tomasX = stageX(stage, 0.42);
    const bagX = stageX(stage, 0.55);
    expect(focus.x).toBeCloseTo((tomasX + bagX) / 2, -Math.log10(stage.head * 0.6));
    expect(focus.span).toBeCloseTo(bagX - tomasX, -Math.log10(stage.head * 0.6));
    const t = shotTransform(shot.camera.framing, focus, WIDE);
    for (const x of [tomasX, bagX]) {
      expect(x * t.scale + t.x).toBeGreaterThan(0);
      expect(x * t.scale + t.x).toBeLessThan(WIDE.width);
    }
  });

  it('frames the one the camera favours, and both of two people otherwise', () => {
    const favoured = placed(farmer, 's4b');
    expect(shotFocus(favoured.shot, favoured.stage, favoured.placements).x).toBeCloseTo(
      stageX(favoured.stage, 0.62),
      -Math.log10(favoured.stage.head * 0.6),
    );
    const both = placed(farmer, 's6e');
    const focus = shotFocus(both.shot, both.stage, both.placements);
    expect(focus.span).toBeCloseTo(
      stageX(both.stage, 0.7) - stageX(both.stage, 0.34),
      -Math.log10(both.stage.head * 0.6),
    );
  });

  it('frames the far person in an over-the-shoulder shot, not the near back', () => {
    const { shot, stage, placements } = placed(farmer, 's6b');
    expect(shotFocus(shot, stage, placements).x).toBeCloseTo(
      stageX(stage, 0.7),
      -Math.log10(stage.head * 0.6),
    );
  });
});

describe('shots and frames', () => {
  it('gives a storyboard with no times three seconds a shot', () => {
    const shots = timedShots(moonTax, fps);
    expect(shots).toHaveLength(13);
    expect(shots[0]).toMatchObject({ startFrame: 0, endFrame: 90, sceneStartFrame: 0 });
    expect(shots[2]).toMatchObject({ startFrame: 180, sceneStartFrame: 180 });
    expect(shotAt(shots, 0)?.shot.id).toBe('s1a');
    expect(shotAt(shots, 95)?.shot.id).toBe('s1b');
    expect(shotAt(shots, 99999)?.shot.id).toBe('s6b');
  });

  it('uses the times the voice gave', () => {
    const sb = structuredClone(moonTax);
    let t = 0;
    for (const scene of sb.scenes) {
      for (const shot of scene.shots) {
        shot.startMs = t;
        shot.endMs = t + 2500;
        t += 2500;
      }
    }
    const shots = timedShots(sb, fps);
    expect(shots[1]).toMatchObject({ startFrame: 75, endFrame: 150 });
  });
});

describe('every shot draws', () => {
  const draw = (sb: Storyboard, size: { width: number; height: number }, at: number): string[] => {
    const shots = timedShots(sb, fps);
    const looks = new Map(sb.cast.map((m) => [m.id, lookFrom(m.look ?? {}, m.id)]));
    return shots.map((ts) =>
      renderToStaticMarkup(
        <svg>
          <ShotPicture
            ts={ts}
            shots={shots}
            storyboard={sb}
            cards={{}}
            looks={looks}
            track={null}
            size={size}
            frame={Math.round(ts.startFrame + (ts.endFrame - ts.startFrame) * at)}
            fps={fps}
          />
        </svg>,
      ),
    );
  };

  it.each([
    ['the Honest Farmer, wide', farmer, WIDE],
    ['the Honest Farmer, tall', farmer, TALL],
    ['the Moon Tax, wide', moonTax, WIDE],
    ['the Moon Tax, tall', moonTax, TALL],
  ] as const)('%s', (_, sb, size) => {
    for (const at of [0, 0.6]) {
      const pictures = draw(sb, size, at);
      expect(pictures).toHaveLength(sb.scenes.reduce((n, s) => n + s.shots.length, 0));
      for (const picture of pictures) {
        expect(picture.length).toBeGreaterThan(2000);
        expect(picture).not.toMatch(/NaN|Infinity|undefined/);
      }
    }
  });

  it('draws the near person of an over-the-shoulder shot on top, from behind', () => {
    const shots = timedShots(farmer, fps);
    const looks = new Map(farmer.cast.map((m) => [m.id, lookFrom(m.look ?? {}, m.id)]));
    const one = (id: string): string => {
      const ts = shots.find((s) => s.shot.id === id);
      if (!ts) throw new Error(`no shot ${id}`);
      return renderToStaticMarkup(
        <svg>
          <ShotPicture
            ts={ts}
            shots={shots}
            storyboard={farmer}
            cards={{}}
            looks={looks}
            track={null}
            size={WIDE}
            frame={ts.startFrame + 12}
            fps={fps}
          />
        </svg>,
      );
    };
    // The same two people as the shot before, and one more figure drawn large over the scene.
    const over = one('s6b');
    const wide = one('s6a');
    expect(over).not.toBe(wide);
    const big = 0.5 * Math.min(WIDE.width, WIDE.height * 0.8);
    expect(over).toContain(`scale(${big}`);
    expect(wide).not.toContain(`scale(${big}`);
  });
});

describe('sitting and standing properly', () => {
  const pictureOf = (id: string): string => {
    const shots = timedShots(farmer, fps);
    const ts = shots.find((x) => x.shot.id === id);
    if (!ts) throw new Error(`no shot ${id}`);
    const looks = new Map(farmer.cast.map((m) => [m.id, lookFrom(m.look ?? {}, m.id)]));
    return renderToStaticMarkup(
      <svg>
        <ShotPicture
          ts={ts}
          shots={shots}
          storyboard={farmer}
          cards={{}}
          looks={looks}
          track={null}
          size={WIDE}
          frame={ts.startFrame + 10}
          fps={fps}
        />
      </svg>,
    );
  };
  /** Every "translate(x y) scale(a b)" in a picture: how each standing thing was placed. */
  const placedThings = (picture: string) =>
    [...picture.matchAll(/translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+) ([-\d.]+)\)/g)].map(
      (m) => ({ x: Number(m[1]), y: Number(m[2]), sx: Number(m[3]), sy: Number(m[4]) }),
    );

  it('gives a child a chair of her own size, under her, facing her way', () => {
    const { stage } = placed(farmer, 's4a');
    const things = placedThings(pictureOf('s4a'));
    const childBody = stage.head * 0.8 * 0.78;
    const hers = things.find((t) => Math.abs(t.sy - childBody) < 0.5);
    expect(hers, 'a chair the size of the child').toBeDefined();
    // She faces left, so her chair is turned round; it stands exactly on her spot.
    expect(hers?.sx).toBeCloseTo(-childBody, 3);
    expect(hers?.x).toBeCloseTo(stageX(stage, 0.8), 3);
    // Her father's chair is full size and faces right.
    const his = things.find((t) => Math.abs(t.x - stageX(stage, 0.3)) < 0.5);
    expect(his?.sx).toBeCloseTo(stage.head, 3);
  });

  it('stands a bag on the floor, never through it', () => {
    const { stage } = placed(farmer, 's4a');
    const things = placedThings(pictureOf('s4a'));
    const bag = things.find((t) => Math.abs(t.x - stageX(stage, 0.385)) < 0.5);
    expect(bag?.y).toBeCloseTo(stage.groundY, 3);
  });
});

describe('moving inside a shot', () => {
  const shots = timedShots(farmer, fps);
  const looks = new Map(farmer.cast.map((m) => [m.id, lookFrom(m.look ?? {}, m.id)]));
  const timed = (id: string) => {
    const ts = shots.find((x) => x.shot.id === id);
    if (!ts) throw new Error(`no shot ${id}`);
    return ts;
  };
  /** The picture of a shot at a point of it, 0 the start and 1 the end. */
  const at = (id: string, share: number): string => {
    const ts = timed(id);
    return renderToStaticMarkup(
      <svg>
        <ShotPicture
          ts={ts}
          shots={shots}
          storyboard={farmer}
          cards={{}}
          looks={looks}
          track={null}
          size={WIDE}
          frame={Math.round(ts.startFrame + (ts.endFrame - ts.startFrame) * share)}
          fps={fps}
        />
      </svg>,
    );
  };
  /** Where the camera put the whole scene: the first "translate(x y) scale(s)" in a picture. */
  const cameraOf = (picture: string) => {
    const m = /translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)/.exec(picture);
    if (!m) throw new Error('no camera');
    return { x: Number(m[1]), y: Number(m[2]), scale: Number(m[3]) };
  };
  /** Where each person stands: every "translate(x y) scale(a b)" with a body-sized scale. */
  const peopleOf = (picture: string, head: number) =>
    [...picture.matchAll(/translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+) ([-\d.]+)\)/g)]
      .map((m) => ({ x: Number(m[1]), sx: Number(m[3]), sy: Number(m[4]) }))
      .filter((t) => Math.abs(t.sy - head) < 0.5 && Math.abs(Math.abs(t.sx) - head) < 0.5);

  it('takes a thing in the hand partway through, not from the start', () => {
    // Tomas, on his knee, is given a coin a quarter of the way into the shot and rises with it.
    expect(at('s7b', 0.1)).not.toContain('-coin');
    expect(at('s7b', 0.6)).toContain('-coin');
  });

  it('walks someone in and stops them on their own spot', () => {
    const { stage } = placed(farmer, 's2d');
    const spot = stageX(stage, 0.47);
    const x = (share: number) => {
      const tomas = peopleOf(at('s2d', share), stage.head)[0];
      if (!tomas) throw new Error('nobody drawn');
      return tomas.x;
    };
    // He comes from behind his spot, gets nearer with every step, and stays once he is there.
    expect(x(0)).toBeLessThan(x(0.25));
    expect(x(0.25)).toBeLessThan(spot);
    expect(x(0.7)).toBeCloseTo(spot, 3);
    expect(x(0.95)).toBeCloseTo(spot, 3);
  });

  it('lets the body move in the frame, the camera following a beat behind', () => {
    // Tomas stands up from his chair 0.4 of the way into a medium shot.
    const ts = timed('s4d');
    const length = ts.endFrame - ts.startFrame;
    const share = (frames: number) => 0.4 + frames / length;
    const seated = cameraOf(at('s4d', 0.3));
    const justUp = cameraOf(at('s4d', share(4)));
    const settled = cameraOf(at('s4d', 0.95));
    // The camera ends up higher, on the standing head.
    expect(settled.y - seated.y).toBeGreaterThan(60);
    // Four frames in, the body is most of the way up and the camera has hardly begun.
    expect(justUp.y - seated.y).toBeLessThan((settled.y - seated.y) * 0.2);
    // It never jumps: no frame moves it more than a small share of the whole way.
    let before = seated.y;
    for (let f = 0; f <= 24; f++) {
      const now = cameraOf(at('s4d', share(f))).y;
      expect(Math.abs(now - before)).toBeLessThan((settled.y - seated.y) * 0.12);
      before = now;
    }
  });

  it('changes a face partway through without touching the body', () => {
    // s1b: once he is standing with the bag, his face turns from afraid to thinking.
    const afraid = at('s1b', 0.68);
    const thinking = at('s1b', 0.95);
    expect(afraid).not.toBe(thinking);
    expect(peopleOf(afraid, placed(farmer, 's1b').stage.head)[0]?.x).toBe(
      peopleOf(thinking, placed(farmer, 's1b').stage.head)[0]?.x,
    );
  });

  it('picks a thing up off the ground: there is one bag all the way, first standing, then in the hand', () => {
    // s1b: kneeling by the bag, he takes it 0.3 of the way in and stands up with it.
    const ts = timed('s1b');
    const length = ts.endFrame - ts.startFrame;
    const bags = (picture: string) => picture.match(/id="[^"]*bag-body"/g) ?? [];
    const standing = 'id="s1b-bag-0-bag-body"';
    for (let f = 0; f < length; f += 2) {
      expect(bags(at('s1b', f / length)), `frame ${f}`).toHaveLength(1);
    }
    // While the hand is still on its way the bag has not left the ground.
    expect(at('s1b', 0.1)).toContain(standing);
    expect(at('s1b', 0.3 + 4 / length)).toContain(standing);
    // Once the hand has closed on it, it goes where the hand goes.
    expect(at('s1b', 0.3 + 12 / length)).not.toContain(standing);
    expect(at('s1b', 0.9)).not.toContain(standing);
  });

  it('carries someone across a cut as they were: same place, same way round, same pose', () => {
    // The opening is one action over two shots: he kneels in the first and is kneeling in the second.
    const { stage } = placed(farmer, 's1a');
    const end = peopleOf(at('s1a', 0.999), stage.head)[0];
    const start = peopleOf(at('s1b', 0), stage.head)[0];
    expect(end && start).toBeTruthy();
    expect(start?.x).toBeCloseTo(end?.x ?? NaN, 3);
    expect(Math.sign(start?.sx ?? 0)).toBe(Math.sign(end?.sx ?? 0));
    const first = shotOf(farmer, 's1a').actors[0];
    const second = shotOf(farmer, 's1b').actors[0];
    expect(first?.then.at(-1)?.pose).toBe(second?.pose);
    expect(first?.facing).toBe(second?.facing);
  });
});
