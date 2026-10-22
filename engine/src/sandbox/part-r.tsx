import type { Graphic } from '@studio/shared';
import { graphicSchema } from '@studio/shared';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ExplainerGraphic } from '../explainer/Graphic';

/**
 * The journey test (2026-10-17): the first moves of "Why Your Phone's Map Needs Einstein", with no
 * voice, to judge the immersive camera before a video is built on it (Biku: "the animation should
 * be very immersive, not a bunch of slideshows"). Your phone's map; up through the street, the
 * clouds and the sky to the whole Earth and its satellites; the time signals coming down; into one
 * satellite, whose front lifts off its clock; back out to the four distances meeting at you.
 */
type Step = { seconds: number; g: Graphic };
const step = (seconds: number, g: Record<string, unknown>): Step => ({
  seconds,
  g: graphicSchema.parse({ kind: 'journey', world: 'orbit', ...g }),
});
export const JOURNEY_TEST: Step[] = [
  step(3, {
    at: 'phone',
    show: [{ item: 'dot' }],
    title: { lines: ['HOW DOES THE', 'BLUE DOT KNOW?'], stress: 1 },
  }),
  step(5, { from: 'phone', at: 'earth', keep: ['dot'], show: [{ item: 'satellites' }] }),
  step(3.5, { from: 'earth', at: 'sky', keep: ['dot', 'satellites'], show: [{ item: 'signals' }] }),
  step(3.5, { from: 'sky', at: 'satellite', keep: ['dot', 'satellites', 'signals'] }),
  step(3.5, {
    from: 'satellite',
    at: 'inside',
    keep: ['dot', 'satellites'],
    show: [{ item: 'open' }],
  }),
  step(4, {
    from: 'inside',
    at: 'sky',
    keep: ['dot', 'satellites', 'open'],
    show: [{ item: 'ranges' }],
    callout: { value: '4', caption: 'SATELLITES / ONE SPOT: YOU', at: 'you' },
  }),
  step(4, {
    from: 'sky',
    at: 'well',
    keep: ['dot', 'satellites', 'open'],
    show: [{ item: 'well' }, { item: 'clocks' }],
  }),
  step(4.5, { from: 'well', at: 'phone', keep: ['dot', 'satellites'], show: [{ item: 'drift' }] }),
];
export const JOURNEY_TEST_SECONDS = JOURNEY_TEST.reduce((s, x) => s + x.seconds, 0);

export function JourneyTestVideo() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  let start = 0;
  for (const s of JOURNEY_TEST) {
    const frames = Math.round(s.seconds * fps);
    if (frame < start + frames || s === JOURNEY_TEST[JOURNEY_TEST.length - 1]) {
      const local = frame - start;
      const n = s.g.kind === 'journey' ? s.g.show.length + (s.g.callout ? 1 : 0) : 0;
      // With no voice, the things arrive one after another through the first half of the shot.
      const times = Array.from({ length: n }, (_, i) => Math.round(frames * (0.35 + 0.18 * i)));
      return (
        <ExplainerGraphic
          graphic={s.g}
          local={local}
          duration={frames}
          times={times}
          width={width}
          height={height}
          clock={frame}
          fps={fps}
        />
      );
    }
    start += frames;
  }
  return null;
}
