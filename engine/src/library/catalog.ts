/** Catalog page layout, with no imports so the CLI can use it too. */
export const CATALOG_COLUMNS = 4;
export const CATALOG_ROWS = 6;
export const CATALOG_PER_PAGE = CATALOG_COLUMNS * CATALOG_ROWS;

/** How many catalog pages a number of pictured assets needs. */
export const catalogPageCount = (pictured: number): number =>
  Math.max(1, Math.ceil(pictured / CATALOG_PER_PAGE));
