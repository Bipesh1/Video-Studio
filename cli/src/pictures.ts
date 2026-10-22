import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { picturesOnly } from '@studio/shared';

/**
 * The fingerprint of a part's pictures: its storyboard with everything only heard left out
 * (picturesOnly). Two plans with the same one make the same pictures, so a change of sound alone
 * is put on the finished video in minutes (--resound) instead of drawing every frame again.
 */
export function picturesSha(storyboardFile: string): string {
  const plan: unknown = JSON.parse(readFileSync(storyboardFile, 'utf8'));
  return createHash('sha256')
    .update(JSON.stringify(picturesOnly(plan)))
    .digest('hex')
    .slice(0, 16);
}
