import { DEG, clamp, length, lerp, smoothstep, stops } from '../rig/math';
import type { Vec2 } from '../rig/math';
import { ink, lineWeights, tokens, tongue, white } from '../tokens';
import { CREASE_W, Crease, TaperedStroke, cubicPoints } from './crease';
import {
  BROW_GAP,
  BROW_LEN,
  BROW_OUT,
  CALM_MOUTH_W,
  EYE_H,
  EYE_W,
  EYE_Y,
  MOUTH_FIT_R,
  MOUTH_OPEN_SCALE,
  MOUTH_SCALE,
  MOUTH_Y,
  PUPIL_D,
  TURN,
  eyeSlots,
} from './layout';
import type { EyeSlot } from './layout';
import type { MouthForm } from './talk';
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
  /** Eyelid fill: the head's shadow tone, as in both references. */
  lidColor: string;
  /** The talking mouth shape of the moment (see talkAt). */
  talk: MouthForm;
  /** An elder's face: a few permanent creases whatever the expression. */
  aged?: boolean;
  idPrefix: string;
};

/**
 * Face feature lines are thinner than the head outline (Biku, Checkpoint 1; guide v5): the eyes
 * and mouth use the top of the inner-detail range, so the face reads finer than the silhouette.
 */
const FEATURE_LINE = tokens.face.featureLinePctOfHead;
/** Softer than the outline color, so faces read finer (guide v6). */
const FEATURE_INK = tokens.face.featureLineColor;
const eyeStroke = FEATURE_LINE;
const LID_PAD = 0.03;
/**
 * How far an open-mouthed face closes between sounds while it speaks, as a share of its full
 * opening. Not to zero: a shout never quite shuts.
 */
const OPEN_MOUTH_SHUT = 0.22;
/** How tall a fully open talking mouth is, in head widths. */
const TALK_OPEN = 0.14;
/** How far outside the eye outline the under-eye crease runs (measured on Reference B). */
const BAG_OFFSET = 0.034;

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
        stroke={FEATURE_INK}
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
        stroke={FEATURE_INK}
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

  // Lower lid. Plain, it is the cheek pushing up into a curve (a happy squint). Shaded, it is a
  // wince: nearly level, in the lid tone with a bold edge, and the pupil rests on it.
  const hasLower = eyes.lowerLid > 0.01;
  const wince = hasLower && eyes.lowerShaded;
  const padX = w / 2 + LID_PAD;
  const lowerTop = wince
    ? bottom - eyes.lowerLid * h + h * 0.06
    : bottom - eyes.lowerLid * h * 0.35;
  const lowerArc = wince ? h * 0.16 : eyes.lowerLid * h * 1.3;
  const lowerEdgeAt = (x: number) => {
    const t = clamp((x - (cx - padX)) / (2 * padX), 0, 1);
    return lowerTop - 2 * t * (1 - t) * lowerArc;
  };

  const r = (PUPIL_D / 2) * eyes.pupil;
  const dir = clampUnit({ x: eyes.lookX + look.x, y: eyes.lookY + look.y });
  const maxX = Math.max(0, w / 2 - r - 0.016);
  const maxY = Math.max(0, h / 2 - r - 0.016);
  // The pupil never slides under the near eye, which overlaps this one (Biku, 2026-10-04).
  const clearX = slot.coverX === undefined ? -Infinity : slot.coverX + r + eyeStroke;
  const px = Math.max(cx + dir.x * maxX, Math.min(cx, clearX));
  const freeY = cy + dir.y * maxY;
  const py = wince ? Math.min(freeY, lowerEdgeAt(px) - r * 0.8) : freeY;

  // The crease under the eye hugs its lower outer side, a little outside the outline.
  const [bagFrom, bagTo] = slot.side < 0 ? [66, 14] : [54, -2];
  const bag = Array.from({ length: 13 }, (_, i) => {
    const phi = lerp(bagFrom, bagTo, i / 12) * DEG;
    return {
      x: cx + slot.side * (w / 2 + BAG_OFFSET) * Math.sin(phi),
      y: cy + (h / 2 + BAG_OFFSET) * Math.cos(phi),
    };
  });

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
              stroke={FEATURE_INK}
              strokeWidth={eyeStroke * 1.3}
              strokeLinecap={tokens.line.cap}
            />
          </>
        )}
        {hasLower && (
          <>
            <path
              d={`M ${cx - padX} ${bottom + 0.1} L ${cx - padX} ${lowerTop} Q ${cx} ${lowerTop - lowerArc} ${cx + padX} ${lowerTop} L ${cx + padX} ${bottom + 0.1} Z`}
              fill={wince ? lidColor : skin}
            />
            <path
              d={`M ${cx - padX} ${lowerTop} Q ${cx} ${lowerTop - lowerArc} ${cx + padX} ${lowerTop}`}
              fill="none"
              stroke={FEATURE_INK}
              strokeWidth={wince ? eyeStroke * 1.3 : eyeStroke}
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
        stroke={FEATURE_INK}
        strokeWidth={eyeStroke}
      />
      {eyes.bags && (
        <TaperedStroke points={bag} width={CREASE_W} peak={slot.side < 0 ? 0.5 : 0.3} />
      )}
    </g>
  );
}

