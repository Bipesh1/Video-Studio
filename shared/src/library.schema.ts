import { z } from 'zod';

/**
 * The library index (Part 2, sections 5 and 6): one entry for every drawn asset, so a video
 * run can find what already exists before drawing anything. The file is `library/index.json`.
 */

/** What an asset is. Search can be narrowed to one kind. */
export const ASSET_KINDS = [
  'rig',
  'pose',
  'action',
  'motion',
  'expression',
  'eyes',
  'hand',
  'skin',
  'hair',
  'hair-color',
  'facial-hair',
  'clothing',
  'costume',
  'age',
  'prop',
  'effect',
  'background',
  'place',
  'palette',
  'background-element',
  'silhouette',
  'color',
  'camera',
  'overlay',
] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

/** Kinds with nothing to picture on their own: they are judged in a shot, not in a still. */
export const KINDS_WITHOUT_STILL: readonly AssetKind[] = ['camera', 'overlay'];

const tag = z
  .string()
  .regex(/^[a-z0-9][a-z0-9 -]*$/, 'tags are lower case words, digits, spaces and hyphens');

export const libraryAssetSchema = z
  .object({
    /** `<kind>/<name>`, lower case with hyphens, unique in the index. */
    id: z.string().regex(/^[a-z-]+\/[a-z0-9-]+$/),
    kind: z.enum(ASSET_KINDS),
    name: z.string().min(1),
    /** One plain sentence: what it shows and when to use it. */
    description: z.string().min(10),
    tags: z.array(tag).min(3),
    code: z.object({
      /** Path from the project root to the file that draws it. */
      file: z.string().regex(/^(engine|shared)\/src\/.+\.(ts|tsx)$/),
      /** The exported name to import from that file. */
      export: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
    }),
    /** How a scene asks for it, as a short code hint. */
    use: z.string().min(1),
    /** Path from the project root to its golden still. Omitted only for kinds without one. */
    still: z
      .string()
      .regex(/^knowledge\/golden\/assets\/[a-z0-9-]+\.png$/)
      .optional(),
    /** Raised whenever the drawing changes in a way a viewer would notice. */
    version: z.number().int().min(1),
    added: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict()
  .superRefine((a, ctx) => {
    if (!a.id.startsWith(`${a.kind}/`)) {
      ctx.addIssue({
        code: 'custom',
        message: `id "${a.id}" must start with its kind "${a.kind}/"`,
      });
    }
    if (!a.still && !KINDS_WITHOUT_STILL.includes(a.kind)) {
      ctx.addIssue({ code: 'custom', message: `"${a.id}" needs a golden still` });
    }
  });

export const libraryIndexSchema = z
  .object({
    version: z.literal(1),
    style: z.string().min(1),
    assets: z.array(libraryAssetSchema),
  })
  .strict()
  .superRefine((index, ctx) => {
    const seen = new Set<string>();
    for (const a of index.assets) {
      if (seen.has(a.id)) ctx.addIssue({ code: 'custom', message: `duplicate asset id "${a.id}"` });
      seen.add(a.id);
    }
  });

export type LibraryAsset = z.infer<typeof libraryAssetSchema>;
export type LibraryIndex = z.infer<typeof libraryIndexSchema>;

/** The file name of an asset's golden still: its id with the slash as a hyphen. */
export const stillPathFor = (id: string): string =>
  `knowledge/golden/assets/${id.replace('/', '-')}.png`;

export type LibraryHit = { asset: LibraryAsset; score: number };

const words = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** A light stem so "kings" finds "king" and "pointing" finds "point". */
const stem = (w: string): string =>
  w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w.length > 3 ? w.replace(/s$/, '') : w;

/** How well one search word matches one asset: tags count most, then the name, then the text. */
function wordScore(asset: LibraryAsset, word: string): number {
  const w = stem(word);
  const hit = (list: string[]) => list.some((x) => stem(x) === w);
  if (asset.tags.some((t) => t === word || hit(words(t)))) return 3;
  if (hit(words(asset.name)) || hit(words(asset.id))) return 2;
  if (hit(words(asset.description))) return 1;
  return 0;
}

/**
 * Find assets by plain words, best first. Every word must match an asset somewhere (tags,
 * name or description). When nothing matches every word, assets matching any word are
 * returned instead, so a search rarely comes back empty.
 */
export function searchLibrary(
  index: LibraryIndex,
  query: string,
  options: { kind?: AssetKind } = {},
): LibraryHit[] {
  const terms = words(query);
  const pool = index.assets.filter((a) => !options.kind || a.kind === options.kind);
  if (!terms.length) return pool.map((asset) => ({ asset, score: 0 }));
  const scored = pool.map((asset) => {
    const scores = terms.map((t) => wordScore(asset, t));
    return { asset, scores, score: scores.reduce((a, b) => a + b, 0) };
  });
  const all = scored.filter((s) => s.scores.every((x) => x > 0));
  const hits = all.length ? all : scored.filter((s) => s.score > 0);
  return hits
    .sort((a, b) => b.score - a.score || a.asset.id.localeCompare(b.asset.id))
    .map(({ asset, score }) => ({ asset, score }));
}
