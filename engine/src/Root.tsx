import { Composition } from 'remotion';
import { TestScene, TEST_SCENE_SECONDS } from './compositions/TestScene';
import { Sandbox } from './sandbox/Sandbox';
import { BACKGROUNDS, STILL_SHEETS, VIDEO_SHEETS, stillId, videoId } from './sandbox/sheets';
import type { VideoSheet } from './sandbox/sheets';
import { tokens } from './tokens';

const fps = tokens.motion.fps;
const durationInFrames = TEST_SCENE_SECONDS * fps;

/**
 * One composition per aspect ratio, as the build plan asks, plus the sandbox
 * compositions used to draw and check single assets.
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
      {STILL_SHEETS.flatMap((sheet) =>
        BACKGROUNDS.map((bg) => (
          <Composition
            key={stillId(sheet, bg)}
            id={stillId(sheet, bg)}
            component={Sandbox}
            durationInFrames={1}
            fps={fps}
            width={1080}
            height={1920}
            defaultProps={{ sheet, bg }}
          />
        )),
      )}
      {(Object.keys(VIDEO_SHEETS) as VideoSheet[]).map((sheet) => (
        <Composition
          key={videoId(sheet)}
          id={videoId(sheet)}
          component={Sandbox}
          durationInFrames={VIDEO_SHEETS[sheet] * fps}
          fps={fps}
          width={1080}
          height={1920}
          defaultProps={{ sheet, bg: 'dark' as const }}
        />
      ))}
    </>
  );
};
