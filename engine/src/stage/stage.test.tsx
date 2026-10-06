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
import { shotTransform } from '../camera/Framing';
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
    const tomas = road.shot.actors[0];
    if (!tomas) throw new Error('no tomas');
    const atBag = lookTarget(tomas, road.shot, road.stage, road.placements);
    expect(atBag?.x).toBeCloseTo(stageX(road.stage, 0.62), 6);
    expect(atBag?.y).toBeLessThan(road.stage.groundY);
    expect(atBag?.y).toBeGreaterThan(road.stage.groundY - road.stage.head);

    const coin = placed(farmer, 's2e');
    const holder = coin.shot.actors[0];
    if (!holder) throw new Error('no holder');
    const atCoin = lookTarget(holder, coin.shot, coin.stage, coin.placements);
    expect(atCoin?.x).toBeGreaterThan(stageX(coin.stage, 0.45));

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
    const bagX = stageX(stage, 0.6);
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
      stageX(both.stage, 0.64) - stageX(both.stage, 0.34),
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
