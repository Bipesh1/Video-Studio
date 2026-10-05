import { libraryIndexSchema, parseOrExplain } from '@studio/shared';
import type { LibraryAsset, LibraryIndex } from '@studio/shared';
import rawIndex from '../../../library/index.json';

/** The library index, validated once so a broken index fails loudly before anything renders. */
export const library: LibraryIndex = parseOrExplain(
  libraryIndexSchema,
  rawIndex,
  'library/index.json',
);

export const assetById = (id: string): LibraryAsset | undefined =>
  library.assets.find((a) => a.id === id);

/** Assets that have a picture, in index order. */
export const picturedAssets = (): LibraryAsset[] => library.assets.filter((a) => a.still);
