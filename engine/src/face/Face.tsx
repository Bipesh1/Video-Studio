import { DEG, clamp, length, lerp, stops } from '../rig/math';
import type { Vec2 } from '../rig/math';
import { ink, lineWeights, tokens, tongue, white } from '../tokens';
import {
  BROW_GAP,
  BROW_LEN,
  BROW_OUT,
  EYE_H,
  EYE_W,
  EYE_Y,
  MOUTH_OPEN_SCALE,
  MOUTH_SCALE,
  MOUTH_Y,
  PUPIL_D,
  TURN,
} from './layout';
import type { Brow, EyeStyle, Eyes, FaceParams, Mouth } from './types';

type FaceProps = {
  params: FaceParams;
  /** 0 front, 0.5 three-quarter, 1 profile, toward +x. */
  turn: number;
  /** Blink closure, 0 to 1. */
  blink: number;
  /** Extra look direction, unit-ish vector in head space. */
  look: Vec2;
  eyeStyle: EyeStyle;
  /** Head fill, used for the lower lid (a happy squint pushes the cheek up). */
  skin: string;
  /** Upper eyelid fill: the head's shadow tone, as in both references. */
  lidColor: string;
  /** Talking openness override, 0 to 1. */
  talk: number;
  idPrefix: string;
};

const eyeStroke = lineWeights.outline * 0.85;
const LID_PAD = 0.03;

type EyeSlot = { side: -1 | 1; x: number; widthFactor: number };

function clampUnit(v: Vec2): Vec2 {
  const l = length(v);
  return l > 1 ? { x: v.x / l, y: v.y / l } : v;
}

const pts = (list: readonly Vec2[]) => list.map((p) => `${p.x} ${p.y}`).join(' L ');

