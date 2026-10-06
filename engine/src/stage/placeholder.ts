import { storyboardSchema } from '@studio/shared';
import fixture from '../../../shared/src/fixtures/moon-tax.storyboard.json';
import type { StoryboardVideoProps } from './StoryboardVideo';

/** What the Storyboard composition shows in the Remotion studio when no run is loaded. */
export const STORYBOARD_PLACEHOLDER: StoryboardVideoProps = {
  storyboard: storyboardSchema.parse(fixture),
  track: null,
  audioSrc: null,
  size: '9:16',
  cards: {},
};
