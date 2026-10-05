import { describe, expect, it } from 'vitest';
import { libraryIndexSchema, searchLibrary, stillPathFor } from './library.schema';
import type { LibraryAsset, LibraryIndex } from './library.schema';

const asset = (over: Partial<LibraryAsset> = {}): LibraryAsset => ({
  id: 'prop/lantern',
  kind: 'prop',
  name: 'Lantern',
  description: 'A small oil lantern carried at night.',
  tags: ['prop', 'lantern', 'light', 'night', 'lamp'],
  code: { file: 'engine/src/props/Lantern.tsx', export: 'Lantern' },
  use: '<Lantern />',
  still: 'knowledge/golden/assets/prop-lantern.png',
  version: 1,
  added: '2026-10-05',
  ...over,
});

const indexOf = (...assets: LibraryAsset[]): LibraryIndex => ({
  version: 1,
  style: 'ink-stick',
  assets,
});

describe('library index schema', () => {
  it('accepts a complete entry', () => {
    expect(libraryIndexSchema.safeParse(indexOf(asset())).success).toBe(true);
  });

  it('rejects an id that does not start with its kind', () => {
    const r = libraryIndexSchema.safeParse(indexOf(asset({ id: 'costume/lantern' })));
    expect(r.success).toBe(false);
  });

  it('rejects two assets with the same id', () => {
    expect(libraryIndexSchema.safeParse(indexOf(asset(), asset())).success).toBe(false);
  });

  it('needs a golden still, except for kinds that cannot be pictured alone', () => {
    const noStill = asset();
    delete noStill.still;
    expect(libraryIndexSchema.safeParse(indexOf(noStill)).success).toBe(false);
    const camera = asset({ id: 'camera/pan', kind: 'camera' });
    delete camera.still;
    expect(libraryIndexSchema.safeParse(indexOf(camera)).success).toBe(true);
  });

  it('needs enough lower case tags to be found by', () => {
    expect(libraryIndexSchema.safeParse(indexOf(asset({ tags: ['prop'] }))).success).toBe(false);
    expect(
      libraryIndexSchema.safeParse(indexOf(asset({ tags: ['Prop', 'Lantern', 'Light'] }))).success,
    ).toBe(false);
  });

  it('names a still after the asset id', () => {
    expect(stillPathFor('prop/lantern')).toBe('knowledge/golden/assets/prop-lantern.png');
  });
});

describe('library search', () => {
  const lantern = asset();
  const torch = asset({
    id: 'prop/torch',
    name: 'Torch',
    description: 'A burning torch held high in a dark place.',
    tags: ['prop', 'torch', 'fire', 'light', 'cave'],
  });
  const crown = asset({
    id: 'costume/crown',
    kind: 'costume',
    name: 'Crown',
    description: 'A plain gold crown for kings and queens.',
    tags: ['costume', 'crown', 'king', 'queen', 'royal'],
  });
  const index = indexOf(lantern, torch, crown);
  const ids = (q: string, kind?: LibraryAsset['kind']) =>
    searchLibrary(index, q, kind ? { kind } : {}).map((h) => h.asset.id);

  it('finds assets by tag, whatever the letter case', () => {
    expect(ids('KING')).toEqual(['costume/crown']);
  });

  it('needs every word to match when it can, and ranks tag matches first', () => {
    expect(ids('light night')).toEqual(['prop/lantern']);
    expect(ids('light')[0]).toBe('prop/lantern');
    expect(ids('light')).toContain('prop/torch');
  });

  it('understands simple plurals and -ing forms', () => {
    expect(ids('kings')).toEqual(['costume/crown']);
    expect(ids('burning')).toEqual(['prop/torch']);
  });

  it('falls back to any word when no asset matches them all', () => {
    expect(ids('queen spaceship')).toEqual(['costume/crown']);
  });

  it('can be narrowed to one kind, and returns nothing for an unknown word', () => {
    expect(ids('light', 'costume')).toEqual([]);
    expect(ids('dragon')).toEqual([]);
  });
});
