import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { lineWeights, tokens } from './tokens';

const srcDir = dirname(fileURLToPath(import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

const stripComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const NAMED =
  'white|black|red|green|blue|gray|grey|yellow|orange|purple|pink|brown|transparent|silver|gold|navy';
const COLOR_PATTERNS = [
  /#[0-9a-fA-F]{3,8}\b/,
  /\b(?:rgba?|hsla?)\s*\(/,
  // Named colors only where a color is being set, so token lookups like accent('orange') pass.
  new RegExp(
    String.raw`\b(?:fill|stroke|color|stopColor|floodColor|backgroundColor)\s*[=:]\s*\{?\s*['"` +
      '`' +
      String.raw`](?:${NAMED})['"` +
      '`]',
    'i',
  ),
];

/** Every color literal in a piece of code. */
export function findColorLiterals(code: string): string[] {
  const clean = stripComments(code);
  return COLOR_PATTERNS.flatMap((re) => {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    return [...clean.matchAll(g)].map((m) => m[0]);
  });
}

describe('style tokens are the only source of color (ground rule 5)', () => {
  it('the detector catches hard-coded colors', () => {
    expect(findColorLiterals('fill="#16161A"')).toHaveLength(1);
    expect(findColorLiterals("stroke: 'black'")).toHaveLength(1);
    expect(findColorLiterals('color: rgb(0,0,0)')).toHaveLength(1);
    expect(findColorLiterals('fill={ink} clipPath="url(#faceClip)"')).toHaveLength(0);
    expect(findColorLiterals('fill="none"')).toHaveLength(0);
    expect(findColorLiterals("accent('orange')")).toHaveLength(0);
    expect(findColorLiterals("hairColor: 'black'")).toHaveLength(0);
    expect(findColorLiterals('fill={"white"}')).toHaveLength(1);
  });

  it('no engine component types a color; tokens.ts is the only place colors are named', () => {
    const offenders = sourceFiles(srcDir)
      .filter((f) => !f.endsWith('tokens.ts'))
      .flatMap((f) =>
        findColorLiterals(readFileSync(f, 'utf8')).map((hit) => `${relative(srcDir, f)}: ${hit}`),
      );
    expect(offenders).toEqual([]);
  });

  it('line weights come from the token ranges', () => {
    const inRange = (v: number, [lo, hi]: readonly [number, number]) => v >= lo && v <= hi;
    expect(inRange(lineWeights.outline, tokens.line.outlinePctOfHead)).toBe(true);
    expect(inRange(lineWeights.limb, tokens.line.limbPctOfHead)).toBe(true);
    expect(inRange(lineWeights.detail, tokens.line.detailPctOfHead)).toBe(true);
    expect(lineWeights.brow).toBe(tokens.line.browPctOfHead);
  });
});
