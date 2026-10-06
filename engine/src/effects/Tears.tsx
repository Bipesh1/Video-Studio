import { useId } from 'react';
import { EYE_H, EYE_W, EYE_Y, eyeSlots } from '../face/layout';
import { body } from '../rig/body';
import { clamp, vec } from '../rig/math';
import type { Vec2 } from '../rig/math';
import { ink, lineWeights, tokens, white } from '../tokens';
import { Drop } from './Sweat';

/**
 * Tears (Style 3.7): light blue streams or drops from the eyes, in the same blue as sweat.
 * Drawn in head space over the face. Give them the same `turn` as the character, so they start
 * at the eyes wherever the head is turned.
 */

type Eye = { side: -1 | 1; x: number; width: number };

/** The eyes that show at a head turn, exactly where the face draws them. */
const eyesAt = (turn: number): Eye[] =>
  eyeSlots(turn).map((slot) => ({ side: slot.side, x: slot.x, width: slot.widthFactor }));

/**
 * The line a tear runs along: from the lower outer corner of an eye, out around the mouth and
 * down off the jaw. In profile it runs straight down the cheek.
 */
function course(eye: Eye, turn: number): { from: Vec2; bend: Vec2; to: Vec2 } {
  const out = eye.side * (1 - 0.75 * clamp(turn, 0, 1));
  const from = vec(eye.x + eye.side * EYE_W * eye.width * 0.2, EYE_Y + EYE_H * 0.44);
  return {
    from,
    bend: vec(from.x + out * 0.13, 0.2),
    to: vec(from.x + out * 0.2, body.headRadiusY + 0.06),
  };
}

const along = (c: ReturnType<typeof course>, u: number): Vec2 => {
  const v = 1 - u;
  return vec(
    v * v * c.from.x + 2 * v * u * c.bend.x + u * u * c.to.x,
    v * v * c.from.y + 2 * v * u * c.bend.y + u * u * c.to.y,
  );
};

const STREAM_W = 0.065;
const EDGE = lineWeights.outline * 0.55;

/**
 * Streams of tears running from both eyes down the cheeks and off the jaw: bawling. The
 * streams swell a little in time, and a drop flies off the end of each on a loop.
 */
export function TearStreams({ turn = 0, t = 0 }: { turn?: number; t?: number }) {
  const clip = `tears${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const eyes = eyesAt(turn);
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <ellipse rx={body.headRadiusX} ry={body.headRadiusY} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {eyes.map((eye, i) => {
          const c = course(eye, turn);
          const d = `M ${c.from.x} ${c.from.y} Q ${c.bend.x} ${c.bend.y} ${c.to.x} ${c.to.y}`;
          const swell = 1 + 0.14 * Math.sin(t * 9 + i * 2.1);
          return (
            <g key={eye.side} fill="none" strokeLinecap={tokens.line.cap}>
              <path d={d} stroke={ink} strokeWidth={STREAM_W * swell + 2 * EDGE} />
              <path d={d} stroke={tokens.effects.sweat} strokeWidth={STREAM_W * swell} />
              <path
                d={d}
                stroke={white}
                strokeWidth={STREAM_W * 0.22}
                strokeDasharray="0.05 0.16"
                strokeDashoffset={-t * 0.5}
              />
            </g>
          );
        })}
      </g>
      {eyes.map((eye, i) => {
        // A drop leaves the jaw at the end of each stream, flies out and down, and fades.
        const c = course(eye, turn);
        const u = (t / 0.5 + i * 0.5) % 1;
        const start = along(c, 0.86);
        const out = eye.side * (1 - 0.75 * clamp(turn, 0, 1));
        const x = start.x + out * 0.2 * u;
        const y = start.y + 0.05 * u + 0.5 * u * u;
        return <Drop key={eye.side} x={x} y={y} size={0.05} tip={-out * 20} opacity={1 - u * u} />;
      })}
    </g>
  );
}

/** Seconds for one tear to form, roll down the cheek and fall. */
export const TEAR_SECONDS = 1.6;

/**
 * Single tears: a drop wells up at each eye in turn, rolls down the cheek and falls off the
 * jaw. Quiet crying, for a sad face.
 */
export function TearDrops({
  turn = 0,
  t = 0,
  period = TEAR_SECONDS,
}: {
  turn?: number;
  t?: number;
  period?: number;
}) {
  const eyes = eyesAt(turn);
  return (
    <g>
      {eyes.map((eye, i) => {
        const c = course(eye, turn);
        const u = (((t / period + i * 0.45) % 1) + 1) % 1;
        // Wells up, rolls to the jaw, then falls faster and faster and fades.
        const grow = clamp(u / 0.2, 0, 1);
        const roll = clamp((u - 0.2) / 0.5, 0, 1);
        const drop = clamp((u - 0.7) / 0.3, 0, 1);
        const p = along(c, 0.02 + 0.82 * roll * roll);
        return (
          <Drop
            key={eye.side}
            x={p.x}
            y={p.y + 0.34 * drop * drop}
            size={0.075 * (0.35 + 0.65 * grow)}
            tip={0}
            opacity={1 - drop * drop}
          />
        );
      })}
    </g>
  );
}
