import { AbsoluteFill, Img, staticFile } from 'remotion';
import { RestingSweat } from '../effects/Sweat';
import { EXPRESSIONS } from '../face/expressions';
import type { FaceParams } from '../face/types';
import { CAPTION_FONT } from '../overlays/Captions';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { resolvePose } from '../rig/pose';
import { stand } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import { palette, pick, white } from '../tokens';
import { RULER } from '../wardrobe/costumes/ruler';

/**
 * Checkpoint 1 face match: each reference face, cropped and enlarged, beside our version
 * of the same expression at the same size (Biku's feedback, 2026-10-03).
 */

const CELL = 470;
const bg = pick(palette('storm-slate'), 0);
const ourBg = pick(palette('dusk-violet'), 1);
const font = `${CAPTION_FONT}, sans-serif`;
const standHead = computeSkeleton(resolvePose(stand)).head;

type Row = {
  label: string;
  ref: { file: string; natW: number; x: number; y: number; size: number };
  face: FaceParams;
  extra: Partial<CharacterProps>;
  cellBg: string;
};

const ROWS: Row[] = [
  {
    label: 'Angry (Reference B, left figure)',
    ref: { file: 'reference/reference-b-night-scene.jpeg', natW: 387, x: 30, y: 115, size: 110 },
    face: EXPRESSIONS.angry,
    extra: { turn: 0.3 },
    cellBg: ourBg,
  },
  {
    label: 'Afraid (Reference B, right figure)',
    ref: { file: 'reference/reference-b-night-scene.jpeg', natW: 387, x: 175, y: 130, size: 120 },
    face: EXPRESSIONS.afraid,
    extra: { turn: 0.3, facing: 'left', headEffects: <RestingSweat side={-1} /> },
    cellBg: ourBg,
  },
  {
    label: 'Stern ruler (Reference A)',
    ref: { file: 'reference/reference-a-king.jpeg', natW: 595, x: 225, y: 95, size: 140 },
    face: EXPRESSIONS.angry,
    extra: { turn: 0.25, eyeStyle: 'stern', outfit: RULER },
    cellBg: pick(palette('storm-slate'), 2),
  },
];

const RefCrop = ({ r }: { r: Row['ref'] }) => {
  const scale = CELL / r.size;
  return (
    <div
      style={{
        width: CELL,
        height: CELL,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 16,
      }}
    >
      <Img
        src={staticFile(r.file)}
        style={{
          position: 'absolute',
          width: r.natW * scale,
          left: -r.x * scale,
          top: -r.y * scale,
        }}
      />
    </div>
  );
};

const OurFace = ({ row }: { row: Row }) => {
  const head = CELL * 0.62;
  const sign = row.extra.facing === 'left' ? -1 : 1;
  return (
    <svg width={CELL} height={CELL} style={{ borderRadius: 16, backgroundColor: row.cellBg }}>
      <Character
        x={CELL / 2 - standHead.x * head * sign}
        groundY={CELL * 0.54 - standHead.y * head}
        head={head}
        pose={resolvePose(stand)}
        face={row.face}
        {...row.extra}
      />
    </svg>
  );
};

export const FaceMatch = () => (
  <AbsoluteFill style={{ backgroundColor: bg, padding: '40px 50px', gap: 26 }}>
    <div
      style={{
        display: 'flex',
        gap: 40,
        fontFamily: font,
        fontWeight: 700,
        fontSize: 34,
        color: white,
      }}
    >
      <div style={{ width: CELL }}>Reference</div>
      <div style={{ width: CELL }}>Ours</div>
    </div>
    {ROWS.map((row) => (
      <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontFamily: font, fontWeight: 600, fontSize: 28, color: white }}>
          {row.label}
        </div>
        <div style={{ display: 'flex', gap: 40 }}>
          <RefCrop r={row.ref} />
          <OurFace row={row} />
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
