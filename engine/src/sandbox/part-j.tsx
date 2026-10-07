import { Background } from '../backgrounds/Background';
import { PLACES, placeSpec } from '../backgrounds/places';
import type { PlaceName } from '../backgrounds/places';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { resolvePose } from '../rig/pose';
import { stand } from '../rig/poses';
import { FARMER } from '../wardrobe/costumes/farmer';
import { QUEEN } from '../wardrobe/costumes/queen';
import { RULER } from '../wardrobe/costumes/ruler';
import { SOLDIER } from '../wardrobe/costumes/soldier';
import { outfitFrom } from '../wardrobe/garments';
import { Label } from './Sandbox';
import type { Colors } from './Sandbox';

/**
 * Phase 2E sandbox sheet: every place as a small whole frame with two people standing in it,
 * so the size of the scenery against a person, the depth and the mood can all be judged.
 */

const W = 1080;
const H = 1920;
const SEED = 3105;

const VILLAGER = outfitFrom({
  onePiece: { kind: 'dress', cloth: 'cream' },
  shoes: { kind: 'boots', cloth: 'brown' },
});

type Person = {
  outfit: CharacterProps['outfit'];
  face: ExpressionName;
  extra?: Partial<CharacterProps>;
};

/** Who stands in each place: people who belong there. */
const CAST: Partial<Record<PlaceName, [Person, Person]>> = {
  'night-street': [
    { outfit: SOLDIER, face: 'determined' },
    { outfit: FARMER, face: 'afraid' },
  ],
  'day-street': [
    { outfit: FARMER, face: 'happy' },
    {
      outfit: VILLAGER,
      face: 'happy',
      extra: { identity: { skinTone: 3, hair: 'bun', hairColor: 'black' } },
    },
  ],
  field: [
    { outfit: FARMER, face: 'exhausted' },
    {
      outfit: VILLAGER,
      face: 'neutral',
      extra: { identity: { skinTone: 5, hair: 'braids', hairColor: 'black' } },
    },
  ],
  forest: [
    { outfit: FARMER, face: 'afraid' },
    { outfit: SOLDIER, face: 'determined' },
  ],
  castle: [
    { outfit: RULER, face: 'smug' },
    { outfit: SOLDIER, face: 'neutral' },
  ],
  'throne-room': [
    { outfit: RULER, face: 'angry' },
    { outfit: QUEEN, face: 'smug' },
  ],
  'home-interior': [
    {
      outfit: VILLAGER,
      face: 'happy',
      extra: { age: 'elder', identity: { skinTone: 2, hair: 'bun', hairColor: 'gray' } },
    },
    { outfit: FARMER, face: 'happy' },
  ],
};

export function PlacesSheet({ c }: { c: Colors }) {
  const names = (Object.keys(PLACES) as PlaceName[]).filter((name) => CAST[name]);
  const cols = 3;
  const cw = W / cols;
  const ch = cw * (H / W);
  const head = 190;
  return (
    <>
      {names.map((name, i) => {
        const spec = placeSpec(name, SEED);
        const groundY = spec.horizon * H + 70;
        const left = cw * (i % cols);
        const top = (ch + 0) * Math.floor(i / cols);
        return (
          <g key={name}>
            <svg x={left + 4} y={top + 4} width={cw - 8} height={ch - 8} viewBox={`0 0 ${W} ${H}`}>
              <Background spec={spec} width={W} height={H} frame={0} fps={30} />
              {(CAST[name] ?? []).map((p, k) => (
                <Character
                  key={k}
                  x={k === 0 ? 330 : 760}
                  groundY={groundY}
                  head={head}
                  facing={k === 0 ? 'right' : 'left'}
                  pose={resolvePose(stand)}
                  face={EXPRESSIONS[p.face]}
                  turn={0.5}
                  {...(p.outfit ? { outfit: p.outfit } : {})}
                  {...p.extra}
                />
              ))}
            </svg>
            <rect
              x={left + 4}
              y={top + ch - 62}
              width={cw - 8}
              height={54}
              fill={c.base}
              opacity={0.82}
            />
            <Label x={left + cw / 2} y={top + ch - 26} c={c}>
              {name}
            </Label>
          </g>
        );
      })}
    </>
  );
}
