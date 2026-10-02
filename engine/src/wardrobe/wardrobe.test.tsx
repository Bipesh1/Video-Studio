import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EXPRESSIONS } from '../face/expressions';
import { Character } from '../rig/Character';
import { resolvePose } from '../rig/pose';
import { holdObject, stand } from '../rig/poses';
import {
  accent,
  hairColor,
  ink,
  lighten,
  luminance,
  mix,
  pick,
  shade,
  skinTone,
  tokens,
} from '../tokens';
import { RULER } from './costumes/ruler';
import { HAIR_STYLES } from './hair';
import { skinColors } from './identity';
import type { Identity } from './types';

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

describe('color helpers', () => {
  it('shade makes a tone the given amount darker', () => {
    const base = '#C08258';
    const dark = shade(base, 0.15);
    channels(dark).forEach((v, i) => expect(v).toBeCloseTo((channels(base)[i] ?? 0) * 0.85, -0.5));
  });

  it('mix and lighten hit their endpoints', () => {
    expect(mix('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mix('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
    expect(luminance(lighten('#3F2416', 0.3))).toBeGreaterThan(luminance('#3F2416'));
  });
});

describe('identity mode (Style 3.4)', () => {
  it('uses the eight token skin tones, light to dark', () => {
    for (let t = 1; t <= 8; t++) expect(skinColors(t).skin).toBe(skinTone(t));
    for (let t = 1; t < 8; t++)
      expect(luminance(skinTone(t))).toBeGreaterThan(luminance(skinTone(t + 1)));
    expect(() => skinTone(9)).toThrow();
  });

  it('gives each tone a shadow 15% darker', () => {
    for (let t = 1; t <= 8; t++) {
      const { skin, shadow } = skinColors(t);
      expect(shadow).toBe(shade(skin, tokens.fill.shadowDarken[0]));
    }
  });

  it('adds a lighter rim only on the darkest three tones', () => {
    for (let t = 1; t <= 8; t++) {
      const rim = skinColors(t).rim;
      if (t >= 6) {
        expect(rim).toBeDefined();
        expect(luminance(rim ?? '')).toBeGreaterThan(luminance(skinTone(t)));
      } else {
        expect(rim).toBeUndefined();
      }
    }
  });

  it('has every hair color the guide names', () => {
    for (const name of ['black', 'dark-brown', 'brown', 'auburn', 'blond', 'gray', 'white']) {
      const [fill, shadow] = hairColor(name);
      expect(luminance(shadow)).toBeLessThan(luminance(fill));
    }
  });

  it('draws every hair style, with beard and moustache, at every head turn', () => {
    for (const hair of HAIR_STYLES) {
      for (const turn of [0, 0.5, 1]) {
        for (const facialHair of ['none', 'beard', 'moustache'] as const) {
          const id: Identity = { skinTone: 5, hair, hairColor: 'brown', facialHair };
          const svg = renderToStaticMarkup(
            <svg>
              <Character
                x={0}
                groundY={0}
                head={100}
                pose={resolvePose(stand)}
                face={EXPRESSIONS.neutral}
                turn={turn}
                identity={id}
              />
            </svg>,
          );
          expect(svg).not.toContain('NaN');
          expect(svg).toContain(skinTone(5));
          if (hair !== 'bald' && hair !== 'head-wrap') expect(svg).toContain(hairColor('brown')[0]);
        }
      }
    }
  });

  it('fills identity hands with the skin tone, outlined', () => {
    const svg = renderToStaticMarkup(
      <svg>
        <Character
          x={0}
          groundY={0}
          head={100}
          pose={resolvePose(stand)}
          face={EXPRESSIONS.neutral}
          identity={{ skinTone: 7, hair: 'afro', hairColor: 'black' }}
        />
      </svg>,
    );
    expect(svg.match(new RegExp(`fill="${skinTone(7)}"`, 'g'))?.length ?? 0).toBeGreaterThan(2);
  });
});

describe('the costumed ruler (Style 3.5)', () => {
  it('is tier 2 with at most four colors, gloved, all from token accents', () => {
    expect(RULER.tier).toBe(2);
    expect(RULER.colors.length).toBeLessThanOrEqual(4);
    expect(RULER.gloves).toBe(true);
    for (const name of RULER.colors.filter((c) => c !== 'white gloves'))
      expect(tokens.accents[name]).toBeDefined();
  });

  it('draws the cape lining first and the crown after the head', () => {
    const svg = renderToStaticMarkup(
      <svg>
        <Character
          x={0}
          groundY={0}
          head={100}
          pose={resolvePose(holdObject)}
          face={EXPRESSIONS.angry}
          eyeStyle="stern"
          outfit={RULER}
        />
      </svg>,
    );
    const lining = svg.indexOf(pick(accent('crimson'), 1));
    const steel = svg.indexOf(pick(accent('steel'), 0));
    const headOutline = svg.indexOf(
      `stroke="${ink}" stroke-width="${tokens.line.outlinePctOfHead[0] / 2 + tokens.line.outlinePctOfHead[1] / 2}"`,
    );
    const crownGold = svg.lastIndexOf(pick(accent('gold'), 0));
    expect(lining).toBeGreaterThan(-1);
    expect(lining).toBeLessThan(steel);
    expect(headOutline).toBeGreaterThan(-1);
    expect(crownGold).toBeGreaterThan(headOutline);
    expect(svg).not.toContain('NaN');
  });
});
