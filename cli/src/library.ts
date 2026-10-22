/**
 * `npm run library -- <command>`: the library of everything already drawn (Part 2, section 6).
 *
 *   search <words> [--kind=costume]   find assets by plain words, best match first
 *   list [--kind=pose]                every asset, grouped by kind
 *   show <id>                         one asset in full
 *   characters                        every saved character card in characters/
 *   sheet <character> [<character>]   a saved character's pictures into characters/sheets/: the
 *                                     character sheet, the faces and the poses
 *   cast <name> [--order=id,id]       every character of one cast together at the game table
 *   check                             fail if a drawing is missing from the index, or the index
 *                                     points at code or a still that is not there
 *   stills [--only=id,id]             render each asset's golden still into knowledge/golden/assets/
 *   look <id>                         render one asset in three views on light and dark, for the
 *                                     draw, look and fix loop (into engine/out/library/)
 *   catalog                           render the picture catalog into library/catalog/
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import {
  ASSET_KINDS,
  characterCardSchema,
  libraryIndexSchema,
  parseOrExplain,
  searchLibrary,
} from '@studio/shared';
import type { AssetKind, CharacterCard, LibraryAsset, LibraryIndex } from '@studio/shared';
import { catalogPageCount } from '../../engine/src/library/catalog';
import { SHEET_PAGES } from '../../engine/src/library/sheetPages';
import { bundle, finishRendering, renderStill, selectComposition } from './render.js';
import { projectRoot, run } from './system.js';

const [command, ...rest] = process.argv.slice(2);
const flags = rest.filter((a) => a.startsWith('--'));
const words = rest.filter((a) => !a.startsWith('--'));
const flag = (name: string) =>
  flags.find((f) => f.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;

const engineDir = path.join(projectRoot, 'engine');
const indexFile = path.join(projectRoot, 'library', 'index.json');

function loadIndex(): LibraryIndex {
  return parseOrExplain(
    libraryIndexSchema,
    JSON.parse(readFileSync(indexFile, 'utf8')),
    'library/index.json',
  );
}

/** Every saved character card, validated. */
function loadCards(): CharacterCard[] {
  const dir = path.join(projectRoot, 'characters');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) =>
      parseOrExplain(
        characterCardSchema,
        JSON.parse(readFileSync(path.join(dir, f), 'utf8')),
        `characters/${f}`,
      ),
    );
}

function describeCard(c: CharacterCard) {
  const wears = !c.outfit
    ? 'a plain stick figure'
    : 'costume' in c.outfit
      ? `the ${c.outfit.costume} costume`
      : Object.entries(c.outfit.clothes)
          .flatMap(([piece, g]) => (g === undefined || g === false ? [] : [[piece, g] as const]))
          .map(([piece, g]) =>
            g === true ? 'glasses' : 'kind' in g ? `${g.cloth} ${g.kind}` : `${g.cloth} ${piece}`,
          )
          .join(', ');
  console.log(`${c.id}  (${c.name}, ${c.age})`);
  console.log(`  ${c.description}`);
  console.log(`  wears: ${wears}`);
  if (c.series) console.log(`  cast:  ${c.series} (look and voice are fixed)`);
  if (c.voice) console.log(`  voice: ${c.voice}`);
  else if (c.series) console.log('  voice: none, never speaks');
  if (c.expressions) console.log(`  faces: ${c.expressions.join(', ')}`);
  if (c.poses) console.log(`  poses: ${c.poses.join(', ')}`);
  if (c.signature) console.log(`  own:   ${c.signature.join(', ')}`);
  const sheets = path.join('characters', 'sheets', `${c.id}-sheet.png`);
  if (existsSync(path.join(projectRoot, sheets))) console.log(`  sheet: ${sheets}`);
  console.log(`  tags:  ${c.tags.join(', ')}`);
  console.log(`  file:  characters/${c.id}.json`);
}

function characters() {
  const cards = loadCards();
  if (!cards.length) {
    console.log('No saved characters yet.');
    return;
  }
  for (const c of cards) {
    describeCard(c);
    console.log('');
  }
}

function kindFlag(): AssetKind | undefined {
  const k = flag('kind');
  if (!k) return undefined;
  if (!(ASSET_KINDS as readonly string[]).includes(k)) {
    throw new Error(`Unknown kind "${k}". Kinds: ${ASSET_KINDS.join(', ')}`);
  }
  return k as AssetKind;
}

