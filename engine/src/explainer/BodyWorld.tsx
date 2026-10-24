import type { JOURNEY_STOPS } from '@studio/shared';
import type { Graphic, JourneyStop, JourneyThing } from '@studio/shared';
import type { ReactNode } from 'react';
import { BALANCE, BELLY_HALL, BLOB, Hall, MOUTH_HALL, SOFA, TREADMILL, YOU } from './BodyHall';
import { BELLY, CELL, Inside, LUNGS, MOUTH_BODY } from './BodyInside';
import { J, LINE, MASCOT_HEAD, MASCOT_TALL, at, font, rnd } from './bodyKit';
import type { Room, State } from './bodyKit';
import { clamp, outBack, smooth, viewOf, zoomPath } from './Journey';
import type { Cam } from './Journey';
import { wordCamera } from './wordCamera';

/**
 * The world `body` (2026-10-21, "Where Does Your Fat Go When You Lose Weight?", Biku's script):
 * a show in a hall about where your fat goes, and the inside of you. The camera starts on your
 * feet on the bathroom scale (one room of a house set on the stage), pulls back over the experts
 * who got it wrong, dives into your belly, opens a fat cell and its oil down to the atoms,
 * follows them through the blood to the lungs, flies out of your mouth in a breath, then visits
 * the gym, the giant balance of the two scientists and the sofa, and comes home to the scale.
 *
 * Two places: the hall, in metres, and the inside of you, a cutaway in metres down to a tenth of
 * a millimetre. Within a place the camera flies the smooth zoom of every journey; from the hall
 * into you it dives into your belly through a warm rush, and out of you it rides your breath out
 * of your mouth. The mascot is the channel's own (characters/catch-mascot.json), in look C.
 */

type Journey = Extract<Graphic, { kind: 'journey' }>;
type BodyStop = (typeof JOURNEY_STOPS)['body'][number];
type Place = 'hall' | 'body';

/** The middle of your head in the hall, standing on the scale. */
const HEAD_Y = YOU.ground - MASCOT_TALL + MASCOT_HEAD / 2;

/** Each stop: its place and where the camera looks, laid out for the tall picture. */
function stopOf(stop: JourneyStop, tall: boolean): { place: Place; cam: Cam } {
  const k = tall ? 1 : 1.9;
  const hall = (x: number, y: number, w: number) => ({
    place: 'hall' as const,
    cam: { x, y, w: w * k },
  });
  const body = (x: number, y: number, w: number) => ({
    place: 'body' as const,
    cam: { x, y, w: w * k },
  });
  switch (stop as BodyStop) {
    case 'feet':
      return hall(0.18, -0.3, 1.05);
    case 'scale':
      return hall(0.2, -1.0, 2.7);
    case 'hall':
      return hall(0, 1.6, 9.8);
    case 'crowd':
      return hall(0.2, 3.1, 7.0);
    case 'blob':
      return hall(BLOB.x, BLOB.y, 0.7);
    case 'atoms':
      return hall(BLOB.x, BLOB.y, 0.17);
    case 'belly':
      return body(BELLY.x, BELLY.y, 0.3);
    case 'cell':
      return body(CELL.x, CELL.y, 0.042);
    case 'chain':
      return body(CELL.x + 0.0002, CELL.y + 0.0002, 0.0078);
    case 'pieces':
      return body(CELL.x, CELL.y, 0.0098);
    case 'leftovers':
      return body(CELL.x, CELL.y - 0.0004, 0.0115);
    case 'nose':
      return body(0.2, -1.42, 0.62);
    case 'lungs':
      return body(LUNGS.x + 0.02, LUNGS.y - 0.15, 0.78);
    case 'blood':
      return body(0.07, -1.05, 0.95);
    case 'cloud':
      return hall(0.45, -1.15, 2.3);
    case 'sweat':
      return hall(0.3, -1.35, 1.5);
    case 'gym':
      return hall(TREADMILL.x, -1.0, 3.1);
    case 'balance':
      return hall(BALANCE.x, -1.95, 5.2);
    case 'left-pan':
      return hall(BALANCE.x - BALANCE.arm + 0.2, -1.25, 2.9);
    case 'right-pan':
      return hall(BALANCE.x + BALANCE.arm - 0.2, -1.6, 2.9);
    case 'beam':
      return hall(BALANCE.x, -2.1, 5.4);
    case 'sofa':
      return hall(SOFA.x, -0.95, 3.0);
    case 'plate':
      return hall(0.5, -1.15, 2.3);
    // Close on the front row of experts, turned round to face you (its ground is at 9.27).
    case 'doctor':
      return hall(-3.25, 7.7, 1.95);
    case 'dietitian':
      return hall(0, 7.7, 2.4);
    case 'trainer':
      return hall(3.9, 7.7, 2.3);
    case 'signs':
      return hall(0, 7.45, 3.0);
    case 'flex':
      return hall(3.25, 7.6, 1.9);
    case 'toilet-seat':
      return hall(0.6, -0.9, 2.4);
    default:
      return hall(0, -1.2, 3);
  }
}

