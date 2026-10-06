import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EXPRESSIONS } from '../face/expressions';
import { Character, toLocal, toScreen } from '../rig/Character';
import { vec } from '../rig/math';
import { resolvePose } from '../rig/pose';
import { stand } from '../rig/poses';
import { accent, ink, pick, tokens, white } from '../tokens';
import { AngerMark } from './AngerMark';
import { DizzyStars } from './Dizzy';
import { IMPACT_SECONDS, Impact } from './Impact';
import { MotionLines } from './MotionLines';
import { HeadSymbol, SYMBOLS } from './Symbol';
import { TearDrops, TearStreams } from './Tears';

/** Phase 2D effects (Style 3.7). */

const count = (html: string, piece: string) => html.split(piece).length - 1;

describe('tears', () => {
  it('are the light blue of sweat, outlined', () => {
    const html = renderToStaticMarkup(
      <svg>
        <TearStreams turn={0} t={0.2} />
      </svg>,
    );
    expect(html).toContain(tokens.effects.sweat);
    expect(html).toContain(ink);
  });

  it('run from both eyes, and from the one eye that shows in profile', () => {
    const streams = (turn: number) =>
      count(
        renderToStaticMarkup(
          <svg>
            <TearStreams turn={turn} t={0.2} />
          </svg>,
        ),
        'stroke-dasharray',
      );
    expect(streams(0)).toBe(2);
    expect(streams(0.5)).toBe(2);
    expect(streams(1)).toBe(1);
  });

  it('single tears roll down and fall, the same every time for the same moment', () => {
    const at = (t: number) => renderToStaticMarkup(<TearDrops turn={0} t={t} />);
    expect(at(0.4)).toBe(at(0.4));
    expect(at(0.4)).not.toBe(at(0.9));
  });
});

describe('anger mark', () => {
  it('is the token red, outlined, and throbs', () => {
    const still = renderToStaticMarkup(<AngerMark t={0} />);
    expect(still).toContain(tokens.effects.anger);
    expect(still).toContain(ink);
    expect(renderToStaticMarkup(<AngerMark t={0.2} />)).not.toBe(still);
  });
});

describe('dizzy stars', () => {
  it('draws the stars asked for in gold and moves them round', () => {
    const html = renderToStaticMarkup(<DizzyStars t={0} count={4} />);
    expect(count(html, '<path')).toBe(4);
    expect(html).toContain(pick(accent('gold'), 0));
    expect(renderToStaticMarkup(<DizzyStars t={0.3} count={4} />)).not.toBe(html);
  });
});

describe('symbols over the head', () => {
  it.each(SYMBOLS)('%s is bold, white and outlined', (kind) => {
    const html = renderToStaticMarkup(<HeadSymbol kind={kind} />);
    expect(html).toContain(white);
    expect(html).toContain(ink);
  });

  it('pops in from nothing', () => {
    expect(renderToStaticMarkup(<HeadSymbol kind="!" t={0} />)).toBe('');
    expect(renderToStaticMarkup(<HeadSymbol kind="!" t={1} />)).toContain('scale(1 1)');
  });

  it('never reads backward on a character that faces left', () => {
    const facing = (way: 'left' | 'right') =>
      renderToStaticMarkup(
        <svg>
          <Character
            x={0}
            groundY={0}
            head={100}
            facing={way}
            pose={resolvePose(stand)}
            face={EXPRESSIONS.neutral}
            headEffects={<HeadSymbol kind="?" t={1} />}
          />
        </svg>,
      );
    // The character is mirrored, and the symbol mirrors itself back.
    expect(facing('left')).toContain('scale(-1 1)');
    expect(facing('right')).not.toContain('scale(-1 1)');
  });
});

describe('impact flash', () => {
  it('is there only for a moment', () => {
    const at = (t: number) => renderToStaticMarkup(<Impact x={10} y={20} head={100} t={t} />);
    expect(at(-0.01)).toBe('');
    expect(at(IMPACT_SECONDS)).toBe('');
    expect(at(IMPACT_SECONDS / 2)).toContain(white);
    expect(at(IMPACT_SECONDS / 2)).toContain(ink);
    expect(IMPACT_SECONDS).toBeLessThan(0.4);
  });

  it('has the same shape every time for the same seed', () => {
    const at = (seed: number) =>
      renderToStaticMarkup(<Impact x={0} y={0} head={100} t={0.1} seed={seed} />);
    expect(at(4)).toBe(at(4));
    expect(at(4)).not.toBe(at(5));
  });
});

describe('motion lines', () => {
  it('draws black lines behind the moving thing', () => {
    const html = renderToStaticMarkup(
      <MotionLines x={0} y={0} head={100} direction={0} count={3} />,
    );
    expect(count(html, '<line')).toBe(3);
    expect(html).toContain(ink);
    // Moving right, so every line lies to the left of the thing.
    const xs = [...html.matchAll(/x[12]="(-?[\d.]+)"/g)].map((m) => Number(m[1]));
    expect(xs.length).toBe(6);
    for (const x of xs) expect(x).toBeLessThan(0);
  });

  it('jitters every other frame', () => {
    const at = (frame: number) =>
      renderToStaticMarkup(<MotionLines x={0} y={0} head={100} direction={0} frame={frame} />);
    expect(at(0)).toBe(at(1));
    expect(at(0)).not.toBe(at(2));
  });
});

describe('screen points', () => {
  it('toScreen is the reverse of toLocal, facing either way', () => {
    for (const facing of ['left', 'right'] as const) {
      const c = { x: 300, groundY: 900, head: 120, facing };
      const p = vec(0.7, -1.4);
      const back = toLocal(toScreen(p, c), c);
      expect(back.x).toBeCloseTo(p.x, 9);
      expect(back.y).toBeCloseTo(p.y, 9);
    }
  });
});