function RoundEye({
  slot,
  eyes,
  blink,
  look,
  skin,
  lidColor,
  clipId,
}: {
  slot: EyeSlot;
  eyes: Eyes;
  blink: number;
  look: Vec2;
  skin: string;
  lidColor: string;
  clipId: string;
}) {
  const w = EYE_W * slot.widthFactor * eyes.scale;
  const h = EYE_H * eyes.scale;
  const cx = slot.x;
  const cy = EYE_Y;
  const top = cy - h / 2;
  const bottom = cy + h / 2;
  const lid = eyes.upperLid + (1 - eyes.upperLid) * blink;

  if (eyes.squeeze) return <SqueezedEye slot={slot} />;
  if (eyes.closedArc) {
    return (
      <path
        d={`M ${cx - w * 0.42} ${cy + h * 0.1} Q ${cx} ${cy - h * 0.42} ${cx + w * 0.42} ${cy + h * 0.1}`}
        fill="none"
        stroke={ink}
        strokeWidth={eyeStroke * 1.1}
        strokeLinecap={tokens.line.cap}
      />
    );
  }
  if (lid > 0.9) {
    const y = top + h * 0.62;
    return (
      <path
        d={`M ${cx - w * 0.46} ${y} Q ${cx} ${y + h * 0.16} ${cx + w * 0.46} ${y}`}
        fill="none"
        stroke={ink}
        strokeWidth={eyeStroke}
        strokeLinecap={tokens.line.cap}
      />
    );
  }

  // Upper lid line. The inner corner is the one nearer the face center (-side direction).
  const tiltOffset = Math.tan(eyes.lidTilt * DEG) * (w / 2 + LID_PAD);
  const lidY = top + lid * h;
  const innerX = cx - slot.side * (w / 2 + LID_PAD);
  const outerX = cx + slot.side * (w / 2 + LID_PAD);
  const innerY = lidY + tiltOffset;
  const outerY = lidY - tiltOffset;
  // The lid edge arches with the eye, so heavy lids look like lids, not a ruler line.
  const lidArc = h * 0.16 * (1 - Math.abs(lid - 0.5));
  const lidCurve = `Q ${cx} ${lidY - lidArc} `;

  const r = (PUPIL_D / 2) * eyes.pupil;
  const dir = clampUnit({ x: eyes.lookX + look.x, y: eyes.lookY + look.y });
  const maxX = Math.max(0, w / 2 - r - 0.016);
  const maxY = Math.max(0, h / 2 - r - 0.016);
  const px = cx + dir.x * maxX;
  const py = cy + dir.y * maxY;

  // The lower lid pushes up into a curve, like a happy squint.
  const lowerTop = bottom - eyes.lowerLid * h * 0.35;
  const lowerArc = eyes.lowerLid * h * 1.3;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} />
        </clipPath>
      </defs>
      <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={white} />
      <g clipPath={`url(#${clipId})`}>
        <circle cx={px} cy={py} r={r} fill={ink} />
        {lid > 0.01 && (
          <>
            <path
              d={`M ${innerX} ${top - 0.1} L ${outerX} ${top - 0.1} L ${outerX} ${outerY} ${lidCurve}${innerX} ${innerY} Z`}
              fill={lidColor}
            />
            <path
              d={`M ${innerX} ${innerY} ${lidCurve}${outerX} ${outerY}`}
              fill="none"
              stroke={ink}
              strokeWidth={eyeStroke * 1.15}
              strokeLinecap={tokens.line.cap}
            />
          </>
        )}
        {eyes.lowerLid > 0.01 && (
          <>
            <path
              d={`M ${cx - w / 2 - LID_PAD} ${bottom + 0.1} L ${cx - w / 2 - LID_PAD} ${lowerTop} Q ${cx} ${lowerTop - lowerArc} ${cx + w / 2 + LID_PAD} ${lowerTop} L ${cx + w / 2 + LID_PAD} ${bottom + 0.1} Z`}
              fill={skin}
            />
            <path
              d={`M ${cx - w / 2 - LID_PAD} ${lowerTop} Q ${cx} ${lowerTop - lowerArc} ${cx + w / 2 + LID_PAD} ${lowerTop}`}
              fill="none"
              stroke={ink}
              strokeWidth={eyeStroke}
            />
          </>
        )}
      </g>
      <ellipse
        cx={cx}
        cy={cy}
        rx={w / 2}
        ry={h / 2}
        fill="none"
        stroke={ink}
        strokeWidth={eyeStroke}
      />
      {eyes.bags && (
        <path
          d={`M ${cx - w * 0.36} ${bottom + 0.03} Q ${cx} ${bottom + 0.075} ${cx + w * 0.36} ${bottom + 0.03}`}
          fill="none"
          stroke={ink}
          strokeWidth={lineWeights.detail}
          strokeLinecap={tokens.line.cap}
        />
      )}
    </g>
  );
}

/** Worry lines: two short arcs across the forehead, above the brows (Reference B). */
function WorryLines({ shift }: { shift: number }) {
  return (
    <g fill="none" stroke={ink} strokeWidth={lineWeights.detail} strokeLinecap={tokens.line.cap}>
      <path d={`M ${shift - 0.27} -0.4 Q ${shift - 0.31} -0.44 ${shift - 0.28} -0.48`} />
      <path d={`M ${shift - 0.2} -0.42 Q ${shift - 0.235} -0.455 ${shift - 0.21} -0.5`} />
    </g>
  );
}

/** Eyes squeezed shut: a > for the left eye and a < for the right, pointing at the nose. */
function SqueezedEye({ slot }: { slot: EyeSlot }) {
  const w = EYE_W * slot.widthFactor * 0.8;
  const h = EYE_H * 0.55;
  const cx = slot.x;
  const cy = EYE_Y + 0.01;
  const outer = cx + slot.side * w * 0.45;
  const inner = cx - slot.side * w * 0.4;
  return (
    <path
      d={`M ${outer} ${cy - h / 2} L ${inner} ${cy} L ${outer} ${cy + h / 2}`}
      fill="none"
      stroke={ink}
      strokeWidth={eyeStroke * 1.2}
      strokeLinecap={tokens.line.cap}
      strokeLinejoin={tokens.line.join}
    />
  );
}