/** The doors between the places: into you at your belly, out of you at your mouth. */
function doorOf(from: Place, to: Place): { a: Cam; b: Cam; colour: string; into: boolean } {
  return from === 'hall'
    ? {
        a: { x: BELLY_HALL.x, y: BELLY_HALL.y, w: 0.05 },
        b: { x: BELLY.x + 0.05, y: BELLY.y, w: 0.05 },
        colour: J.muscle,
        into: to === 'body',
      }
    : {
        a: { x: MOUTH_BODY.x + 0.02, y: MOUTH_BODY.y, w: 0.06 },
        b: { x: MOUTH_HALL.x + 0.05, y: MOUTH_HALL.y, w: 0.08 },
        colour: J.breathShade,
        into: false,
      };
}

/** How many frames the flight between two stops takes. */
export function bodyFlightFrames(from: JourneyStop, to: JourneyStop, fps: number): number {
  if (from === to) return 0;
  const a = stopOf(from, true);
  const b = stopOf(to, true);
  if (a.place !== b.place) return Math.round(fps * 2.0);
  return Math.round(fps * clamp(0.9 + 0.1 * zoomPath(a.cam, b.cam).S, 1.0, 2.2));
}

/** Where the mascot is while the camera is at a stop. */
const roomOf = (stop: string): Room =>
  stop === 'gym' ||
  stop === 'balance' ||
  stop === 'left-pan' ||
  stop === 'right-pan' ||
  stop === 'beam'
    ? 'gym'
    : stop === 'sofa'
      ? 'sofa'
      : 'bathroom';

/** The rush between places: into you a warm red with cells streaming past; out, white breath. */
function Rush({
  W,
  H,
  t,
  shown,
  colour,
  into,
}: {
  W: number;
  H: number;
  t: number;
  shown: number;
  colour: string;
  into: boolean;
}) {
  if (shown <= 0) return null;
  const p = Math.min(W, H) / 1080;
  const cx = W / 2;
  const cy = H * 0.45;
  return (
    <g opacity={shown}>
      <rect width={W} height={H} fill={into ? J.bodyMid : J.breath} />
      <rect width={W} height={H} fill={colour} opacity={into ? 0.55 : 0.35} />
      {Array.from({ length: 110 }, (_, i) => {
        const a = rnd(i, 7) * Math.PI * 2;
        const f = (t * 1.4 + rnd(i, 8)) % 1;
        const d = (into ? f : 1 - f) ** 1.2 * Math.hypot(W, H) * 0.65;
        const x = cx + Math.cos(a) * d;
        const y = cy + Math.sin(a) * d;
        const r = (30 + 70 * rnd(i, 9)) * p * (0.4 + f);
        return into ? (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx={r}
            ry={r * 0.6}
            fill={i % 3 ? J.cell : J.fat}
            opacity={0.75}
            transform={`rotate(${(a * 180) / Math.PI} ${x} ${y})`}
          />
        ) : (
          <circle key={i} cx={x} cy={y} r={r * 1.4} fill={J.clockFace} opacity={0.65} />
        );
      })}
    </g>
  );
}

