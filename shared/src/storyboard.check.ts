import type { CharacterCard } from './character.schema';
import type { LibraryIndex } from './library.schema';
import { CHAPTER_MAX_S } from './plugins.schema';
import type { Brand, Format, VoiceProfile } from './plugins.schema';
import { estimateSeconds } from './storyboard.schema';
import type { Look, Scene, Storyboard } from './storyboard.schema';

/**
 * Checks a storyboard against the world it has to live in: the library (does that pose, place
 * or prop exist?), the plug-ins (that format, brand and voice) and the saved characters.
 * The shape of the file is checked by `storyboardSchema`; this checks what its names mean.
 *
 * Problems must be fixed before any stage runs. Notes are things to know, not faults.
 */

export type World = {
  library: LibraryIndex;
  formats: Record<string, Format>;
  brands: Record<string, Brand>;
  voices: Record<string, VoiceProfile>;
  characters: Record<string, CharacterCard>;
};

export type StoryboardReport = {
  problems: string[];
  notes: string[];
  /** Spoken seconds of each chapter: measured when the shots have times, estimated before. */
  chapters: Array<{ chapter: number; seconds: number; measured: boolean; scenes: string[] }>;
  seconds: number;
  /** Everything the storyboard asks the library for, as library ids. */
  needs: string[];
};

const EM_DASH = '—';

function sceneSeconds(
  scene: Scene,
  format: Format | undefined,
): { seconds: number; measured: boolean } {
  const first = scene.shots[0];
  const last = scene.shots[scene.shots.length - 1];
  if (first?.startMs !== undefined && last?.endMs !== undefined) {
    return { seconds: (last.endMs - first.startMs) / 1000, measured: true };
  }
  const pause = format?.pacing.pauseMs.normal ?? 500;
  const seconds = scene.lines.reduce(
    (sum, l) => sum + estimateSeconds(l.text) / (l.speed ?? 1) + (l.pauseAfterMs ?? pause) / 1000,
    0,
  );
  return { seconds, measured: false };
}