/** Stress lines: two creases between the brows and two at each outer eye corner. */
function StrainLines({ slots, shift }: { slots: EyeSlot[]; shift: number }) {
  const line = (d: string, key: string) => (
    <path
      key={key}
      d={d}
      fill="none"
      stroke={ink}
      strokeWidth={lineWeights.detail}
      strokeLinecap={tokens.line.cap}
    />
  );
  return (
    <g>
      {slots.length > 1 &&
        [-1, 1].map((s) =>
          line(
            `M ${shift + s * 0.035} -0.37 Q ${shift + s * 0.055} -0.33 ${shift + s * 0.035} -0.29`,
            `f${s}`,
          ),
        )}
      {slots.map((slot) => {
        const x0 = slot.x + slot.side * (EYE_W * slot.widthFactor * 0.5 + 0.025);
        const x1 = x0 + slot.side * 0.05;
        return [
          line(`M ${x0} ${EYE_Y - 0.04} L ${x1} ${EYE_Y - 0.08}`, `a${slot.side}`),
          line(`M ${x0} ${EYE_Y + 0.04} L ${x1} ${EYE_Y + 0.08}`, `b${slot.side}`),
        ];
      })}
    </g>
  );
}

/** Stern eyes (from the king): black almonds slanting down toward the face center. */
function SternEye({ slot, eyes, blink }: { slot: EyeSlot; eyes: Eyes; blink: number }) {
  const w = EYE_W * slot.widthFactor * 0.72;
  const open = (1 - blink * 0.92) * (1 - eyes.upperLid * 0.35);
  const hh = EYE_H * 0.34 * open;
  const cx = slot.x;
  const cy = EYE_Y + 0.03;
  const angle = -slot.side * (14 + Math.max(0, eyes.lidTilt) * 0.4);
  return (
    <g transform={`rotate(${angle} ${cx} ${cy})`}>
      <path
        d={`M ${cx - w / 2} ${cy} Q ${cx} ${cy - hh * 1.15} ${cx + w / 2} ${cy} Q ${cx} ${cy + hh * 0.85} ${cx - w / 2} ${cy} Z`}
        fill={ink}
        stroke={ink}
        strokeWidth={0.012}
        strokeLinejoin={tokens.line.join}
      />
      {open > 0.4 && (
        <circle cx={cx - slot.side * w * 0.12} cy={cy - hh * 0.2} r={0.014} fill={white} />
      )}
    </g>
  );
}

/** A thick tapered wedge, heavier at the inner end, with an optional curled tip (Style 3.6). */
function BrowShape({ slot, b, eyeScale }: { slot: EyeSlot; b: Brow; eyeScale: number }) {
  const bw = BROW_LEN * slot.widthFactor;
  const cx = slot.x + slot.side * BROW_OUT * slot.widthFactor;
  const y = EYE_Y - (EYE_H * eyeScale) / 2 - BROW_GAP - b.raise;
  const innerX = cx - slot.side * (bw / 2);
  const outerX = cx + slot.side * (bw / 2);
  const n = 14;
  const upper: Vec2[] = [];
  const lower: Vec2[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = lerp(innerX, outerX, u);
    const by =
      y -
      b.arch * 0.07 * 4 * u * (1 - u) -
      b.wave * 0.014 * Math.sin(3 * Math.PI * u) -
      b.curl * 0.06 * u * u * u;
    // Heavy at the inner end, tapering to a fine tip (the hooked brows in Reference B).
    const th = lineWeights.brow * (0.85 - 0.7 * u + 0.25 * Math.sin(Math.PI * u));
    upper.push({ x, y: by - th / 2 });
    lower.push({ x, y: by + th / 2 });
  }
  const outline = [...upper, ...lower.reverse()];
  return (
    <path
      d={`M ${pts(outline)} Z`}
      transform={`rotate(${-slot.side * b.tilt} ${cx} ${y})`}
      fill={ink}
      stroke={ink}
      strokeWidth={0.012}
      strokeLinejoin={tokens.line.join}
    />
  );
}

