import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { characterCardSchema } from '@studio/shared';
import type { CharacterCard } from '@studio/shared';
import { describe, expect, it } from 'vitest';
import { resolvePose } from '../rig/pose';
import { stand } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import { walkAt } from '../rig/walk';
import { COSTUMES, castFromCard } from './cast';
import { CLOTH_COLORS, cloth } from './cloth';
import { GARMENTS, outfitFrom } from './garments';
import { HAIR_BEHIND_BODY, HAIR_STYLES } from './hair';
import { AGES } from './types';

/** Phase 2B: tier 1 clothes, costumes, ages and character cards. */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('tier 1 clothes', () => {
  it('take every color from the token cloth colors', () => {
    for (const name of CLOTH_COLORS) {
      const k = cloth(name);
      expect(k.fill).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(k.shadow).not.toBe(k.fill);
    }
    expect(() => cloth('mauve')).toThrow();
  });

  it('mix into one tier 1 outfit of at most four colors', () => {
    const outfit = outfitFrom({
      top: { kind: 'tank-top', cloth: 'white' },
      bottom: { kind: 'trousers', cloth: 'denim' },
      shoes: { kind: 'sneakers', cloth: 'white' },
    });
    expect(outfit.tier).toBe(1);
    expect(outfit.colors).toEqual(['white', 'denim']);
    expect(outfit.colors.length).toBeLessThanOrEqual(4);
    // Trouser legs hang from hips set apart; a tank top leaves the arms as stick lines.
    expect(outfit.hipSpread).toBeGreaterThan(0);
    expect(outfit.trousers).toBeDefined();
    expect(outfit.sleeves).toBeUndefined();
    expect(outfit.boots?.style).toBe('sneaker');
  });

  it('give a shirt sleeves, long unless asked for short', () => {
    expect(outfitFrom({ top: { kind: 'shirt', cloth: 'forest' } }).sleeveLength).toBe('long');
    const short = outfitFrom({ top: { kind: 'shirt', cloth: 'forest', sleeves: 'short' } });
    expect(short.sleeveLength).toBe('short');
    expect(short.sleeves).toBeDefined();
  });

  it('put a hood on the head only when it is up', () => {
    expect(outfitFrom({ cloak: { cloth: 'crimson' } }).headwear).toBeUndefined();
    expect(outfitFrom({ cloak: { cloth: 'crimson', hood: true } }).headwear).toBeDefined();
    expect(outfitFrom({ cloak: { cloth: 'crimson' } }).back).toBeDefined();
  });

  it('name every garment the library lists', () => {
    expect(new Set(GARMENTS).size).toBe(GARMENTS.length);
    expect(GARMENTS).toContain('tank-top');
    expect(GARMENTS).toContain('sneakers');
  });
});

describe('hips set apart for trousers', () => {
  it('keep planted feet where the pose put them', () => {
    const pose = resolvePose(stand);
    const plain = computeSkeleton(pose);
    const apart = computeSkeleton(pose, { hipSpread: 0.13 });
    expect(apart.legs.front.hip.x - apart.legs.back.hip.x).toBeCloseTo(0.26, 9);
    expect(apart.legs.front.foot.x).toBeCloseTo(plain.legs.front.foot.x, 6);
    expect(apart.legs.back.foot.x).toBeCloseTo(plain.legs.back.foot.x, 6);
    expect(Math.abs(apart.legs.front.foot.y)).toBeLessThan(1e-6);
  });

  it('close up in profile, so a walk keeps its stride', () => {
    const pose = walkAt(0.3).pose;
    const profile = computeSkeleton(pose, { hipSpread: 0.13, turn: 1 });
    expect(profile.legs.front.hip.x - profile.legs.back.hip.x).toBeLessThan(0.06);
  });
});

describe('ages and long hair', () => {
  it('offer child, adult and elder', () => {
    expect([...AGES]).toEqual(['child', 'adult', 'elder']);
  });

  it('draw long hair behind the whole body', () => {
    expect(HAIR_STYLES).toContain('long');
    expect(HAIR_BEHIND_BODY).toContain('long');
  });
});

describe('character cards', () => {
  const files = readdirSync(join(root, 'characters')).filter((f) => f.endsWith('.json'));
  const cards = files.map((f) => ({
    file: f,
    card: characterCardSchema.parse(JSON.parse(readFileSync(join(root, 'characters', f), 'utf8'))),
  }));

  it('exist as samples and are valid', () => {
    expect(cards.length).toBeGreaterThanOrEqual(3);
    for (const { file, card } of cards) expect(file).toBe(`${card.id}.json`);
  });

  it('all turn into something the engine can draw', () => {
    for (const { card } of cards) {
      const cast = castFromCard(card);
      expect(cast.look.age).toBe(card.age);
      expect(cast.size).toBe(card.size);
      expect(cast.face.mouth).toBeDefined();
      if (card.outfit) expect(cast.look.outfit).toBeDefined();
      if (card.identity) expect(cast.look.identity?.skinTone).toBe(card.identity.skinTone);
    }
  });

  it('cover a child, an adult and an elder', () => {
    expect(new Set(cards.map((c) => c.card.age))).toEqual(new Set(AGES));
  });

  it('fail in plain words when a card names something that does not exist', () => {
    const base = cards[0]?.card as CharacterCard;
    expect(() => castFromCard({ ...base, outfit: { costume: 'pirate' } })).toThrow(
      /unknown costume "pirate"/,
    );
    expect(() => castFromCard({ ...base, expression: 'bored' })).toThrow(/unknown expression/);
    expect(() =>
      castFromCard({ ...base, identity: { skinTone: 3, hair: 'mohawk', hairColor: 'black' } }),
    ).toThrow(/unknown hair style "mohawk"/);
  });

  it('reject a dress worn together with a top', () => {
    const r = characterCardSchema.safeParse({
      ...cards[0]?.card,
      outfit: {
        clothes: {
          onePiece: { kind: 'dress', cloth: 'crimson' },
          top: { kind: 'shirt', cloth: 'white' },
        },
      },
    });
    expect(r.success).toBe(false);
  });

  it('know every full costume by name', () => {
    expect(Object.keys(COSTUMES).sort()).toEqual(['farmer', 'queen', 'ruler', 'soldier']);
  });
});
