/** The pictures made of a saved character. No React here, so the CLI can import it. */
export const SHEET_PAGES = ['sheet', 'expressions', 'poses'] as const;
export type SheetPage = (typeof SHEET_PAGES)[number];
