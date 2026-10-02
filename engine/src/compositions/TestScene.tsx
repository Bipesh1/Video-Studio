import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { MASK_HIDE, MASK_SHOW, mid, palette, tokens } from '../tokens';

export const TEST_SCENE_SECONDS = 5;

type Props = { seed: number };

/**
 * Phase 0 test scene. Not the rig: a simple Ink Stick flavoured smoke test used to prove
 * that tokens load, that SVG renders, and to measure render speed.
 * Background: dusk-violet "simple" treatment (flat sky gradient, moon, stars, ground band, no outlines).
 * Character: one tier 0 stick figure waving, drawn only from token values.
 */
export const TestScene = ({ seed }: Props) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const dusk = palette('dusk-violet');
  const skyTop = dusk[0] ?? tokens.line.color;
  const skyMid = dusk[1] ?? skyTop;
  const skyLow = dusk[2] ?? skyMid;
  const ground = dusk[3] ?? skyLow;
  const moon = tokens.background.moon;
  const ink = tokens.line.color;

  // Head size sets every line weight, as Style 3.2 requires.
  const standing = height * 0.42;
  const head = standing * tokens.proportions.headToHeight;
  const outline = head * mid(tokens.line.outlinePctOfHead);
  const limb = head * mid(tokens.line.limbPctOfHead);
  const brow = head * tokens.line.browPctOfHead;

  // Pose: a wave. Pose-to-pose snap in, then a gentle hold with life.
  const t = frame / fps;
  const snap = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: 'clamp' });
  const wave = Math.sin(t * 6) * 0.35 * snap;
  const bob = Math.sin(t * 2.2) * head * 0.02;
  const blink = frame % (3 * fps) < 3 ? 0.08 : 1;
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Character placement: key face in the upper half, caption area (bottom quarter) clear.
  const groundY = height * 0.72;
  const cx = width * 0.5;
  const headCy = groundY - standing + head / 2 + bob;
  const torsoTop = headCy + head / 2;
  const torsoLen = head * tokens.proportions.torsoHeads;
  const torsoBottom = torsoTop + torsoLen;
  const upperArm = head * tokens.proportions.upperArmHeads;
  const lowerArm = head * tokens.proportions.lowerArmHeads;
  const leg = head * tokens.proportions.legHeads;
  const hand = head * tokens.proportions.handHeads;
  const shoulderY = torsoTop + torsoLen * 0.15;

  // Right arm raised and waving (two joints), left arm relaxed.
  const rElbow = { x: cx + upperArm * 0.9, y: shoulderY - upperArm * 0.45 };
  const rHand = {
    x: rElbow.x + Math.cos(-1.2 + wave) * lowerArm,
    y: rElbow.y + Math.sin(-1.2 + wave) * lowerArm,
  };
  const lElbow = { x: cx - upperArm * 0.7, y: shoulderY + upperArm * 0.7 };
  const lHand = { x: lElbow.x - lowerArm * 0.2, y: lElbow.y + lowerArm * 0.95 };

  const stars = Array.from({ length: 18 }, (_, i) => ({
    x: random(`${seed}-sx-${i}`) * width,
    y: random(`${seed}-sy-${i}`) * height * 0.45,
    r: 2 + random(`${seed}-sr-${i}`) * 3,
    twinkle: 0.5 + 0.5 * Math.sin(t * 3 + random(`${seed}-st-${i}`) * 6.28),
  }));

  const eyeW = head * tokens.face.eyeWidthPctOfHead;
  const eyeH = eyeW * 1.25 * blink;
  const pupil = eyeW * tokens.face.pupilPctOfEye;
  const eyeY = headCy;
  const eyeGap = eyeW * 0.62;

  return (
    <AbsoluteFill style={{ backgroundColor: skyTop }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ opacity: fadeOut }}
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={skyTop} />
            <stop offset="0.55" stopColor={skyMid} />
            <stop offset="1" stopColor={skyLow} />
          </linearGradient>
          <clipPath id="headClip">
            <circle cx={cx} cy={headCy} r={head / 2 - outline / 2} />
          </clipPath>
          {/* Crescent: a full disc with a second disc cut out, so the sky gradient shows through. */}
          <mask id="moonMask">
            <rect width={width} height={height} fill={MASK_SHOW} />
            <circle
              cx={width * 0.2 + head * 0.22}
              cy={height * 0.14 - head * 0.12}
              r={head * 0.5}
              fill={MASK_HIDE}
            />
          </mask>
        </defs>

        {/* Background: no outlines anywhere */}
        <rect width={width} height={height} fill="url(#sky)" />
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={tokens.fill.head}
            opacity={0.3 + 0.6 * s.twinkle}
          />
        ))}
        <circle
          cx={width * 0.2}
          cy={height * 0.14}
          r={head * 0.55}
          fill={moon}
          mask="url(#moonMask)"
        />
        <rect x={0} y={groundY} width={width} height={height - groundY} fill={ground} />
        <path
          d={`M ${width * 0.12} ${groundY} q ${head * 0.1} ${-head * 0.25} ${head * 0.2} 0`}
          fill={ink}
          opacity={0.85}
        />
        <path
          d={`M ${width * 0.8} ${groundY} q ${head * 0.12} ${-head * 0.3} ${head * 0.24} 0`}
          fill={ink}
          opacity={0.85}
        />

        {/* Character: thick black outlines and limbs, round caps, flat fills */}
        <g
          stroke={ink}
          strokeLinecap={tokens.line.cap}
          strokeLinejoin={tokens.line.join}
          fill="none"
        >
          {/* back arm (left), legs, torso */}
          <polyline
            points={`${cx},${shoulderY} ${lElbow.x},${lElbow.y} ${lHand.x},${lHand.y}`}
            strokeWidth={limb}
          />
          <polyline
            points={`${cx},${torsoBottom} ${cx - head * 0.35},${torsoBottom + leg * 0.5} ${cx - head * 0.45},${groundY}`}
            strokeWidth={limb}
          />
          <polyline
            points={`${cx},${torsoBottom} ${cx + head * 0.3},${torsoBottom + leg * 0.5} ${cx + head * 0.4},${groundY}`}
            strokeWidth={limb}
          />
          <line x1={cx} y1={torsoTop} x2={cx} y2={torsoBottom} strokeWidth={limb} />
          {/* front arm (right, waving) */}
          <polyline
            points={`${cx},${shoulderY} ${rElbow.x},${rElbow.y} ${rHand.x},${rHand.y}`}
            strokeWidth={limb}
          />
        </g>
        {/* mitten hands, filled black, with a small thumb bump */}
        <circle cx={lHand.x} cy={lHand.y} r={hand / 2} fill={ink} />
        <circle cx={rHand.x} cy={rHand.y} r={hand / 2} fill={ink} />
        <circle cx={rHand.x + hand * 0.42} cy={rHand.y - hand * 0.1} r={hand * 0.22} fill={ink} />

        {/* head: flat fill, one hard shadow crescent on the side away from the upper-left light */}
        <circle
          cx={cx}
          cy={headCy}
          r={head / 2}
          fill={tokens.fill.head}
          stroke={ink}
          strokeWidth={outline}
        />
        <circle
          cx={cx + head * 0.18}
          cy={headCy + head * 0.12}
          r={head / 2}
          fill={tokens.fill.headShadow}
          clipPath="url(#headClip)"
        />
        <circle
          cx={cx - head * 0.05}
          cy={headCy - head * 0.02}
          r={head / 2}
          fill={tokens.fill.head}
          clipPath="url(#headClip)"
        />

        {/* face: big white eyes, pupils, heavy tapered brows, happy mouth */}
        {[-1, 1].map((side) => (
          <g key={side}>
            <ellipse
              cx={cx + side * eyeGap}
              cy={eyeY}
              rx={eyeW / 2}
              ry={Math.max(eyeH / 2, outline * 0.6)}
              fill={tokens.fill.head}
              stroke={ink}
              strokeWidth={outline * 0.8}
            />
            <circle
              cx={cx + side * eyeGap + pupil * 0.15}
              cy={eyeY + pupil * 0.1}
              r={(pupil / 2) * blink}
              fill={ink}
            />
            <path
              d={(() => {
                // Thick tapered wedge, arched up for "happy". Endpoints are shared so both ends taper.
                // Uses the open-eye height so brows do not move during a blink.
                const openH = eyeW * 1.25;
                const base = eyeY - openH * 0.85;
                const inner = cx + side * (eyeGap - eyeW * 0.6);
                const outer = cx + side * (eyeGap + eyeW * 0.6);
                const ctrl = cx + side * eyeGap;
                return `M ${inner} ${base} Q ${ctrl} ${base - openH * 0.35} ${outer} ${base + openH * 0.05} Q ${ctrl} ${base - openH * 0.35 - brow * 2} ${inner} ${base} Z`;
              })()}
              fill={ink}
            />
          </g>
        ))}
        <path
          d={`M ${cx - head * 0.2} ${headCy + head * 0.22} Q ${cx} ${headCy + head * 0.4} ${cx + head * 0.2} ${headCy + head * 0.22}`}
          stroke={ink}
          strokeWidth={outline * 0.9}
          strokeLinecap={tokens.line.cap}
          fill="none"
        />
      </svg>
    </AbsoluteFill>
  );
};
