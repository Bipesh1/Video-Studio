import type { LibraryAsset as Asset } from '@studio/shared';
import { AbsoluteFill } from 'remotion';
import { ink, palette, pick, white } from '../tokens';
import { CATALOG_COLUMNS, CATALOG_PER_PAGE, catalogPageCount } from './catalog';
import { assetById, library, picturedAssets } from './data';
import { PREVIEWS, PREVIEW_SIZE, previewBase } from './previews';
import type { PreviewOptions } from './previews';

/**
 * The library's pictures (Part 2, section 6):
 *   LibraryAsset    one asset in a square, the golden still saved for it
 *   LibraryLook     one asset in three views on a light and a dark field, for the draw, look
 *                   and fix loop
 *   LibraryCatalog  every asset with its name and id, a page at a time, for Biku to browse
 */

const font = 'Arial, Helvetica, sans-serif';

/** One preview in its own clipped square, placed at x, y and drawn at the given size. */
const Tile = ({
  id,
  x,
  y,
  size,
  dark = false,
  options = {},
}: {
  id: string;
  x: number;
  y: number;
  size: number;
  dark?: boolean;
  options?: PreviewOptions;
}) => {
  const preview = PREVIEWS[id];
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${PREVIEW_SIZE} ${PREVIEW_SIZE}`}>
      <rect width={PREVIEW_SIZE} height={PREVIEW_SIZE} fill={previewBase(dark)} />
      {preview ? preview(options) : null}
    </svg>
  );
};

export type LibraryAssetProps = { id: string };

export const LibraryAsset = ({ id }: LibraryAssetProps) => (
  <AbsoluteFill>
    <svg width={PREVIEW_SIZE} height={PREVIEW_SIZE}>
      <Tile id={id} x={0} y={0} size={PREVIEW_SIZE} />
    </svg>
  </AbsoluteFill>
);

export const LOOK_WIDTH = 1260;
export const LOOK_HEIGHT = 900;
const VIEWS = [
  { turn: 0, label: 'front' },
  { turn: 0.5, label: 'three-quarter' },
  { turn: 1, label: 'profile' },
] as const;

export const LibraryLook = ({ id }: LibraryAssetProps) => {
  const asset = assetById(id);
  return (
    <AbsoluteFill style={{ backgroundColor: pick(palette('storm-slate'), 0) }}>
      <svg width={LOOK_WIDTH} height={LOOK_HEIGHT}>
        <text x={30} y={48} fontFamily={font} fontWeight={700} fontSize={30} fill={white}>
          {asset ? `${asset.name}  (${asset.id})` : `${id}  (not in the index yet)`}
        </text>
        {[false, true].map((dark, row) =>
          VIEWS.map((view, col) => (
            <g key={`${row}-${view.label}`}>
              <Tile
                id={id}
                x={30 + col * 410}
                y={70 + row * 410}
                size={390}
                dark={dark}
                options={{ turn: view.turn }}
              />
              <text
                x={30 + col * 410 + 12}
                y={70 + row * 410 + 30}
                fontFamily={font}
                fontWeight={700}
                fontSize={20}
                fill={dark ? white : ink}
              >
                {view.label}
              </text>
            </g>
          )),
        )}
      </svg>
    </AbsoluteFill>
  );
};

export type LibraryCatalogProps = { page: number };

const PAGE_W = 1080;
const PAGE_H = 1920;
const CELL_W = PAGE_W / CATALOG_COLUMNS;
const CELL_H = 300;
const TOP = 100;

const CatalogCell = ({ asset, x, y }: { asset: Asset; x: number; y: number }) => (
  <g>
    <Tile id={asset.id} x={x + 15} y={y} size={CELL_W - 30} />
    <text
      x={x + CELL_W / 2}
      y={y + CELL_W - 30 + 26}
      textAnchor="middle"
      fontFamily={font}
      fontWeight={700}
      fontSize={22}
      fill={white}
    >
      {asset.name}
    </text>
    <text
      x={x + CELL_W / 2}
      y={y + CELL_W - 30 + 48}
      textAnchor="middle"
      fontFamily={font}
      fontSize={16}
      fill={pick(palette('storm-slate'), 4)}
    >
      {asset.id}
    </text>
  </g>
);

export const LibraryCatalog = ({ page }: LibraryCatalogProps) => {
  const pictured = picturedAssets();
  const pages = catalogPageCount(pictured.length);
  const shown = pictured.slice((page - 1) * CATALOG_PER_PAGE, page * CATALOG_PER_PAGE);
  return (
    <AbsoluteFill style={{ backgroundColor: pick(palette('storm-slate'), 0) }}>
      <svg width={PAGE_W} height={PAGE_H}>
        <text x={30} y={62} fontFamily={font} fontWeight={700} fontSize={38} fill={white}>
          {`Library: page ${page} of ${pages}`}
        </text>
        <text
          x={PAGE_W - 30}
          y={62}
          textAnchor="end"
          fontFamily={font}
          fontSize={24}
          fill={pick(palette('storm-slate'), 4)}
        >
          {`${library.assets.length} assets, style ${library.style}`}
        </text>
        {shown.map((asset, i) => (
          <CatalogCell
            key={asset.id}
            asset={asset}
            x={(i % CATALOG_COLUMNS) * CELL_W}
            y={TOP + Math.floor(i / CATALOG_COLUMNS) * CELL_H}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