/**
 * Worry ticks: two small pen strokes between the brows, one short and full, one longer and
 * fine (Reference B). In profile they sit behind the brow instead.
 */
function WorryLines({ shift, eyeTop, turn }: { shift: number; eyeTop: number; turn: number }) {
  const back = clamp((turn - 0.5) * 2, 0, 1);
  const y = eyeTop - 0.1;
  const xa = shift + lerp(0.037, -0.13, back);
  const xb = shift + lerp(-0.035, -0.2, back);
  return (
    <g>
      <Crease
        from={{ x: xa, y: y - 0.025 }}
        ctrl={{ x: xa + 0.008, y }}
        to={{ x: xa + 0.002, y: y + 0.025 }}
        weight={1.1}
        peak={0.3}
      />
      <Crease
        from={{ x: xb - 0.003, y: y - 0.036 }}
        ctrl={{ x: xb + 0.033, y: y - 0.004 }}
        to={{ x: xb - 0.004, y: y + 0.037 }}
        weight={0.78}
        peak={0.45}
      />
    </g>
  );
}

/**
 * An elder's permanent lines: two long creases across the forehead and a fold running down
 * from beside the nose toward each mouth corner. Drawn under the brows and mouth.
 */
function AgeLines({ shift, eyeTop, turn }: { shift: number; eyeTop: number; turn: number }) {
  const w = 1 - 0.45 * turn;
  const y = eyeTop - 0.135;
  return (
    <g>
      <Crease
        from={{ x: shift - 0.17 * w, y: y + 0.012 }}
        ctrl={{ x: shift - 0.02, y: y - 0.03 }}
        to={{ x: shift + 0.15 * w, y: y + 0.006 }}
        weight={0.85}
        peak={0.4}
      />
      <Crease
        from={{ x: shift - 0.12 * w, y: y - 0.045 }}
        ctrl={{ x: shift + 0.01, y: y - 0.068 }}
        to={{ x: shift + 0.11 * w, y: y - 0.04 }}
        weight={0.65}
        peak={0.55}
      />
      {[-1, 1].map((side) => (
        <Crease
          key={side}
          from={{ x: shift + side * 0.1 * w, y: 0.1 }}
          ctrl={{ x: shift + side * 0.17 * w, y: 0.16 }}
          to={{ x: shift + side * 0.165 * w, y: 0.25 }}
          weight={side < 0 ? 0.9 : 0.7}
          peak={0.45}
        />
      ))}
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
      stroke={FEATURE_INK}
      strokeWidth={eyeStroke * 1.2}
      strokeLinecap={tokens.line.cap}
      strokeLinejoin={tokens.line.join}
    />
  );
}

