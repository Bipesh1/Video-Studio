/**
 * Loads everything a storyboard can refer to: the library index, the formats, brands and
 * voices, and the saved characters. Every file is validated as it is read, and a bad one is
 * reported in plain words with its file name.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import {
  brandSchema,
  characterCardSchema,
  formatSchema,
  libraryIndexSchema,
  parseOrExplain,
  storyboardSchema,
  voiceProfileSchema,
} from '@studio/shared';
import type { Storyboard, World } from '@studio/shared';
import { projectRoot } from './system.js';

const readJson = (file: string): unknown => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(
      `${path.relative(projectRoot, file)} is not valid JSON: ${(err as Error).message}`,
    );
  }
};

/** Every `<id>.json` in a folder, validated, keyed by id. The id must match the file name. */
function loadFolder<T extends { id: string }>(
  folder: string,
  parse: (input: unknown, where: string) => T,
): Record<string, T> {
  const dir = path.join(projectRoot, folder);
  const out: Record<string, T> = {};
  if (!existsSync(dir)) return out;
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()) {
    const where = `${folder}/${file}`;
    const item = parse(readJson(path.join(dir, file)), where);
    if (`${item.id}.json` !== file) {
      throw new Error(`${where} has the id "${item.id}"; the id and the file name must match`);
    }
    out[item.id] = item;
  }
  return out;
}

export function loadWorld(): World {
  const library = parseOrExplain(
    libraryIndexSchema,
    readJson(path.join(projectRoot, 'library', 'index.json')),
    'library/index.json',
  );
  const world: World = {
    library,
    formats: loadFolder('formats', (input, where) => parseOrExplain(formatSchema, input, where)),
    brands: loadFolder('brands', (input, where) => parseOrExplain(brandSchema, input, where)),
    voices: loadFolder('voices', (input, where) =>
      parseOrExplain(voiceProfileSchema, input, where),
    ),
    characters: loadFolder('characters', (input, where) =>
      parseOrExplain(characterCardSchema, input, where),
    ),
  };
  const problems = worldProblems(world);
  if (problems.length) {
    throw new Error(
      `The plug-in files do not agree with each other:\n${problems.map((p) => `  - ${p}`).join('\n')}`,
    );
  }
  return world;
}

/** Checks between plug-in files: a brand's default format and voice exist, its colors too. */
export function worldProblems(world: World): string[] {
  const out: string[] = [];
  const colors = new Set(
    world.library.assets.filter((a) => a.kind === 'color').map((a) => a.id.slice('color/'.length)),
  );
  for (const brand of Object.values(world.brands)) {
    const where = `brands/${brand.id}.json`;
    if (!world.formats[brand.defaults.format]) {
      out.push(`${where}: there is no format called "${brand.defaults.format}"`);
    }
    if (!world.voices[brand.defaults.voice]) {
      out.push(`${where}: there is no voice called "${brand.defaults.voice}"`);
    }
    for (const [use, color] of Object.entries(brand.colors)) {
      if (!colors.has(color))
        out.push(`${where}: ${use} uses "${color}", which is not a style color`);
    }
  }
  for (const card of Object.values(world.characters)) {
    if (card.voice && !world.voices[card.voice]) {
      out.push(`characters/${card.id}.json: there is no voice called "${card.voice}"`);
    }
  }
  return out;
}

export function loadStoryboard(file: string): Storyboard {
  if (!existsSync(file))
    throw new Error(`There is no storyboard at ${path.relative(projectRoot, file)}`);
  return parseOrExplain(storyboardSchema, readJson(file), path.relative(projectRoot, file));
}
