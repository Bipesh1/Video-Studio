import { thumbnailSchema, thumbnailsSchema } from '@studio/shared';
import type { CastMember } from '@studio/shared';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Poster } from './Poster';
import { posterProblems } from './posterCheck';

// The poster asks the renderer only for the size of the picture and a full-size box to draw in.
vi.mock('remotion', () => ({
  AbsoluteFill: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useVideoConfig: () => ({ width: 1080, height: 1920, fps: 30, durationInFrames: 1 }),
}));

/** Thumbnails: posters built in layers, with a title that says what the video is. */

const cast: CastMember[] = [{ id: 'copycat', name: 'The Copycat', card: 'copycat' }];
const room = { kind: 'room', place: 'the-table', palette: 'table-grey' };
const man = {
  kind: 'person',
  character: 'copycat',
  x: 0.5,
  y: 0.5,
  head: 0.2,
  expression: 'dread',
};
const title = { kind: 'words', lines: ['THE SMOKE', 'TEST'], gold: [1], bottom: 0.2 };
const poster = (layers: unknown[]) =>
  thumbnailSchema.parse({ id: 'one', why: 'What it shows.', layers });

describe('a thumbnail', () => {
  it('is drawn from its layers, back to front: room, people, smoke, labels, the title', () => {
    const thumb = poster([
      room,
      { kind: 'backdrop', inner: 'glint', outer: 'ocean', at: { x: 0.7, y: 0.5 } },
      { kind: 'glow', at: { x: 0.7, y: 0.5 }, radius: 0.4 },
      { kind: 'extra', x: 0.2, y: 0.4, head: 0.12, badge: true },
      { kind: 'smoke', top: 0.5, head: 0.1 },
      { ...man, pose: 'run', effects: ['sweat-resting'], outline: 0.03 },
      { kind: 'panel', top: 0.6, bottom: 1, place: 'the-table', palette: 'table-grey' },
      { kind: 'band', top: 0, bottom: 0.2 },
      { kind: 'tag', text: '10% LEAVE', x: 0.5, y: 0.9, paint: 'crimson' },
      { kind: 'sign', text: 'EXIT', at: { x: 0.7, y: 0.3 }, to: { x: 0.95, y: 0.3 } },
      title,
    ]);
    expect(posterProblems(thumb, cast)).toEqual([]);
    const picture = renderToStaticMarkup(
      <Poster size="9:16" thumbnail={thumb} cast={cast} cards={{}} seed={1} />,
    );
    for (const text of ['THE', 'SMOKE', 'TEST', '10% LEAVE', 'EXIT']) {
      expect(picture).toContain(text);
    }
    // A look of its own: a colour backdrop with rays, a pale edge round him, solid grey extras.
    for (const part of ['radialGradient', 'feMorphology', 'feColorMatrix']) {
      expect(picture).toContain(part);
    }
    expect(thumb.size).toBe('16:9');
    // The title comes last, over everything.
    expect(picture.lastIndexOf('TEST')).toBeGreaterThan(picture.lastIndexOf('EXIT'));
  });

  it('cuts the picture in two for a short film: two moods, a thing on the cut, the title over both', () => {
    const who = {
      identity: { skinTone: 3, hair: 'short-crop', hairColor: 'black' },
      outfit: { clothes: { top: { kind: 'hoodie', cloth: 'forest' } } },
    };
    const side = (pose: string, face: string, more: object) => ({
      kind: 'extra',
      look: who,
      x: 0.25,
      y: 0.5,
      ground: 0.9,
      head: 0.17,
      pose,
      expression: face,
      ...more,
    });
    const thumb = poster([
      {
        kind: 'split',
        left: [
          { kind: 'backdrop', inner: 'denim', outer: 'steel', at: { x: 0.25, y: 0.5 }, rays: 0 },
          { kind: 'floor', y: 0.9 },
          { kind: 'rain' },
          side('kneel', 'sad', { light: 0.7, effects: ['tear-streams'] }),
        ],
        right: [
          { kind: 'backdrop', inner: 'gold', outer: 'orange', at: { x: 0.75, y: 0.5 } },
          side('hands-up', 'laughing', { x: 0.75, outline: 0.03 }),
        ],
      },
      { kind: 'paper', lines: ['DEAR', 'ME'], x: 0.5, y: 0.55 },
      { kind: 'words', lines: ['*ONE* LETTER'], bottom: 0.2 },
    ]);
    expect(posterProblems(thumb, [])).toEqual([]);
    const picture = renderToStaticMarkup(
      <Poster size="16:9" thumbnail={thumb} cast={[]} cards={{}} seed={1} />,
    );
    // Each side is drawn inside its own half of the cut.
    expect(picture).toContain('poster-split-0-l');
    expect(picture).toContain('poster-split-0-r');
    for (const text of ['DEAR', 'ME', 'ONE', 'LETTER']) expect(picture).toContain(text);
    // The marked word is gold and the asterisks are not shown.
    expect(picture).not.toContain('*');
    expect(picture).toMatch(/<tspan fill="#E9C23B">ONE<\/tspan>/i);
    // A figure dressed in a cloth the style does not have is named before anything is drawn.
    const wrong = poster([
      {
        ...side('stand', 'happy', {}),
        look: { outfit: { clothes: { top: { kind: 'hoodie', cloth: 'pink' } } } },
      },
      { kind: 'words', lines: ['NO'], bottom: 0.2 },
    ]);
    expect(posterProblems(wrong, []).join(' ')).toContain('pink');
  });

  it('names what the studio does not have, in plain words', () => {
    const thumb = poster([
      { ...room, place: 'nowhere' },
      { ...man, character: 'stranger', pose: 'cartwheel', expression: 'sleepy', effects: ['halo'] },
      { kind: 'thing', prop: 'unicorn', x: 0.5, y: 0.9, head: 0.1 },
      { kind: 'tag', text: 'NO', x: 0.5, y: 0.5, paint: 'pink' },
      { kind: 'backdrop', inner: 'neon', outer: 'ocean', at: { x: 0.5, y: 0.5 } },
      title,
    ]);
    const found = posterProblems(thumb, cast).join('\n');
    for (const part of [
      'no place "nowhere"',
      '"stranger" is not in this video',
      'no pose or move "cartwheel"',
      'no expression "sleepy"',
      'cannot show "halo"',
      'no thing "unicorn"',
      'no accent "pink"',
      'no accent "neon"',
    ]) {
      expect(found).toContain(part);
    }
  });

  it('has a title, someone of the cast, few words, and an id of its own', () => {
    const ok = { id: 'one', why: 'Why.', layers: [room, man, title] };
    expect(thumbnailSchema.safeParse(ok).success).toBe(true);
    expect(thumbnailSchema.safeParse({ ...ok, layers: [room, man] }).success).toBe(false);
    expect(thumbnailSchema.safeParse({ ...ok, layers: [room, title] }).success).toBe(false);
    const wordy = {
      ...title,
      lines: ['ONE TWO THREE FOUR FIVE', 'SIX SEVEN EIGHT NINE TEN', 'AND THREE MORE'],
    };
    expect(thumbnailSchema.safeParse({ ...ok, layers: [room, man, wordy] }).success).toBe(false);
    expect(
      thumbnailSchema.safeParse({ ...ok, layers: [room, man, { ...title, gold: [2] }] }).success,
    ).toBe(false);
    expect(thumbnailsSchema.safeParse({ version: 1, thumbnails: [ok, ok] }).success).toBe(false);
  });
});
