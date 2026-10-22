import { graphicSchema } from '@studio/shared';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SunsetPicture } from '../explainer/SunsetWorld';

/**
 * The sunset look test (2026-10-19): the beach moment of "Why Is the Sun Already Gone When You
 * Watch It Set?" at one level of polish, for Biku to pick by eye (0 today's flat look, 1 lit,
 * 2 layered, 3 crafted). The camera eases in from the phone's screen to the beach and holds.
 */
const SHOT = graphicSchema.parse({
  kind: 'journey',
  world: 'sunset',
  from: 'screen',
  at: 'beach',
  keep: ['shimmer', 'phone'],
  show: [],
});

export function SunsetLookVideo({ polish }: { polish: number }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  if (SHOT.kind !== 'journey') return null;
  return (
    <SunsetPicture
      g={SHOT}
      local={frame}
      duration={6 * fps}
      times={[]}
      clock={frame}
      fps={fps}
      width={width}
      height={height}
      polish={polish}
    />
  );
}