function MouthShape({
  m,
  turn,
  talk,
  clipId,
}: {
  m: Mouth;
  turn: number;
  talk: number;
  clipId: string;
}) {
  const mx = stops(turn, TURN.mouthShift) + m.shiftX;
  const my = MOUTH_Y;
  const w = m.width * MOUTH_SCALE * stops(turn, TURN.mouthWidth);
  const open = Math.max(m.open * MOUTH_OPEN_SCALE, talk * 0.14);
  const sw = lineWeights.outline * 0.9;
  const cornerY = my - m.curve;
  const left = { x: mx - w / 2, y: cornerY };
  const right = { x: mx + w / 2, y: cornerY - m.skew };
  const midY = (left.y + right.y) / 2;

  if (m.round > 0.5) {
    const ry = Math.max(open * 0.55, 0.035);
    return (
      <ellipse
        cx={mx}
        cy={my}
        rx={w / 2}
        ry={ry}
        fill={tokens.face.mouthInterior}
        stroke={ink}
        strokeWidth={sw}
      />
    );
  }
  if (open < 0.02) {
    // The quadratic curve as a cubic, so a wobble can push its two halves apart.
    const q = { x: mx, y: my + m.curve };
    const c1 = {
      x: left.x + ((q.x - left.x) * 2) / 3,
      y: left.y + ((q.y - left.y) * 2) / 3 + m.wobble * 0.03,
    };
    const c2 = {
      x: right.x + ((q.x - right.x) * 2) / 3,
      y: right.y + ((q.y - right.y) * 2) / 3 - m.wobble * 0.03,
    };
    // Corner hooks turn the same way as the mouth: down for a frown, up for a smile.
    const hook = (p: { x: number; y: number }, side: -1 | 1) => {
      const dy = (m.curve < 0 ? 1 : -1) * 0.04 * m.corners;
      return `M ${p.x - side * 0.012} ${p.y - dy * 0.2} Q ${p.x + side * 0.012} ${p.y} ${p.x + side * 0.018} ${p.y + dy}`;
    };
    return (
      <g fill="none" stroke={ink} strokeLinecap={tokens.line.cap} strokeLinejoin={tokens.line.join}>
        <path
          d={`M ${left.x} ${left.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${right.x} ${right.y}`}
          strokeWidth={sw}
        />
        {m.corners > 0.05 && (
          <>
            <path d={hook(left, -1)} strokeWidth={sw * 0.85} />
            <path d={hook(right, 1)} strokeWidth={sw * 0.85} />
          </>
        )}
        {m.lip && (
          <path
            d={`M ${mx - w * 0.2} ${my + 0.075} Q ${mx} ${my + 0.095} ${mx + w * 0.2} ${my + 0.075}`}
            strokeWidth={lineWeights.detail}
          />
        )}
        {m.chin && <ChinLines mx={mx} y={my + 0.13} />}
      </g>
    );
  }

  const gritted = m.teeth === 'gritted';
  if (gritted) {
    // About twice as wide as tall, low on the face, like Reference B.
    const gh = open * 0.62;
    return (
      <g>
        <Grimace cx={mx} cy={midY} w={w * 1.12} h={gh} tilt={m.skew * 400} clipId={clipId} />
        {m.chin && <ChinLines mx={mx} y={midY + gh * 0.62} />}
      </g>
    );
  }
  const upperCtrl = gritted ? midY - open * 0.5 : midY + m.curve * 0.4 - open * 0.2 - m.arch;
  const lowerCtrl = gritted ? midY + open * 0.9 : midY + m.curve * 1.6 + open * 1.9;
  // A gritted grimace is a wide, uneven box with rounded corners (Reference B), not a lens.
  const gTop = midY - open * 0.48;
  const gBot = midY + open * 0.52;
  const d = gritted
    ? `M ${left.x} ${left.y} C ${left.x + w * 0.02} ${gTop} ${right.x - w * 0.12} ${gTop + open * 0.06} ${right.x} ${right.y} C ${right.x - w * 0.02} ${gBot} ${left.x + w * 0.12} ${gBot - open * 0.05} ${left.x} ${left.y} Z`
    : `M ${left.x} ${left.y} Q ${mx} ${upperCtrl} ${right.x} ${right.y} Q ${mx} ${lowerCtrl} ${left.x} ${left.y} Z`;
  const topEdge = midY + (upperCtrl - midY) / 2;
  const bottomEdge = midY + (lowerCtrl - midY) / 2;
  // Teeth lines use the thin end of the detail range so a small mouth stays readable.
  const detail = tokens.line.detailPctOfHead[0];

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={tokens.face.mouthInterior} />
      <g clipPath={`url(#${clipId})`}>
        {m.teeth === 'top' && (
          <>
            <rect
              x={mx - w}
              y={topEdge - 0.2}
              width={w * 2}
              height={0.2 + (bottomEdge - topEdge) * 0.32}
              fill={white}
            />
            <line
              x1={mx - w}
              x2={mx + w}
              y1={topEdge + (bottomEdge - topEdge) * 0.32}
              y2={topEdge + (bottomEdge - topEdge) * 0.32}
              stroke={ink}
              strokeWidth={detail}
            />
          </>
        )}
        {m.tongue > 0.05 && (
          <ellipse
            cx={mx}
            cy={bottomEdge - (bottomEdge - topEdge) * 0.08}
            rx={w * 0.3 * m.tongue}
            ry={(bottomEdge - topEdge) * 0.38 * m.tongue}
            fill={tongue}
          />
        )}
        {gritted && (
          <g>
            {/* Teeth inset from the lips, so dark gaps show at the corners. */}
            <path
              d={d}
              transform={`translate(${mx} ${midY}) scale(0.8 0.8) translate(${-mx} ${-midY})`}
              fill={white}
            />
            <g stroke={ink} strokeWidth={detail} fill="none" strokeLinecap={tokens.line.cap}>
              <path
                d={`M ${mx - w * 0.42} ${midY} Q ${mx - w * 0.2} ${midY + open * 0.07} ${mx} ${midY} T ${mx + w * 0.42} ${midY}`}
              />
              {[-2, -1, 0, 1, 2].map((k) => (
                <path
                  key={`u${k}`}
                  d={`M ${mx + (k * w) / 6} ${gTop - 0.05} L ${mx + (k * w) / 6} ${midY}`}
                />
              ))}
              {[-1.5, -0.5, 0.5, 1.5].map((k) => (
                <path
                  key={`l${k}`}
                  d={`M ${mx + (k * w) / 6} ${midY} L ${mx + (k * w) / 6} ${gBot + 0.05}`}
                />
              ))}
            </g>
          </g>
        )}
      </g>
      <path d={d} fill="none" stroke={ink} strokeWidth={sw} strokeLinejoin={tokens.line.join} />
      {m.chin && <ChinLines mx={mx} y={Math.max(gBot, bottomEdge) + 0.05} />}
    </g>
  );
}