/** The world `body` at one frame of a shot. */
export function BodyPicture({
  g,
  local,
  duration,
  times,
  clock,
  fps,
  width,
  height,
}: {
  g: Journey;
  local: number;
  duration: number;
  times: number[];
  clock: number;
  fps: number;
  width: number;
  height: number;
}) {
  const tall = width < height;
  const t = clock / fps;
  const from = g.from ?? g.at;
  const fly = g.fly === 'whole' ? Math.max(1, duration - 2) : bodyFlightFrames(from, g.at, fps);
  const a = stopOf(from, tall);
  const b = stopOf(g.at, tall);
  const raw = fly > 0 ? clamp(local / fly) : 1;
  // The camera never quite stops: once there, it keeps drifting slowly in.
  const drift = (c: Cam, held: number): Cam => ({
    ...c,
    x: c.x + c.w * 0.02 * held,
    w: c.w * (1 - 0.07 * held),
  });

  let place: Place;
  let cam: Cam;
  let rush = 0;
  let door = doorOf('hall', 'body');
  if (a.place === b.place) {
    place = b.place;
    cam = raw >= 1 ? b.cam : zoomPath(a.cam, b.cam).at(smooth(raw));
  } else {
    door = doorOf(a.place, b.place);
    if (raw < 0.5) {
      place = a.place;
      cam = zoomPath(a.cam, door.a).at(smooth(raw / 0.42));
      rush = smooth((raw - 0.18) / 0.24);
    } else {
      place = b.place;
      cam = zoomPath(door.b, b.cam).at(smooth((raw - 0.58) / 0.42));
      rush = 1 - smooth((raw - 0.58) / 0.22);
    }
  }
  // Then on to each stop named on a word, calmly (wordCamera).
  const moved = wordCamera({
    legs: g.show
      .map((x, i) => ({ to: x.cam, start: times[i] ?? 0 }))
      .filter((l): l is { to: JourneyStop; start: number } => !!l.to)
      .map((l) => ({ ...l, at: stopOf(l.to, tall) }))
      .filter((l) => l.at.place === place)
      .map((l) => ({ to: l.to, at: l.at.cam, start: l.start }))
      .sort((p, q) => p.start - q.start),
    flown: cam,
    arrived: b.cam,
    fly,
    local,
    duration,
    fps,
    drift,
  });
  cam = moved.cam;

  const atWord = new Map<JourneyThing, number>();
  g.show.forEach((x, i) => atWord.set(x.item, times[i] ?? 0));
  const thing = (name: JourneyThing, seconds = 0.35) =>
    g.keep.includes(name)
      ? 1
      : atWord.has(name)
        ? clamp((local - (atWord.get(name) ?? 0)) / (fps * seconds))
        : 0;
  const since = (name: JourneyThing) =>
    g.keep.includes(name) ? 1e9 : atWord.has(name) ? (local - (atWord.get(name) ?? 0)) / fps : -1e9;
  const room = roomOf(g.at);
  const was = roomOf(from);
  const s: State = {
    t,
    local,
    fps,
    W: width,
    H: height,
    thing,
    since,
    room,
    wasRoom: was !== room ? was : null,
    leave: clamp(local / (fps * 0.35)),
    stop: moved.stop ?? g.at,
  };

  const v = viewOf(cam, width, height);
  const world: ReactNode = place === 'hall' ? <Hall v={v} s={s} /> : <Inside v={v} s={s} />;

  // The callout: a number and a few words at the top, a dashed line down to its thing.
  const callout = (() => {
    const c = g.callout;
    const calloutAt = times[g.show.length];
    if (!c || calloutAt === undefined) return null;
    const pr = clamp((local - calloutAt) / 10);
    if (pr <= 0) return null;
    const anchor = ((): [number, number] | null => {
      const hall = place === 'hall';
      switch (c.at) {
        case 'lungs':
          return hall ? null : at(v, LUNGS.x, LUNGS.y - 0.16);
        case 'cloud':
          return hall ? at(v, 0.82, -1.95) : null;
        case 'sweat':
          return hall ? at(v, 0.14, HEAD_Y - 0.16) : null;
        case 'left-pan':
          return hall ? at(v, BALANCE.x - BALANCE.arm, BALANCE.pivot + BALANCE.hang - 0.7) : null;
        case 'right-pan':
          return hall ? at(v, BALANCE.x + BALANCE.arm, BALANCE.pivot + BALANCE.hang - 0.7) : null;
        case 'beam':
          return hall ? at(v, BALANCE.x, BALANCE.pivot - 0.2) : null;
        default:
          return null;
      }
    })();
    const u = Math.min(width, height) / 1080;
    const bx = width / 2;
    const by = height * (tall ? 0.15 : 0.2);
    const sc = (0.6 + 0.4 * outBack(pr)) * u;
    const caption = c.caption?.split(' / ') ?? [];
    const size = c.value.length > 7 ? 130 : 170;
    return (
      <g opacity={clamp(pr * 2.5)}>
        {anchor && anchor[1] > by + 150 * sc && (
          <line
            x1={bx}
            y1={by + (caption.length ? 100 : 40) * sc + caption.length * 50 * sc}
            x2={anchor[0]}
            y2={anchor[1]}
            stroke={J.range}
            strokeWidth={5 * u}
            strokeDasharray={`${14 * u} ${10 * u}`}
          />
        )}
        <g transform={`translate(${bx} ${by}) scale(${sc})`}>
          <text
            x={0}
            y={0}
            fontFamily={font}
            fontWeight={800}
            fontSize={size}
            fill={J.range}
            stroke={LINE.color}
            strokeWidth={12}
            paintOrder="stroke"
            textAnchor="middle"
          >
            {c.value}
          </text>
          {caption.map((line, i) => (
            <text
              key={i}
              x={0}
              y={70 + i * 52}
              fontFamily={font}
              fontWeight={800}
              fontSize={46}
              fill={J.clockFace}
              stroke={LINE.color}
              strokeWidth={9}
              paintOrder="stroke"
              textAnchor="middle"
            >
              {line}
            </text>
          ))}
        </g>
      </g>
    );
  })();

  return (
    <g>
      <defs>
        <radialGradient id="bw-vignette" cx="0.5" cy="0.45" r="0.78">
          <stop offset="0.6" stopColor={J.night} stopOpacity={0} />
          <stop offset="1" stopColor={J.night} stopOpacity={0.6} />
        </radialGradient>
        <filter id="bw-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves={2}
            seed={Math.floor(t * 12) % 8}
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.6  0 0 0 0 0.6  0 0 0 0 0.7  0 0 0 0.5 0"
          />
        </filter>
      </defs>
      {world}
      <Rush W={width} H={height} t={t} shown={rush} colour={door.colour} into={door.into} />
      <rect width={width} height={height} fill="url(#bw-vignette)" />
      <rect width={width} height={height} filter="url(#bw-grain)" opacity={0.08} />
      {callout}
    </g>
  );
}