const line = (a: LibraryAsset) => `  ${a.id.padEnd(34)} ${a.name}`;

function describe(a: LibraryAsset) {
  console.log(`${a.id}  (${a.name}, version ${a.version})`);
  console.log(`  ${a.description}`);
  console.log(`  tags:  ${a.tags.join(', ')}`);
  console.log(`  code:  ${a.code.file}  export ${a.code.export}`);
  console.log(`  use:   ${a.use}`);
  if (a.still) console.log(`  still: ${a.still}`);
}

function search() {
  const kind = kindFlag();
  const hits = searchLibrary(loadIndex(), words.join(' '), kind ? { kind } : {});
  // Saved characters match on their name, tags or description.
  const terms = words.map((w) => w.toLowerCase());
  const cards = kind
    ? []
    : loadCards().filter((c) => {
        // Whole words only, so "old" does not find "gold" and "man" does not find "woman".
        const text = new Set(
          `${c.name} ${c.tags.join(' ')} ${c.description}`.toLowerCase().split(/[^a-z0-9]+/),
        );
        return terms.length > 0 && terms.every((t) => text.has(t));
      });
  if (!hits.length && !cards.length) {
    console.log(`Nothing in the library matches "${words.join(' ')}". It has to be drawn.`);
    return;
  }
  for (const { asset } of hits.slice(0, 12)) {
    describe(asset);
    console.log('');
  }
  if (hits.length > 12) console.log(`...and ${hits.length - 12} more. Add a word or --kind=.`);
  if (cards.length) {
    console.log('Saved characters:');
    for (const c of cards) {
      describeCard(c);
      console.log('');
    }
  }
}

function list() {
  const kind = kindFlag();
  const index = loadIndex();
  for (const k of ASSET_KINDS) {
    if (kind && k !== kind) continue;
    const assets = index.assets.filter((a) => a.kind === k);
    if (!assets.length) continue;
    console.log(`${k} (${assets.length})`);
    for (const a of assets) console.log(line(a));
  }
  console.log(`\n${index.assets.length} assets in all.`);
}

function show() {
  const id = words[0];
  const asset = loadIndex().assets.find((a) => a.id === id);
  if (!asset)
    throw new Error(`No asset "${id}" in the library. Try: npm run library -- search <words>`);
  describe(asset);
}

/** The checks live in one test file, so `npm test` and this command can never disagree. */
function check() {
  const r = run('npx', ['vitest', 'run', 'engine/src/library'], { cwd: projectRoot });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  if (r.status === 0) {
    const n = loadIndex().assets.length;
    console.log(
      `The library is complete: ${n} assets, every one indexed and pointing at real code and pictures.`,
    );
    return;
  }
  console.log(out);
  console.log('The library check failed. The lines above say which asset and what is missing.');
  process.exitCode = 1;
}

let serveUrl: string | null = null;
async function bundled() {
  if (!serveUrl) {
    console.log('Bundling the engine...');
    serveUrl = await bundle({ entryPoint: path.join(engineDir, 'src', 'index.ts') });
  }
  return serveUrl;
}

async function stills() {
  const only = flag('only')?.split(',');
  const index = loadIndex();
  const assets = index.assets.filter((a) => a.still && (!only || only.includes(a.id)));
  if (only) {
    const unknown = only.filter((id) => !index.assets.some((a) => a.id === id));
    if (unknown.length) throw new Error(`Not in the index: ${unknown.join(', ')}`);
  }
  const url = await bundled();
  for (const a of assets) {
    const inputProps = { id: a.id };
    const composition = await selectComposition({ serveUrl: url, id: 'LibraryAsset', inputProps });
    const output = path.join(projectRoot, a.still as string);
    mkdirSync(path.dirname(output), { recursive: true });
    await renderStill({ composition, serveUrl: url, output, inputProps });
    console.log(`  ${a.still}`);
  }
  console.log(`${assets.length} golden stills written.`);
}

