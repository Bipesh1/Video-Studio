import { AbsoluteFill, Img, staticFile } from 'remotion';
import { CAPTION_FONT } from '../overlays/Captions';
import { ink, lineWeights, palette, pick, tokens, white } from '../tokens';

/**
 * Style match sheet (Phase 1): one test still beside Biku's two reference images,
 * with the Style Check (guide Style 11) answered for that still.
 */

export type StyleAnswer = 'yes' | 'no' | 'n/a';
export type StyleCheckRow = { n: number; question: string; answer: StyleAnswer; note: string };
export type StyleMatchProps = {
  title: string;
  stillSrc: string;
  checks: StyleCheckRow[];
  summary: string;
};

export const STYLE_MATCH_PLACEHOLDER: StyleMatchProps = {
  title: 'Shot',
  stillSrc: '',
  checks: [],
  summary: '',
};

const bg = pick(palette('storm-slate'), 0);
const panel = pick(palette('storm-slate'), 1);
const chipColor: Record<StyleAnswer, string> = {
  yes: pick(tokens.accents.forest ?? [], 0),
  no: pick(tokens.accents.crimson ?? [], 0),
  'n/a': pick(palette('storm-slate'), 2),
};

const font = `${CAPTION_FONT}, sans-serif`;

const Label = ({ children }: { children: string }) => (
  <div style={{ fontFamily: font, fontWeight: 600, fontSize: 26, color: white, marginBottom: 10 }}>
    {children}
  </div>
);

export const StyleMatch = ({ title, stillSrc, checks, summary }: StyleMatchProps) => (
  <AbsoluteFill
    style={{ backgroundColor: bg, padding: 36, display: 'flex', flexDirection: 'row', gap: 34 }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', width: 560 }}>
      <Label>{`Test still: ${title}`}</Label>
      {stillSrc ? (
        <Img
          src={staticFile(stillSrc)}
          style={{
            width: 540,
            height: 920,
            objectFit: 'cover',
            borderRadius: 14,
            border: `4px solid ${ink}`,
          }}
        />
      ) : null}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', width: 520, gap: 18 }}>
      <Label>Reference A (the king)</Label>
      <Img
        src={staticFile('reference/reference-a-king.jpeg')}
        style={{ width: 520, borderRadius: 10 }}
      />
      <Label>Reference B (the night scene)</Label>
      <Img
        src={staticFile('reference/reference-b-night-scene.jpeg')}
        style={{ width: 330, borderRadius: 10 }}
      />
      <div style={{ fontFamily: font, fontSize: 22, color: white, lineHeight: 1.3 }}>{summary}</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 9 }}>
      <Label>Style Check (guide Style 11)</Label>
      {checks.map((c) => (
        <div
          key={c.n}
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
            backgroundColor: panel,
            borderRadius: 10,
            padding: '9px 12px',
          }}
        >
          <div
            style={{
              minWidth: 64,
              textAlign: 'center',
              fontFamily: font,
              fontWeight: 700,
              fontSize: 20,
              color: white,
              backgroundColor: chipColor[c.answer],
              borderRadius: 8,
              padding: '3px 0',
              border: `${lineWeights.outline * 40}px solid ${ink}`,
            }}
          >
            {c.answer.toUpperCase()}
          </div>
          <div style={{ fontFamily: font, fontSize: 19, color: white, lineHeight: 1.22 }}>
            <span style={{ fontWeight: 600 }}>{`${c.n}. ${c.question}`}</span>
            <br />
            <span style={{ opacity: 0.85 }}>{c.note}</span>
          </div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
