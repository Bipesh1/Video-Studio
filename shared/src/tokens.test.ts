import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseStyleTokens, styleTokensSchema } from './tokens.schema';

const here = dirname(fileURLToPath(import.meta.url));
const tokensPath = join(here, '..', '..', 'styles', 'ink-stick', 'tokens.json');
const tokens: unknown = JSON.parse(readFileSync(tokensPath, 'utf8'));

describe('styles/ink-stick/tokens.json', () => {
  it('validates against the schema', () => {
    const parsed = parseStyleTokens(tokens);
    expect(parsed.id).toBe('ink-stick');
    expect(parsed.skinTones).toHaveLength(8);
    expect(parsed.motion.fps).toBe(30);
  });

  it('rejects a bad color', () => {
    const bad = structuredClone(tokens) as { line: { color: string } };
    bad.line.color = 'black';
    expect(styleTokensSchema.safeParse(bad).success).toBe(false);
    expect(() => parseStyleTokens(bad)).toThrow(/line\.color/);
  });

  it('rejects an inverted range', () => {
    const bad = structuredClone(tokens) as { line: { outlinePctOfHead: [number, number] } };
    bad.line.outlinePctOfHead = [0.05, 0.04];
    expect(styleTokensSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects gradients on characters', () => {
    const bad = structuredClone(tokens) as { fill: { characterGradients: boolean } };
    bad.fill.characterGradients = true;
    expect(styleTokensSchema.safeParse(bad).success).toBe(false);
  });

  it('requires fingers on holding hands (guide v2)', () => {
    const parsed = parseStyleTokens(tokens);
    expect(parsed.version).toBeGreaterThanOrEqual(2);
    expect(parsed.hands.holding).toBe('fingers');
    expect(parsed.hands.resting).toBe('mitten');
    const bad = structuredClone(tokens) as { hands: { holding: string } };
    bad.hands.holding = 'mitten';
    expect(styleTokensSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown top-level keys', () => {
    const bad = { ...(tokens as object), extra: 1 };
    expect(styleTokensSchema.safeParse(bad).success).toBe(false);
  });
});
