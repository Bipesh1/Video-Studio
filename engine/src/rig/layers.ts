/**
 * Where an arm is drawn: behind the torso, in front of the torso but behind the head, or on
 * top of everything.
 */
export type ArmLayer = 'behind' | 'chest' | 'top';

/** Below this turn a wide body is seen from the front; from here to PROFILE_FROM, three-quarter. */
export const THREE_QUARTER_FROM = 0.25;
export const PROFILE_FROM = 0.75;

/**
 * Which arm passes in front of the chest (Biku, 2026-10-05). The "front" arm is rooted on the
 * side the character faces, the "back" arm on the other side.
 *
 * A plain stick body, or any body in profile, keeps the classic order: back arm behind, front
 * arm on top. A wide costumed body shows its chest, so the order has to agree with the head:
 * - seen from the front, both arms hang beside the chest and in front of it;
 * - in three-quarter view the front arm is the far one, so it comes out from behind the chest,
 *   and the back arm is the near one, so it hangs in front of the chest.
 * An arm whose hand covers the face is always on top.
 */
export function armLayers(
  wide: boolean,
  turn: number,
  frontOver = false,
  backOver = false,
): { front: ArmLayer; back: ArmLayer } {
  const chestShows = wide && turn < PROFILE_FROM;
  const threeQuarter = chestShows && turn >= THREE_QUARTER_FROM;
  return {
    front: frontOver ? 'top' : threeQuarter ? 'behind' : 'top',
    back: backOver ? 'top' : chestShows ? 'chest' : 'behind',
  };
}
