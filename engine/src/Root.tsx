import { Composition } from 'remotion';
import { TestScene, TEST_SCENE_SECONDS } from './compositions/TestScene';
import {
  LOOK_TEST_PLACEHOLDER,
  LookTest,
  calculateLookTestMetadata,
} from './compositions/LookTest';
import {
  MOON_TAX_PLACEHOLDER,
  MOON_TAX_SHOTS,
  MoonTax,
  calculateMoonTaxMetadata,
} from './compositions/MoonTax';
import { STYLE_MATCH_PLACEHOLDER, StyleMatch } from './compositions/StyleMatch';
import { FaceMatch } from './compositions/FaceMatch';
import {
  LOOK_HEIGHT,
  LOOK_WIDTH,
  LibraryAsset,
  LibraryCatalog,
  LibraryLook,
} from './library/Library';
import {
  CastLineup,
  CharacterSheet,
  LINEUP_SIZE,
  SHEET_PLACEHOLDER,
  SHEET_WIDTH,
  calculateSheetMetadata,
} from './library/CharacterSheet';
import { PREVIEW_SIZE } from './library/previews';
import { Sandbox } from './sandbox/Sandbox';
import {
  ClosingCardVideo,
  Cover,
  calculateClosingMetadata,
  calculateCoverMetadata,
} from './stage/Cover';
import { Poster, calculatePosterMetadata } from './stage/Poster';
import { ERASED_TEST_SECONDS, ErasedTest } from './compositions/ErasedTest';
import { StoryboardVideo, calculateStoryboardMetadata } from './stage/StoryboardVideo';
import { STORYBOARD_PLACEHOLDER } from './stage/placeholder';
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
      <Composition
        id="LookTest"
        component={LookTest}
        durationInFrames={15 * fps}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{ track: LOOK_TEST_PLACEHOLDER, audioSrc: null }}
        calculateMetadata={calculateLookTestMetadata}
      />
      <Composition
        id="MoonTax"
        component={MoonTax}
        durationInFrames={24 * fps}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{ track: MOON_TAX_PLACEHOLDER, audioSrc: null, shotLines: MOON_TAX_SHOTS }}
        calculateMetadata={calculateMoonTaxMetadata}
      />
      {/* Any storyboard as a video. Its size and length come from its props. */}
      <Composition
        id="Storyboard"
        component={StoryboardVideo}
        durationInFrames={30 * fps}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={STORYBOARD_PLACEHOLDER}
        calculateMetadata={calculateStoryboardMetadata}
      />
      {/* The cover picture of a video: one shot held still, with the title on it. */}
      <Composition
        id="Cover"
        component={Cover}
        durationInFrames={1}
        fps={fps}
        width={1920}
        height={1080}
        defaultProps={{
          storyboard: STORYBOARD_PLACEHOLDER.storyboard,
          cards: {},
          size: '16:9',
          shot: 's1a',
          at: 0.6,
          title: STORYBOARD_PLACEHOLDER.storyboard.title,
          layout: 'words',
        }}
        calculateMetadata={calculateCoverMetadata}
      />
      {/* A test for the short films: a line that draws itself, a fading hand, slow acting. */}
      <Composition
        id="ErasedTest"
        component={ErasedTest}
        durationInFrames={ERASED_TEST_SECONDS * fps}
        fps={fps}
        width={1920}
        height={1080}
      />
      {/* A thumbnail: a poster built in layers, not a frame of the video. */}
      <Composition
        id="Poster"
        component={Poster}
        durationInFrames={1}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{
          size: '9:16',
          thumbnail: {
            id: 'placeholder',
            why: 'A placeholder.',
            layers: [],
          },
          cast: [],
          cards: {},
          seed: 1,
        }}
        calculateMetadata={calculatePosterMetadata}
      />
      {/* A page's closing card, as the short clip that ends its videos. */}
      <Composition
        id="ClosingCard"
        component={ClosingCardVideo}
        durationInFrames={3 * fps}
        fps={fps}
        width={1920}
        height={1080}
        defaultProps={{ text: 'Thanks for watching', size: '16:9', seconds: 3 }}
        calculateMetadata={calculateClosingMetadata}
      />
      <Composition
        id="StyleMatch"
        component={StyleMatch}
        durationInFrames={1}
        fps={fps}
        width={1920}
        height={1080}
        defaultProps={STYLE_MATCH_PLACEHOLDER}
      />
      <Composition
        id="FaceMatch"
        component={FaceMatch}
        durationInFrames={1}
        fps={fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="LibraryAsset"
        component={LibraryAsset}
        durationInFrames={1}
        fps={fps}
        width={PREVIEW_SIZE}
        height={PREVIEW_SIZE}
        defaultProps={{ id: 'rig/character' }}
      />
      <Composition
        id="LibraryLook"
        component={LibraryLook}
        durationInFrames={1}
        fps={fps}
        width={LOOK_WIDTH}
        height={LOOK_HEIGHT}
        defaultProps={{ id: 'rig/character' }}
      />
      <Composition
        id="LibraryCatalog"
        component={LibraryCatalog}
        durationInFrames={1}
        fps={fps}
        width={1080}
        height={1920}
        defaultProps={{ page: 1 }}
      />
      <Composition
        id="CharacterSheet"
        component={CharacterSheet}
        durationInFrames={1}
        fps={fps}
        width={SHEET_WIDTH}
        height={1080}
        defaultProps={SHEET_PLACEHOLDER}
        calculateMetadata={calculateSheetMetadata}
      />
      <Composition
        id="CastLineup"
        component={CastLineup}
        durationInFrames={1}
        fps={fps}
        {...LINEUP_SIZE}
        defaultProps={{ cards: [SHEET_PLACEHOLDER.card], names: true }}
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
