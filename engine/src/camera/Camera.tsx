import type { ReactNode } from 'react';
import { Easing, interpolate } from 'remotion';

/**
 * A 2D camera over the whole scene (Part 2, section 7.6): a slow push-in toward a focus point.
 * Plain cuts between shots are made by the shot sequences, not here.
 */
export const PushIn = ({
  frame,
  durationInFrames,
  strength,
  focus,
  children,
}: {
  frame: number;
  durationInFrames: number;
  /** 0.1 means the frame ends 10% closer. */
  strength: number;
  focus: { x: number; y: number };
  children: ReactNode;
}) => {
  const zoom = interpolate(frame, [0, Math.max(1, durationInFrames)], [1, 1 + strength], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <g
      transform={`translate(${focus.x} ${focus.y}) scale(${zoom}) translate(${-focus.x} ${-focus.y})`}
    >
      {children}
    </g>
  );
};