export function checkStoryboard(sb: Storyboard, world: World): StoryboardReport {
  const problems: string[] = [];
  const notes: string[] = [];
  const needs = new Set<string>();
  const ids = new Set(world.library.assets.map((a) => a.id));
  const colors = new Set([
    'white',
    ...world.library.assets.filter((a) => a.kind === 'color').map((a) => a.id.slice(6)),
  ]);

  /** Record that the storyboard needs a library piece, and complain once if it is missing. */
  const need = (kind: string, name: string, where: string) => {
    const id = `${kind}/${name}`;
    if (!ids.has(id) && !needs.has(id)) {
      problems.push(
        `${where}: the library has no ${kind} called "${name}". Search with: npm run library -- search ${name.replace(/-/g, ' ')} --kind=${kind}`,
      );
    }
    needs.add(id);
  };
  const cloth = (name: string, where: string) => {
    if (!colors.has(name)) problems.push(`${where}: there is no cloth color called "${name}"`);
  };

  // ---- plug-ins
  if (sb.style !== world.library.style) {
    problems.push(`the style "${sb.style}" is not the library's style ("${world.library.style}")`);
  }
  const format = world.formats[sb.format];
  if (!format)
    problems.push(`there is no format called "${sb.format}" (formats/${sb.format}.json)`);
  const brand = world.brands[sb.brand];
  if (!brand) problems.push(`there is no brand called "${sb.brand}" (brands/${sb.brand}.json)`);
  const voice = (id: string, where: string) => {
    if (!world.voices[id])
      problems.push(`${where}: there is no voice called "${id}" (voices/${id}.json)`);
  };
  voice(sb.voice, 'the narrator');

  // ---- cast
  const look = (l: Look, where: string) => {
    if (l.identity) {
      need('skin', `tone-${l.identity.skinTone}`, where);
      need('hair', l.identity.hair, where);
      need('hair-color', l.identity.hairColor, where);
      if (l.identity.facialHair) need('facial-hair', l.identity.facialHair, where);
      if (l.identity.wrap) cloth(l.identity.wrap, where);
    }
    if (l.outfit && 'costume' in l.outfit) need('costume', l.outfit.costume, where);
    if (l.outfit && 'clothes' in l.outfit) {
      for (const piece of Object.values(l.outfit.clothes)) {
        if (!piece) continue;
        if ('kind' in piece) need('clothing', piece.kind, where);
        else {
          need('clothing', 'cloak', where);
          if (piece.hood) need('clothing', 'hood', where);
        }
        cloth(piece.cloth, where);
      }
    }
    if (l.eyeStyle === 'stern') need('eyes', 'stern', where);
    if (l.age) need('age', l.age, where);
  };
  const speakers = new Set(sb.scenes.flatMap((s) => s.lines.map((l) => l.speaker)));
  const seenOnScreen = new Set(
    sb.scenes.flatMap((s) => s.shots.flatMap((sh) => sh.actors.map((a) => a.character))),
  );
  for (const member of sb.cast) {
    const where = `cast member "${member.id}"`;
    let cardVoice: string | undefined;
    if (member.card) {
      const card = world.characters[member.card];
      if (!card)
        problems.push(
          `${where}: there is no saved character "${member.card}" (characters/${member.card}.json)`,
        );
      else {
        look(card, where);
        need('expression', card.expression, where);
        cardVoice = card.voice;
      }
    }
    if (member.look) look(member.look, where);
    const spoken = member.voice ?? cardVoice;
    if (spoken) voice(spoken, where);
    else if (speakers.has(member.id)) problems.push(`${where} speaks but has no voice`);
    if (!seenOnScreen.has(member.id) && !speakers.has(member.id)) {
      notes.push(`${where} is never seen or heard`);
    }
  }

  // ---- scenes and shots
  const beatOrder = format ? format.structure.map((b) => b.id) : [];
  let beatAt = 0;
  const usedBeats = new Set<string>();
  for (const scene of sb.scenes) {
    const where = `scene "${scene.id}"`;
    need('place', scene.place, where);
    need('palette', scene.palette, where);
    need('background', scene.treatment, where);
    need('music', scene.mood, where);
    if (format) {
      const index = beatOrder.indexOf(scene.beat);
      if (index === -1) {
        problems.push(
          `${where}: the ${format.id} format has no beat called "${scene.beat}" (its beats: ${beatOrder.join(', ')})`,
        );
      } else {
        if (index < beatAt)
          problems.push(
            `${where}: the beat "${scene.beat}" comes after a later beat; the ${format.id} format goes ${beatOrder.join(', ')}`,
          );
        beatAt = Math.max(beatAt, index);
        usedBeats.add(scene.beat);
      }
    }
    for (const line of scene.lines) {
      if (line.text.includes(EM_DASH)) {
        if (sb.mode === 'as-is') {
          notes.push(
            `line "${line.id}" has an em dash; the words stay as written, and the captions show a comma there`,
          );
        } else {
          problems.push(`line "${line.id}" has an em dash; viewer text must not (ground rule 14)`);
        }
      }
    }
    for (const shot of scene.shots) {
      const at = `shot "${shot.id}"`;
      need('camera', shot.camera.framing, at);
      if (shot.camera.move !== 'none') need('camera', shot.camera.move, at);
      if (shot.transition === 'fade') need('camera', 'fade', at);
      if (shot.overlay) need('overlay', shot.overlay.kind === 'title' ? 'title-card' : 'label', at);
      for (const actor of shot.actors) {
        if (actor.pose) need('pose', actor.pose, at);
        if (actor.action) need('action', actor.action, at);
        need('expression', actor.expression, at);
        if (actor.holds) need('prop', actor.holds, at);
      }
      for (const prop of shot.props) need('prop', prop.prop, at);
      for (const effect of shot.effects) need('effect', effect.effect, at);
      for (const sound of shot.sfx) need('sfx', sound.name, at);
      if (shot.startMs !== undefined && shot.endMs !== undefined && format) {
        const seconds = (shot.endMs - shot.startMs) / 1000;
        if (seconds > format.shotLength.max + 0.25) {
          problems.push(
            `${at} stays on screen ${seconds.toFixed(1)} s; the ${format.id} format allows ${format.shotLength.max} s. Split it.`,
          );
        } else if (seconds < format.shotLength.min - 0.25) {
          notes.push(`${at} is only ${seconds.toFixed(1)} s long`);
        }
      }
    }
    if (shotsNeedFace(scene)) notes.push(`${where} has no character in any shot`);
  }
  if (format) {
    for (const beat of format.structure) {
      if (!beat.optional && !usedBeats.has(beat.id)) {
        problems.push(`no scene plays the "${beat.id}" beat, which the ${format.id} format needs`);
      }
    }
    if (format.factRules.sourcesRequired && sb.sources.length === 0) {
      problems.push(
        `the ${format.id} format needs its facts traced to sources, and the storyboard lists none`,
      );
    }
  }

  // ---- lengths: the whole video, and each chapter
  const chapters: StoryboardReport['chapters'] = [];
  for (const scene of sb.scenes) {
    const { seconds, measured } = sceneSeconds(scene, format);
    const last = chapters[chapters.length - 1];
    if (last && last.chapter === scene.chapter) {
      last.seconds += seconds;
      last.measured = last.measured && measured;
      last.scenes.push(scene.id);
    } else {
      chapters.push({ chapter: scene.chapter, seconds, measured, scenes: [scene.id] });
    }
  }
  const total = chapters.reduce((sum, c) => sum + c.seconds, 0);
  for (const c of chapters) {
    c.seconds = Math.round(c.seconds * 10) / 10;
    const about = c.measured ? '' : 'about ';
    if (c.seconds > CHAPTER_MAX_S + (c.measured ? 0.5 : 4)) {
      problems.push(
        `chapter ${c.chapter} runs ${about}${c.seconds} s; a chapter is at most ${CHAPTER_MAX_S} s. Move a scene to the next chapter.`,
      );
    }
  }
  if (format) {
    const measured = chapters.every((c) => c.measured);
    const about = measured ? '' : 'about ';
    const slack = measured ? 1 : 6;
    if (total > format.lengthRange.max + slack) {
      problems.push(
        `the video runs ${about}${total.toFixed(0)} s; the ${format.id} format allows up to ${format.lengthRange.max} s`,
      );
    } else if (total < format.lengthRange.min - slack) {
      problems.push(
        `the video runs ${about}${total.toFixed(0)} s; the ${format.id} format needs at least ${format.lengthRange.min} s`,
      );
    }
  }

  return {
    problems,
    notes,
    chapters,
    seconds: Math.round(total * 10) / 10,
    needs: [...needs].sort(),
  };
}

/** True when a scene shows nobody at all: allowed (a title, a place), but worth a note. */
function shotsNeedFace(scene: Scene): boolean {
  return scene.shots.every((s) => s.actors.length === 0);
}
