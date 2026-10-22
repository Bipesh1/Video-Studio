import { flatLayers } from '@studio/shared';
import type { CastMember, Thumbnail } from '@studio/shared';
import { isPlace } from '../backgrounds/places';
import { EXPRESSION_NAMES } from '../face/expressions';
import { ACTIONS } from '../rig/actions';
import { POSES } from '../rig/poses';
import { tokens } from '../tokens';
import { lookFrom } from '../wardrobe/cast';
import { POSTER_EFFECTS } from './Poster';
import { STANDING_PROPS } from './props';

/**
 * What a thumbnail names that the studio does not have, in plain words: nothing is drawn from
 * a poster with a name the builder would have to guess at.
 */
export function posterProblems(thumb: Thumbnail, cast: readonly CastMember[]): string[] {
  const out: string[] = [];
  const poses: readonly string[] = POSES.map((p) => p.id);
  const faces: readonly string[] = EXPRESSION_NAMES;
  const marks: readonly string[] = POSTER_EFFECTS;
  flatLayers(thumb.layers).forEach((layer, i) => {
    const where = `thumbnail "${thumb.id}", layer ${i + 1} (${layer.kind})`;
    if (layer.kind === 'room' || layer.kind === 'panel') {
      if (!isPlace(layer.place)) out.push(`${where}: there is no place "${layer.place}"`);
      if (!(layer.palette in tokens.palettes)) {
        out.push(`${where}: there is no palette "${layer.palette}"`);
      }
    }
    if (layer.kind === 'person' || layer.kind === 'extra') {
      if (!poses.includes(layer.pose) && !(layer.pose in ACTIONS)) {
        out.push(`${where}: there is no pose or move "${layer.pose}"`);
      }
      if (!faces.includes(layer.expression)) {
        out.push(`${where}: there is no expression "${layer.expression}"`);
      }
    }
    if (layer.kind === 'person') {
      if (!cast.some((m) => m.id === layer.character)) {
        out.push(`${where}: "${layer.character}" is not in this video's cast`);
      }
      for (const e of layer.effects) {
        if (!marks.includes(e)) {
          out.push(`${where}: a thumbnail cannot show "${e}" (it can show ${marks.join(', ')})`);
        }
      }
    }
    if (layer.kind === 'thing' && !STANDING_PROPS.includes(layer.prop)) {
      out.push(`${where}: there is no thing "${layer.prop}" that stands in a scene`);
    }
    if (layer.kind === 'crowd') {
      if (!poses.includes(layer.pose)) out.push(`${where}: there is no pose "${layer.pose}"`);
      if (!faces.includes(layer.expression)) {
        out.push(`${where}: there is no expression "${layer.expression}"`);
      }
    }
    if ((layer.kind === 'extra' || layer.kind === 'crowd') && layer.look) {
      try {
        lookFrom(layer.look, 'the figure');
      } catch (e) {
        out.push(`${where}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (layer.kind === 'extra') {
      for (const e of layer.effects) {
        if (!marks.includes(e)) {
          out.push(`${where}: a thumbnail cannot show "${e}" (it can show ${marks.join(', ')})`);
        }
      }
    }
    const paints =
      layer.kind === 'sign' ||
      layer.kind === 'tag' ||
      layer.kind === 'glow' ||
      layer.kind === 'floor' ||
      layer.kind === 'paper'
        ? [layer.paint]
        : layer.kind === 'backdrop'
          ? [layer.inner, layer.outer]
          : [];
    for (const paint of paints) {
      if (!(paint in tokens.accents)) out.push(`${where}: there is no accent "${paint}"`);
    }
  });
  return out;
}
