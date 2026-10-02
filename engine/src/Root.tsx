import { Composition } from 'remotion';
import { TestScene, TEST_SCENE_SECONDS } from './compositions/TestScene';
import { tokens } from './tokens';

const fps = tokens.motion.fps;
const durationInFrames = TEST_SCENE_SECONDS * fps;

/**
 * One composition per aspect ratio, as the build plan asks.
 * Phase 0 registers only the test scene used to measure render speed.
 */
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Test916"
        component={TestScene}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{ seed: 4182 }}
      />
      <Composition
        id="Test45"
        component={TestScene}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1080}
        height={1350}
        defaultProps={{ seed: 4182 }}
      />
      <Composition
        id="Test169"
        component={TestScene}
        durationInFrames={durationInFrames}
        fps={fps}
        width={1920}
        height={1080}
        defaultProps={{ seed: 4182 }}
      />
    </>
  );
};
