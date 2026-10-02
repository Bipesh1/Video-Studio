/**
 * Deterministic random number in [0, 1) from a string key.
 * The same key always gives the same number, so renders are repeatable (Part 2, section 3).
 * FNV-1a hash of the key, then one mulberry32 step.
 */
export function seeded(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let t = (h + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