/** Stress creases: two between the brows and two at each outer eye corner, none alike. */
function StrainLines({ slots, shift }: { slots: EyeSlot[]; shift: number }) {
  return (
    <g>
      {slots.length > 1 && (
        <>
          <Crease
            from={{ x: shift - 0.032, y: -0.375 }}
            ctrl={{ x: shift - 0.056, y: -0.33 }}
            to={{ x: shift - 0.036, y: -0.285 }}
            weight={1}
            peak={0.4}
          />
          <Crease
            from={{ x: shift + 0.038, y: -0.36 }}
            ctrl={{ x: shift + 0.054, y: -0.325 }}
            to={{ x: shift + 0.034, y: -0.295 }}
            weight={0.75}
            peak={0.55}
          />
        </>
      )}
      {slots.map((slot) => {
        const x0 = slot.x + slot.side * (EYE_W * slot.widthFactor * 0.5 + 0.025);
        const s = slot.side;
        return (
          <g key={s}>
            <Crease
              from={{ x: x0, y: EYE_Y - 0.035 }}
              ctrl={{ x: x0 + s * 0.03, y: EYE_Y - 0.052 }}
              to={{ x: x0 + s * 0.058, y: EYE_Y - 0.086 }}
              weight={0.95}
              peak={0.3}
            />
            <Crease
              from={{ x: x0 + s * 0.004, y: EYE_Y + 0.04 }}
              ctrl={{ x: x0 + s * 0.026, y: EYE_Y + 0.05 }}
              to={{ x: x0 + s * 0.044, y: EYE_Y + 0.074 }}
              weight={0.72}
              peak={0.35}
            />
          </g>
        );
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
function BrowShape({
  slot,
  b,
  eyeScale,
  stern,
}: {
  slot: EyeSlot;
  b: Brow;
  eyeScale: number;
  stern: boolean;
}) {
  // The brow over the far eye is much shorter than the eye is narrow, and sits right over it,
  // so it never pokes through the head outline (Reference B).
  const bw = BROW_LEN * slot.widthFactor ** 2.2;
  const cx = slot.x + slot.side * BROW_OUT * Math.max(0, 5 * slot.widthFactor - 4);
  // Stern almond eyes are small: their brows sit low and heavy right above them (the king).
  const y = stern
    ? EYE_Y + 0.03 - EYE_H * 0.2 - BROW_GAP - b.raise
    : EYE_Y - (EYE_H * eyeScale) / 2 - BROW_GAP - b.raise;
  const weight = stern ? Math.max(1, b.weight) : b.weight;
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
    const th = lineWeights.brow * weight * (0.85 - 0.7 * u + 0.25 * Math.sin(Math.PI * u));
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

/** Keeps a wide mouth inside the head: it is pushed back until its front corner fits. */
function fitInHead(x: number, y: number, w: number): { x: number; w: number } {
  const limit = Math.sqrt(Math.max(0.01, MOUTH_FIT_R * MOUTH_FIT_R - y * y));
  const width = Math.min(w, 2 * limit);
  return { x: clamp(x, -limit + width / 2, limit - width / 2), w: width };
}

function MouthShape({
  m,
  turn,
  talk,
  clipId,
}: {
  m: Mouth;
  turn: number;
  talk: MouthForm;
  clipId: string;
}) {
  const mx = stops(turn, TURN.mouthShift) + m.shiftX;
  const my = MOUTH_Y;
  // A frown eats into the opening, so a talking mouth opens that much more on a frowning face.
  const talkOpen = talk.open > 0 ? talk.open * TALK_OPEN + 0.57 * Math.max(0, -m.curve) : 0;
  // A face whose own mouth is open (shouting, laughing, wailing) keeps its shape while it
  // speaks, and that mouth closes and opens with the words (Biku, 2026-10-06: "when the wife
  // says keep the gold the mouth doesn't move").
  const speaksOpen = talk.speaking === true && m.open > 0;
  // Otherwise a talking shape takes over only when it opens the mouth more than the expression does.
  const talking = !speaksOpen && talkOpen > m.open * MOUTH_OPEN_SCALE;
  const turnW = MOUTH_SCALE * stops(turn, TURN.mouthWidth);
  // Narrowing takes a share of the mouth's own width; widening adds a share of a calm mouth's,
  // so an already wide mouth does not run off the face.
  const w = !talking
    ? m.width * turnW
    : talk.width < 1
      ? m.width * turnW * talk.width
      : (m.width + (talk.width - 1) * CALM_MOUTH_W) * turnW;
  const open = speaksOpen
    ? m.open * MOUTH_OPEN_SCALE * (OPEN_MOUTH_SHUT + (1 - OPEN_MOUTH_SHUT) * Math.min(1, talk.open))
    : Math.max(m.open * MOUTH_OPEN_SCALE, talkOpen);
  const round = m.round > 0.5 || (talking && talk.round);
  // How much of the opening the top teeth fill.
  const teethDepth = m.teeth === 'top' ? 0.32 : talking ? talk.teeth : 0;
  const sw = FEATURE_LINE * 1.1;
  const cornerY = my - m.curve;
  const left = { x: mx - w / 2, y: cornerY };
  const right = { x: mx + w / 2, y: cornerY - m.skew };
  const midY = (left.y + right.y) / 2;

  if (round) {
    const ry = Math.max(open * 0.55, 0.035);
    return (
      <g>
        <ellipse
          cx={mx}
          cy={my}
          rx={w / 2}
          ry={ry}
          fill={tokens.face.mouthInterior}
          stroke={FEATURE_INK}
          strokeWidth={sw}
        />
        {m.chin && <ChinLines mx={mx} y={my + ry + 0.05} />}
      </g>
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
    // Corner creases turn the same way as the mouth: down for a frown, up for a smile.
    const dy = (m.curve < 0 ? 1 : -1) * 0.04 * m.corners;
    const hook = (p: Vec2, side: -1 | 1, weight: number) => (
      <Crease
        from={{ x: p.x - side * 0.012, y: p.y - dy * 0.2 }}
        ctrl={{ x: p.x + side * 0.012, y: p.y }}
        to={{ x: p.x + side * 0.018, y: p.y + dy }}
        weight={weight}
        peak={0.35}
      />
    );
    return (
      <g>
        {/* A pen line: fullest in the middle and finer toward the corners. */}
        <TaperedStroke
          points={cubicPoints(left, c1, c2, right)}
          width={sw * 1.15}
          peak={0.5}
          tip={0.5}
        />
        {m.corners > 0.05 && (
          <>
            {hook(left, -1, 1.5)}
            {hook(right, 1, 1.25)}
          </>
        )}
        {m.lip && (
          <Crease
            from={{ x: mx - w * 0.2, y: my + 0.075 }}
            ctrl={{ x: mx, y: my + 0.1 }}
            to={{ x: mx + w * 0.2, y: my + 0.075 }}
            weight={1}
            peak={0.55}
          />
        )}
        {m.chin && <ChinLines mx={mx} y={my + 0.13} />}
      </g>
    );
  }

  if (m.teeth === 'gritted') {
    const gh = open * 0.62;
    // Low enough to leave a clear gap under the near eye.
    const cy = midY + gh * 0.31;
    const fit = fitInHead(mx, cy, w * 1.12);
    return (
      <g>
        <Grimace cx={fit.x} cy={cy} w={fit.w} h={gh} tilt={m.skew * 400} clipId={clipId} />
        {m.chin && <ChinLines mx={fit.x + fit.w * 0.117} y={cy + gh * 0.42} />}
      </g>
    );
  }
  const upperCtrl = midY + m.curve * 0.4 - open * 0.2 - m.arch;
  const lowerCtrl = midY + m.curve * 1.6 + open * 1.9;
  // A talking mouth is small, so its lower lip is a rounded U; an expression's is a wide bowl.
  const uY = midY + ((lowerCtrl - midY) * 2) / 3;
  const lowerLip = talking
    ? `C ${right.x - w * 0.08} ${uY} ${left.x + w * 0.08} ${uY} ${left.x} ${left.y}`
    : `Q ${mx} ${lowerCtrl} ${left.x} ${left.y}`;
  const d = `M ${left.x} ${left.y} Q ${mx} ${upperCtrl} ${right.x} ${right.y} ${lowerLip} Z`;
  const topEdge = midY + (upperCtrl - midY) / 2;
  const bottomEdge = midY + (lowerCtrl - midY) / 2;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={tokens.face.mouthInterior} />
      <g clipPath={`url(#${clipId})`}>
        {teethDepth > 0 && (
          <>
            <rect
              x={mx - w}
              y={topEdge - 0.2}
              width={w * 2}
              height={0.2 + (bottomEdge - topEdge) * teethDepth}
              fill={white}
            />
            <line
              x1={mx - w}
              x2={mx + w}
              y1={topEdge + (bottomEdge - topEdge) * teethDepth}
              y2={topEdge + (bottomEdge - topEdge) * teethDepth}
              stroke={FEATURE_INK}
              strokeWidth={CREASE_W}
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
      </g>
      <path
        d={d}
        fill="none"
        stroke={FEATURE_INK}
        strokeWidth={sw}
        strokeLinejoin={tokens.line.join}
      />
      {m.chin && <ChinLines mx={mx} y={bottomEdge + 0.05} />}
    </g>
  );
}

/**
 * Chin strokes: two short pen strokes fanned out under the lower lip, leaning back, the second
 * longer, finer and more slanted (Reference B's frightened figure). y is where they start.
 */
function ChinLines({ mx, y }: { mx: number; y: number }) {
  return (
    <g>
      <Crease
        from={{ x: mx + 0.028, y }}
        ctrl={{ x: mx + 0.024, y: y + 0.022 }}
        to={{ x: mx + 0.012, y: y + 0.042 }}
        weight={1}
        peak={0.35}
      />
      <Crease
        from={{ x: mx - 0.018, y: y - 0.003 }}
        ctrl={{ x: mx - 0.034, y: y + 0.024 }}
        to={{ x: mx - 0.056, y: y + 0.04 }}
        weight={0.7}
        peak={0.4}
      />
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
  aged = false,
  idPrefix,
}: FaceProps) => {
  const t = clamp(turn, 0, 1);
  const shift = stops(t, TURN.shift);
  const slots = eyeSlots(t);
  // The near (-x) eye is drawn last, so it overlaps the far eye, as on both figures in
  // Reference B. Its +x edge is where the far eye starts to show.
  const near = slots.find((s) => s.side === -1);
  const far = slots.find((s) => s.side === 1);
  if (near && far) {
    far.coverX = near.x + (EYE_W * near.widthFactor * params.eyes.scale) / 2;
  }
  const drawOrder = near && far ? [far, near] : slots;
  const stern = eyeStyle === 'stern' && !params.eyes.squeeze;
  const eyeTop = EYE_Y - (EYE_H * params.eyes.scale) / 2;

  const f = params.frame ?? { tilt: 0, scale: 1, dx: 0, dy: 0 };
  return (
    <g transform={`translate(${f.dx} ${f.dy}) rotate(${f.tilt}) scale(${f.scale})`}>
      {drawOrder.map((slot) =>
        stern ? (
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
          stern={stern}
        />
      ))}
      {aged && <AgeLines shift={shift} eyeTop={eyeTop} turn={t} />}
      {params.eyes.strain && <StrainLines slots={slots} shift={shift} />}
      {params.eyes.worry && <WorryLines shift={shift} eyeTop={eyeTop} turn={t} />}
      <MouthShape m={params.mouth} turn={t} talk={talk} clipId={`${idPrefix}-mouth`} />
    </g>
  );
};

/**
 * A gritted grimace measured from Reference B's frightened figure. The mouth is a wide bean
 * that arches like a frown: a round bulb at the front corner, a waist, and a taller back half.
 * Two rows of big uneven teeth run right up to the lips and meet on a bite line; black shows
 * only at the corners, a small bulb in front and a deep wedge at the back, where the lower row
 * runs on under it. +x is the front (the way the character faces).
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
  const X = (u: number) => (u * w) / 2;
  const ease = (a: number, b: number, x: number) => smoothstep(clamp((x - a) / (b - a), 0, 1));
  // Both lips, measured on the reference in units of the mouth height. The upper lip is a low
  // plateau over the front bulb that climbs to its highest point over the back half. The lower
  // lip hangs low at both ends and rises into a bump under the front teeth.
  const blunt = (u: number, power: number) => Math.sqrt(Math.max(0, 1 - Math.abs(u) ** power));
  const top = (u: number) => -h * blunt(u, u > 0 ? 8 : 3) * (0.5 + 0.36 * ease(0.45, -0.25, u));
  const bottom = (u: number) =>
    h * blunt(u, 8) * (0.43 - 0.29 * Math.exp(-(((u - 0.12) / 0.3) ** 2)));
  const bite = (u: number) => h * (-0.1635 + 0.15 * u - 0.087 * u * u + 0.012 * Math.sin(7 * u));

  const along = (f: (u: number) => number, from: number, to: number, n = 24) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const u = from + ((to - from) * i) / n;
      return `${X(u)} ${f(u)}`;
    });
  // The lips, sampled closely near the blunt ends.
  const lip = (f: (u: number) => number, dir: 1 | -1) =>
    Array.from({ length: 49 }, (_, i) => {
      const u = dir * Math.sin(((i / 48) * 2 - 1) * (Math.PI / 2));
      return `${X(u)} ${f(u)}`;
    });
  const outline = `M ${[...lip(top, 1), ...lip(bottom, -1)].join(' L ')} Z`;

  // Where the teeth start and stop: the rest is the dark of the mouth.
  const frontTop = 0.8;
  const frontBite = 0.75;
  const upperBack = -0.62;
  const lowerBack = -0.86;
  const lowerBackEdge = (u: number) =>
    lerp(
      bite(upperBack),
      bottom(lowerBack),
      clamp((upperBack - u) / (upperBack - lowerBack), 0, 1) ** 1.5,
    );
  const upperTeeth = `M ${[...along(top, frontTop, upperBack), ...along(bite, upperBack, frontBite)].join(' L ')} Z`;
  const lowerTeeth = `M ${[
    ...along(bite, frontBite, upperBack),
    ...along(lowerBackEdge, upperBack, lowerBack, 8),
    ...along(bottom, lowerBack, frontBite - 0.03),
  ].join(' L ')} Z`;
  // Gaps between teeth lean back toward the bottom, and no two teeth are the same width.
  const upperGaps: ReadonlyArray<readonly [number, number]> = [
    [0.572, 0.539],
    [0.234, 0.193],
    [-0.132, -0.2],
    [-0.437, -0.45],
  ];
  const lowerGaps: ReadonlyArray<readonly [number, number]> = [
    [0.545, 0.518],
    [0.207, 0.2],
    [-0.132, -0.186],
    [-0.47, -0.606],
  ];
  const gap = CREASE_W * 0.95;
  const back = X(-1);
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
          stroke={FEATURE_INK}
          fill="none"
          strokeLinecap={tokens.line.cap}
          strokeLinejoin={tokens.line.join}
        >
          <path
            d={`M ${along(bite, frontBite, upperBack).join(' L ')}`}
            strokeWidth={CREASE_W * 1.2}
          />
          {upperGaps.map(([a, b]) => (
            <path key={`u${a}`} d={`M ${X(a)} ${top(a)} L ${X(b)} ${bite(b)}`} strokeWidth={gap} />
          ))}
          {lowerGaps.map(([a, b]) => (
            <path
              key={`l${a}`}
              d={`M ${X(a)} ${bite(a)} L ${X(b)} ${bottom(b)}`}
              strokeWidth={gap}
            />
          ))}
        </g>
      </g>
      <path
        d={outline}
        fill="none"
        stroke={FEATURE_INK}
        strokeWidth={FEATURE_LINE * 1.05}
        strokeLinejoin={tokens.line.join}
      />
      {/* A cheek crease curving around the back corner, where the grimace pulls hardest. */}
      <Crease
        from={{ x: back - 0.026, y: -0.035 }}
        ctrl={{ x: back - 0.054, y: 0.022 }}
        to={{ x: back - 0.05, y: 0.05 }}
        weight={0.9}
        peak={0.65}
      />
    </g>
  );
}
