import { DEG, clamp, length, lerp, stops } from '../rig/math';
import type { Vec2 } from '../rig/math';
import { ink, lineWeights, tokens, tongue, white } from '../tokens';
import { BROW_GAP, BROW_LEN, EYE_H, EYE_W, EYE_Y, MOUTH_Y, PUPIL_D, TURN } from './layout';
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
  /** Head fill, used for eyelids. */
  skin: string;
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
  clipId,
}: {
  slot: EyeSlot;
  eyes: Eyes;
  blink: number;
  look: Vec2;
  skin: string;
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
              d={`M ${pts([
                { x: innerX, y: top - 0.1 },
                { x: outerX, y: top - 0.1 },
                { x: outerX, y: outerY },
                { x: innerX, y: innerY },
              ])} Z`}
              fill={skin}
            />
            <path
              d={`M ${innerX} ${innerY} L ${outerX} ${outerY}`}
              stroke={ink}
              strokeWidth={eyeStroke}
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
    </g>
  );
}

/** Eyes squeezed shut: a > for the left eye and a < for the right, pointing at the nose. */
function SqueezedEye({ slot }: { slot: EyeSlot }) {
  const w = EYE_W * slot.widthFactor;
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
  const w = EYE_W * slot.widthFactor * 0.95;
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

/** A thick tapered wedge, heavier at the inner end (Style 3.6). */
function BrowShape({ slot, b, eyeScale }: { slot: EyeSlot; b: Brow; eyeScale: number }) {
  const bw = BROW_LEN * slot.widthFactor;
  const cx = slot.x;
  const y = EYE_Y - (EYE_H * eyeScale) / 2 - BROW_GAP - b.raise;
  const innerX = cx - slot.side * (bw / 2);
  const outerX = cx + slot.side * (bw / 2);
  const n = 14;
  const upper: Vec2[] = [];
  const lower: Vec2[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = lerp(innerX, outerX, u);
    const by = y - b.arch * 0.07 * 4 * u * (1 - u) - b.wave * 0.014 * Math.sin(3 * Math.PI * u);
    const th = lineWeights.brow * (0.8 - 0.45 * u + 0.35 * Math.sin(Math.PI * u));
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
  const w = m.width * stops(turn, TURN.mouthWidth);
  const open = Math.max(m.open, talk * 0.12);
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
    return (
      <path
        d={`M ${left.x} ${left.y} Q ${mx} ${my + m.curve} ${right.x} ${right.y}`}
        fill="none"
        stroke={ink}
        strokeWidth={sw}
        strokeLinecap={tokens.line.cap}
      />
    );
  }

  const gritted = m.teeth === 'gritted';
  const upperCtrl = gritted ? midY - open * 0.5 : midY + m.curve * 0.4 - open * 0.2 - m.arch;
  const lowerCtrl = gritted ? midY + open * 0.9 : midY + m.curve * 1.6 + open * 1.9;
  const d = `M ${left.x} ${left.y} Q ${mx} ${upperCtrl} ${right.x} ${right.y} Q ${mx} ${lowerCtrl} ${left.x} ${left.y} Z`;
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
          <>
            <rect x={mx - w} y={topEdge - 0.2} width={w * 2} height={0.6} fill={white} />
            <line
              x1={mx - w}
              x2={mx + w}
              y1={(topEdge + bottomEdge) / 2}
              y2={(topEdge + bottomEdge) / 2}
              stroke={ink}
              strokeWidth={detail}
            />
            {[-1, 0, 1].map((k) => (
              <line
                key={k}
                x1={mx + (k * w) / 4.5}
                x2={mx + (k * w) / 4.5}
                y1={topEdge - 0.1}
                y2={bottomEdge + 0.1}
                stroke={ink}
                strokeWidth={detail}
              />
            ))}
          </>
        )}
      </g>
      <path d={d} fill="none" stroke={ink} strokeWidth={sw} strokeLinejoin={tokens.line.join} />
    </g>
  );
}

/** All face features, drawn in head space (origin at the head center, radius 0.5). */
export const Face = ({ params, turn, blink, look, eyeStyle, skin, talk, idPrefix }: FaceProps) => {
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
      <MouthShape m={params.mouth} turn={t} talk={talk} clipId={`${idPrefix}-mouth`} />
    </g>
  );
};