/** Two short slanted strain strokes on the chin (Reference B's frightened figure). */
function ChinLines({ mx, y }: { mx: number; y: number }) {
  return (
    <g fill="none" stroke={ink} strokeWidth={lineWeights.detail} strokeLinecap={tokens.line.cap}>
      <path d={`M ${mx - 0.035} ${y} L ${mx - 0.018} ${y + 0.04}`} />
      <path d={`M ${mx + 0.01} ${y - 0.005} L ${mx + 0.032} ${y + 0.032}`} />
    </g>
  );
}

/** All face features, drawn in head space (origin at the head center, radius 0.5). */
export const Face = ({
  params,
  turn,
  blink,
  look,
  eyeStyle,
  skin,
  lidColor,
  talk,
  idPrefix,
}: FaceProps) => {
  const t = clamp(turn, 0, 1);
  const shift = stops(t, TURN.shift);
  const half = stops(t, TURN.halfSpacing);
  const slots: EyeSlot[] = (
    [
      { side: -1, x: shift - half, widthFactor: stops(t, TURN.leftEyeWidth) },
      { side: 1, x: shift + half, widthFactor: stops(t, TURN.rightEyeWidth) },
    ] as const
  ).filter((s) => s.widthFactor > 0.15);

  return (
    <g>
      {slots.map((slot) =>
        eyeStyle === 'stern' && !params.eyes.squeeze ? (
          <SternEye key={slot.side} slot={slot} eyes={params.eyes} blink={blink} />
        ) : (
          <RoundEye
            key={slot.side}
            slot={slot}
            eyes={params.eyes}
            blink={blink}
            look={look}
            skin={skin}
            lidColor={lidColor}
            clipId={`${idPrefix}-eye${slot.side}`}
          />
        ),
      )}
      {slots.map((slot) => (
        <BrowShape
          key={slot.side}
          slot={slot}
          b={slot.side < 0 ? params.browLeft : params.browRight}
          eyeScale={params.eyes.scale}
        />
      ))}
      {params.eyes.strain && <StrainLines slots={slots} shift={shift} />}
      {params.eyes.worry && <WorryLines shift={shift} />}
      <MouthShape m={params.mouth} turn={t} talk={talk} clipId={`${idPrefix}-mouth`} />
    </g>
  );
};

