import { describe, expect, it } from 'vitest';
import { armLayers } from './layers';

describe('arm layers (Biku, 2026-10-05)', () => {
  it('keeps the classic order on a plain stick body at every turn', () => {
    for (const turn of [0, 0.5, 1]) {
      expect(armLayers(false, turn)).toEqual({ front: 'top', back: 'behind' });
    }
  });

  it('hangs both arms in front of a wide chest seen from the front', () => {
    expect(armLayers(true, 0)).toEqual({ front: 'top', back: 'chest' });
  });

  it('makes the chest agree with a head turned three-quarter', () => {
    // The arm on the side the character faces is the far one: it comes from behind the chest.
    // The other arm is the near one: it hangs in front of the chest.
    for (const turn of [0.25, 0.3, 0.5]) {
      expect(armLayers(true, turn)).toEqual({ front: 'behind', back: 'chest' });
    }
  });

  it('goes back to the classic order in profile', () => {
    expect(armLayers(true, 1)).toEqual({ front: 'top', back: 'behind' });
  });

  it('always puts an arm that covers the face on top', () => {
    expect(armLayers(true, 0.5, true, true)).toEqual({ front: 'top', back: 'top' });
    expect(armLayers(false, 0, false, true)).toEqual({ front: 'top', back: 'top' });
  });
});