async function look() {
  const id = words[0];
  if (!id) throw new Error('Give the asset id: npm run library -- look costume/ruler');
  const url = await bundled();
  const inputProps = { id };
  const composition = await selectComposition({ serveUrl: url, id: 'LibraryLook', inputProps });
  const outDir = path.join(engineDir, 'out', 'library');
  mkdirSync(outDir, { recursive: true });
  const base = path.join(outDir, id.replace('/', '-'));
  await renderStill({ composition, serveUrl: url, output: `${base}-look.png`, inputProps });
  // The same sheet at a third of the size: does it still read on a phone?
  await renderStill({
    composition,
    serveUrl: url,
    output: `${base}-look-phone.png`,
    inputProps,
    scale: 1 / 3,
  });
  console.log(`  ${path.relative(projectRoot, `${base}-look.png`)}`);
  console.log(`  ${path.relative(projectRoot, `${base}-look-phone.png`)}`);
}

async function catalog() {
  const index = loadIndex();
  const pages = catalogPageCount(index.assets.filter((a) => a.still).length);
  const outDir = path.join(projectRoot, 'library', 'catalog');
  // Old pages go first, so a shorter catalog never leaves a stale last page behind.
  if (existsSync(outDir)) {
    for (const f of readdirSync(outDir)) {
      if (/^page-\d+\.png$/.test(f)) rmSync(path.join(outDir, f));
    }
  }
  mkdirSync(outDir, { recursive: true });
  const url = await bundled();
  for (let page = 1; page <= pages; page++) {
    const inputProps = { page };
    const composition = await selectComposition({
      serveUrl: url,
      id: 'LibraryCatalog',
      inputProps,
    });
    const output = path.join(outDir, `page-${page}.png`);
    await renderStill({ composition, serveUrl: url, output, inputProps });
    console.log(`  ${path.relative(projectRoot, output)}`);
  }
}

const sheetsDir = path.join(projectRoot, 'characters', 'sheets');

function cardNamed(id: string | undefined): CharacterCard {
  const card = loadCards().find((c) => c.id === id);
  if (!card) {
    throw new Error(
      `No saved character "${id ?? ''}". Saved: ${loadCards()
        .map((c) => c.id)
        .join(', ')}`,
    );
  }
  return card;
}

/** A saved character's three pictures: the character sheet, the faces and the poses. */
async function sheet() {
  const ids = words.length ? words : [undefined];
  const cards = ids.map(cardNamed);
  const url = await bundled();
  mkdirSync(sheetsDir, { recursive: true });
  for (const card of cards) {
    for (const page of SHEET_PAGES) {
      const inputProps = { card, page };
      const composition = await selectComposition({
        serveUrl: url,
        id: 'CharacterSheet',
        inputProps,
      });
      const output = path.join(sheetsDir, `${card.id}-${page}.png`);
      await renderStill({ composition, serveUrl: url, output, inputProps });
      console.log(`  ${path.relative(projectRoot, output)}`);
    }
  }
}

/** A whole cast standing together at the game table: every card of one series. */
async function cast() {
  const series = words[0];
  const members = loadCards().filter((c) => c.series === series);
  if (!series || !members.length) {
    const known = [...new Set(loadCards().flatMap((c) => (c.series ? [c.series] : [])))];
    throw new Error(`Give a cast: npm run library -- cast <name>. Casts: ${known.join(', ')}`);
  }
  // Left to right as asked, then anyone not named, by id.
  const order = flag('order')?.split(',') ?? [];
  const place = (c: CharacterCard) => (order.includes(c.id) ? order.indexOf(c.id) : order.length);
  const cards = [...members].sort((a, b) => place(a) - place(b) || a.id.localeCompare(b.id));
  const url = await bundled();
  mkdirSync(sheetsDir, { recursive: true });
  for (const names of [true, false]) {
    const inputProps = { cards, names };
    const composition = await selectComposition({ serveUrl: url, id: 'CastLineup', inputProps });
    const output = path.join(sheetsDir, `cast-${series}${names ? '' : '-no-names'}.png`);
    await renderStill({ composition, serveUrl: url, output, inputProps });
    console.log(`  ${path.relative(projectRoot, output)}`);
  }
}

const commands: Record<string, () => void | Promise<void>> = {
  search,
  list,
  show,
  characters,
  sheet,
  cast,
  check,
  stills,
  look,
  catalog,
};

const action = command ? commands[command] : undefined;
if (!action) {
  console.log(
    'Commands: search <words>, list, show <id>, characters, sheet <character>, cast <name>, check, stills, look <id>, catalog',
  );
  process.exitCode = 1;
} else {
  try {
    await action();
  } finally {
    await finishRendering();
  }
}