/**
 * A gritted grimace drawn like Reference B's frightened figure: the upper lip arches high and
 * rises toward one side, the lower lip is flatter, the whole mouth tilts. Inside, two rows of
 * separate teeth (bigger at the front, smaller toward the corners) meet on a wavy bite line,
 * with slanted gaps between teeth and deep black gaps at both corners.
 */
function Grimace({
  cx,
  cy,
  w,
  h,
  tilt,
  clipId,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  tilt: number;
  clipId: string;
}) {
  const N = 28;
  const X = (u: number) => (u * w) / 2;
  // Edge heights across the mouth, u from -1 (left corner) to 1 (right corner).
  const top = (u: number) => -h * 0.5 * Math.pow(Math.max(0, 1 - u * u), 0.62) * (1 + 0.25 * u);
  const bottom = (u: number) => h * 0.42 * Math.pow(Math.max(0, 1 - u * u), 0.5) * (1 - 0.12 * u);
  const teethTop = (u: number) => top(u) * 0.8 + h * 0.03;
  const teethBottom = (u: number) => bottom(u) * 0.78 - h * 0.02;
  const bite = (u: number) => h * (0.03 + 0.045 * Math.sin(3.2 * Math.PI * u + 0.6)) * (1 - u * u);
  const along = (f: (u: number) => number, from: number, to: number) =>
    Array.from({ length: N + 1 }, (_, i) => {
      const u = from + ((to - from) * i) / N;
      return `${X(u)} ${f(u)}`;
    });
  const outline = `M ${[...along(top, -1, 1), ...along(bottom, 1, -1)].join(' L ')} Z`;
  // Teeth stop short of the corners, leaving black gaps there.
  const u0 = -0.8;
  const u1 = 0.82;
  const upperTeeth = `M ${[...along(teethTop, u0, u1), ...along(bite, u1, u0)].join(' L ')} Z`;
  const lowerTeeth = `M ${[...along(bite, u0, u1), ...along(teethBottom, u1, u0)].join(' L ')} Z`;
  const upperGaps = [-0.56, -0.29, 0, 0.3, 0.58];
  const lowerGaps = [-0.44, -0.15, 0.15, 0.45];
  const gap = lineWeights.detail * 1.25;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${tilt})`}>
      <defs>
        <clipPath id={clipId}>
          <path d={outline} />
        </clipPath>
      </defs>
      <path d={outline} fill={tokens.face.mouthInterior} />
      <g clipPath={`url(#${clipId})`}>
        <path d={upperTeeth} fill={white} />
        <path d={lowerTeeth} fill={white} />
        <g
          stroke={ink}
          fill="none"
          strokeLinecap={tokens.line.cap}
          strokeLinejoin={tokens.line.join}
        >
          <path d={`M ${along(bite, u0, u1).join(' L ')}`} strokeWidth={gap * 1.15} />
          {upperGaps.map((u) => (
            <path
              key={`u${u}`}
              d={`M ${X(u)} ${teethTop(u) - 0.02} L ${X(u * 0.9)} ${bite(u * 0.9)}`}
              strokeWidth={gap}
            />
          ))}
          {lowerGaps.map((u) => (
            <path
              key={`l${u}`}
              d={`M ${X(u)} ${bite(u)} L ${X(u * 1.06)} ${teethBottom(u * 1.06) + 0.02}`}
              strokeWidth={gap}
            />
          ))}
        </g>
      </g>
      <path
        d={outline}
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.outline}
        strokeLinejoin={tokens.line.join}
      />
    </g>
  );
}
