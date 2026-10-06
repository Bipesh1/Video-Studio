import type { CharacterCard, Storyboard } from '@studio/shared';
import { isPlace } from '../backgrounds/places';
import { EXPRESSIONS } from '../face/expressions';
import { ACTIONS } from '../rig/actions';
import { POSES } from '../rig/poses';
import { tokens } from '../tokens';
import { lookFrom } from '../wardrobe/cast';
import { HELD_PROPS, STANDING_PROPS } from './props';
import { HEAD_EFFECTS } from './names';

/**
 * Can the engine build this storyboard as it stands? The library check says a piece exists;
 * this says the storyboard builder knows how to put it on screen. Most of the library is
 * covered. What is not (an impact flash, motion lines, a prop the builder cannot hold or
 * stand) is named here before any frame is drawn, instead of quietly going missing.
 */
export function unbuildable(sb: Storyboard, cards: Record<string, CharacterCard>): string[] {
  const out = new Set<string>();
  const poses = new Set<string>(POSES.map((p) => p.id));
  for (const member of sb.cast) {
    try {
      lookFrom(member.card ? (cards[member.card] ?? {}) : (member.look ?? {}), member.id);
    } catch (err) {
      out.add((err as Error).message);
    }
  }
  for (const scene of sb.scenes) {
    if (!isPlace(scene.place)) out.add(`the builder has no place called "${scene.place}"`);
    if (!(scene.palette in tokens.palettes))
      out.add(`the style has no colors called "${scene.palette}"`);
    for (const shot of scene.shots) {
      for (const actor of shot.actors) {
        if (actor.pose && !poses.has(actor.pose))
          out.add(`the builder has no pose called "${actor.pose}"`);
        if (actor.action && !(actor.action in ACTIONS))
          out.add(`the builder has no action called "${actor.action}"`);
        if (!(actor.expression in EXPRESSIONS))
          out.add(`the builder has no expression called "${actor.expression}"`);
        if (actor.holds && !HELD_PROPS.includes(actor.holds)) {
          out.add(`the builder cannot put the prop "${actor.holds}" in a hand yet`);
        }
      }
      for (const prop of shot.props) {
        if (!STANDING_PROPS.includes(prop.prop))
          out.add(`the builder cannot stand the prop "${prop.prop}" in a scene yet`);
      }
      for (const effect of shot.effects) {
        if (!HEAD_EFFECTS.includes(effect.effect))
          out.add(`the builder cannot show the effect "${effect.effect}" yet`);
      }
    }
  }
  return [...out];
}
