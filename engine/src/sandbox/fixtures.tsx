import type { CharacterProps } from '../rig/Character';
import { DEG, vec } from '../rig/math';
import { Block } from './Block';
import { Rod } from './Rod';

/**
 * Test fixtures only: plain stand-ins for the things an action needs in the hands, so the
 * action reads on a sheet or a library picture. Real props come from engine/src/props.
 */
type Prop = NonNullable<CharacterProps['prop']>;

/** A club or sword stand-in for the swing, held near one end so most of it is past the thumb. */
export const clubProp: Prop = (hands) => {
  const f = hands.front;
  if (f.hand.shape !== 'grip') return null;
  const axis = (f.hand.gripAxis ?? 90 - f.forearm) * DEG;
  const center = vec(f.center.x + 0.5 * Math.cos(axis), f.center.y + 0.5 * Math.sin(axis));
  return <Rod frame={{ ...f, center }} length={1.5} />;
};

/** A long pole through both fists, standing in for the rope of a pull. */
export const ropeProp: Prop = (hands) => <Rod frame={hands.front} length={2.3} />;

/** A crate held in both arms. */
export const crateProp: Prop = (hands) => (
  <Block
    x={(hands.front.center.x + hands.back.center.x) / 2 + 0.2}
    y={(hands.front.center.y + hands.back.center.y) / 2 - 0.16}
    width={0.78}
    height={0.62}
    paint="tan"
  />
);

/** Something heavy to push, standing on the ground in front of the hands. */
export const boulderProp: Prop = (hands) => (
  <Block x={hands.front.center.x + 0.62} y={-0.72} width={1.1} height={1.44} paint="brown" />
);
