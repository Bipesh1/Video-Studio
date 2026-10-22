import fineTokens from '../../../styles/fine-print/tokens.json';

/**
 * A black hole drawn at the What's the Catch? drawing bar (the look test of 2026-10-21, Biku: "the
 * black hole is better"): the far side of its glowing disk of gas bent up over the top by its
 * gravity, the hole, a thin ring of light round it, the near side of the disk in front, the side
 * turning toward us brighter, the gas swirling; and dust spiralling in. Drawn round (cx, cy) with
 * the hole's radius R, in pixels; `u` is a pixel of a 1080 picture.
 */

const J = fineTokens.journey;
const rnd = (i: number, j = 0) => {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * The black hole: the far side of its disk bent up over the top by its gravity, the hole, a thin
 * ring of light round it, and the near side of the disk passing in front, the side turning
 * toward us brighter. The gas swirls round.
 */
export function BlackHoleGlow({
  cx,
  cy,
  R,
  t,
  u,
  uid = 'ct',
}: {
  cx: number;
  cy: number;
  R: number;
  t: number;
  u: number;
  uid?: string;
}) {
  const swirl = (
    rx: number,
    ry: number,
    w: number,
    o: number,
    speed: number,
    key: string,
    half: 'top' | 'bottom' | 'all',
  ) => {
    const len = Math.PI * (rx + ry);
    const clip = half === 'all' ? undefined : `url(#${uid}-${half})`;
    return (
      <g key={key} clipPath={clip}>
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke={`url(#${uid}-disk)`}
          strokeWidth={w}
          opacity={o}
        />
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke={J.sunCore}
          strokeWidth={w * 0.25}
          strokeDasharray={`${len * 0.04} ${len * 0.09}`}
          strokeDashoffset={-t * speed * len * 0.05}
          strokeLinecap="round"
          opacity={o * 0.55}
        />
      </g>
    );
  };
  const disk = (half: 'top' | 'bottom') =>
    [
      [3.4, 0.62, 0.42, 0.35, 0.5],
      [2.8, 0.5, 0.36, 0.6, 0.8],
      [2.25, 0.4, 0.3, 0.85, 1.2],
      [1.75, 0.31, 0.22, 1, 1.7],
    ].map(([kx, ky, kw, o, sp], i) =>
      swirl(R * (kx ?? 1), R * (ky ?? 1), R * (kw ?? 1), o ?? 1, sp ?? 1, `${half}${i}`, half),
    );
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-disk`} x1="0" y1="0" x2="1" y2="0">
          {/* The side turning toward us is brighter (left), the far side dimmer and redder. */}
          <stop offset="0" stopColor={J.sunCore} />
          <stop offset="0.35" stopColor={J.diskGlow} />
          <stop offset="0.75" stopColor={J.disk} />
          <stop offset="1" stopColor={J.sunFlare} />
        </linearGradient>
        <radialGradient id={`${uid}-bloom`}>
          <stop offset="0" stopColor={J.diskGlow} stopOpacity={0.55} />
          <stop offset="0.5" stopColor={J.disk} stopOpacity={0.18} />
          <stop offset="1" stopColor={J.disk} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${uid}-top`}>
          <rect x={cx - R * 6} y={cy - R * 6} width={R * 12} height={R * 6} />
        </clipPath>
        <clipPath id={`${uid}-bottom`}>
          <rect x={cx - R * 6} y={cy} width={R * 12} height={R * 6} />
        </clipPath>
        <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={18 * u} />
        </filter>
      </defs>
      {/* Bloom round everything. */}
      <ellipse cx={cx} cy={cy} rx={R * 5} ry={R * 2.6} fill={`url(#${uid}-bloom)`} />
      {/* The far side of the disk, behind the hole. */}
      {/* The disk's soft glowing body, under its swirling streams. */}
      <g filter={`url(#${uid}-glow)`} opacity={0.8} clipPath={`url(#${uid}-top)`}>
        <ellipse
          cx={cx}
          cy={cy}
          rx={R * 2.6}
          ry={R * 0.46}
          fill="none"
          stroke={`url(#${uid}-disk)`}
          strokeWidth={R * 1.1}
        />
      </g>
      <g>{disk('top')}</g>
      {/* The far side bent up over the top of the hole, and under it: light from behind, lensed. */}
      <g filter={`url(#${uid}-glow)`} opacity={0.85}>
        <ellipse
          cx={cx}
          cy={cy}
          rx={R * 1.45}
          ry={R * 1.3}
          fill="none"
          stroke={J.diskGlow}
          strokeWidth={R * 0.35}
        />
      </g>
      <ellipse
        cx={cx}
        cy={cy}
        rx={R * 1.4}
        ry={R * 1.27}
        fill="none"
        stroke={`url(#${uid}-disk)`}
        strokeWidth={R * 0.2}
        opacity={0.9}
      />
      {/* The hole itself, and the thin ring of light at its edge. */}
      <circle cx={cx} cy={cy} r={R} fill={J.night} />
      <circle cx={cx} cy={cy} r={R} fill={J.space} opacity={0.6} />
      <circle
        cx={cx}
        cy={cy}
        r={R * 1.04}
        fill="none"
        stroke={J.sunCore}
        strokeWidth={3.5 * u}
        opacity={0.95}
      />
      <circle
        cx={cx}
        cy={cy}
        r={R * 1.06}
        fill="none"
        stroke={J.diskGlow}
        strokeWidth={12 * u}
        opacity={0.35}
        filter={`url(#${uid}-glow)`}
      />
      {/* The near side of the disk, passing in front of the hole. */}
      {/* The disk's soft glowing body, under its swirling streams. */}
      <g filter={`url(#${uid}-glow)`} opacity={0.8} clipPath={`url(#${uid}-bottom)`}>
        <ellipse
          cx={cx}
          cy={cy}
          rx={R * 2.6}
          ry={R * 0.46}
          fill="none"
          stroke={`url(#${uid}-disk)`}
          strokeWidth={R * 1.1}
        />
      </g>
      <g>{disk('bottom')}</g>
      <g filter={`url(#${uid}-glow)`} opacity={0.5}>
        {swirl(R * 2.25, R * 0.4, R * 0.25, 0.8, 1.2, 'glow', 'bottom')}
      </g>
    </g>
  );
}

/** Dust and small rocks spiralling in toward the hole. */
export function Infall({
  cx,
  cy,
  R,
  t,
  u,
}: {
  cx: number;
  cy: number;
  R: number;
  t: number;
  u: number;
}) {
  return (
    <g>
      {Array.from({ length: 26 }, (_, i) => {
        const f = (t * 0.06 + rnd(i, 21)) % 1;
        const a = rnd(i, 22) * Math.PI * 2 + f * 5;
        const d = R * (5 - 3.6 * f);
        const x = cx + Math.cos(a) * d;
        const y = cy + Math.sin(a) * d * 0.45;
        const s = (3 + 5 * rnd(i, 23)) * u;
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx={s * 1.6}
            ry={s}
            fill={J.diskGlow}
            opacity={0.55 * (1 - f)}
            transform={`rotate(${(a * 180) / Math.PI} ${x} ${y})`}
          />
        );
      })}
    </g>
  );
}
