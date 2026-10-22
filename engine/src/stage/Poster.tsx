import { FPS, SIZES, graphicSteps } from '@studio/shared';
import type {
  CastMember,
  CharacterCard,
  FlatPosterLayer,
  PosterLayer,
  SizeName,
  Thumbnail,
} from '@studio/shared';
import type { ReactNode } from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { Background } from '../backgrounds/Background';
import { ExplainerGraphic, PAGE_COLOUR } from '../explainer/Graphic';
import { Headline, Icon, Mark, colourOf } from '../explainer/ThumbParts';
import { isPlace, sceneBackground } from '../backgrounds/places';
import { BANK_HALF, SmokeBank } from '../effects/Blast';
import { RestingSweat } from '../effects/Sweat';
import { TearStreams } from '../effects/Tears';
import { DollarEyes, ShockLines } from '../effects/Reaction';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { Pointer } from '../overlays/Explain';
import { VIEWER_FONT, fitSize, textWidth, viewerText } from '../overlays/text';
import { Character, toLocal, toScreen } from '../rig/Character';
import { lerp } from '../rig/math';
import { resolvePose } from '../rig/pose';
import { ACTIONS } from '../rig/actions';
import { movePose } from '../rig/chain';
import { poseById } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import { accent, ink, lineWeights, luminance, mix, tokens, white } from '../tokens';
import { lookFrom } from '../wardrobe/cast';
import { StandingProp } from './props';

/**
 * A thumbnail: a poster built in layers from the back to the front (contract and the reason in
 * shared/src/thumbnail.schema.ts). Every layer is drawn with what the video itself is drawn
 * with: the same people, the same rooms and things, the same smoke, the same lettering. What is
 * the poster's own is that each one is placed and sized freely, so the one the picture is
 * about can be large in front with the rest of it behind and around them.
 */

/**
 * What a plain figure of a poster wears when nothing is said: a grey suit, like the row at the
 * back of the room (Biku, 2026-10-14: "make all these guys who actually appear in there all
 * wear clothes").
 */
const PLAIN_CLOTHES = {
  outfit: {
    clothes: {
      top: { kind: 'jacket' as const, cloth: 'steel', under: 'white' },
      bottom: { kind: 'trousers' as const, cloth: 'steel' },
      shoes: { kind: 'boots' as const, cloth: 'steel' },
    },
  },
};

export type PosterProps = {
  size: SizeName;
  thumbnail: Thumbnail;
  cast: readonly CastMember[];
  cards: Record<string, CharacterCard>;
  seed: number;
};

export const calculatePosterMetadata: CalculateMetadataFunction<PosterProps> = ({ props }) => ({
  ...SIZES[props.size],
  fps: FPS,
  durationInFrames: 1,
});

/** The marks a poster can put round a head. A still has no time, so they are the resting ones. */
export const POSTER_EFFECTS = [
  'sweat-resting',
  'tear-streams',
  'dollar-eyes',
  'shock-lines',
] as const;

const font = `${VIEWER_FONT}, sans-serif`;
type Body = Extract<FlatPosterLayer, { kind: 'person' | 'extra' }>;
type Key = number | string;

/** A number between 0 and 1 that is always the same for the same two numbers. */
const scatter = (seed: number, n: number): number => {
  const x = Math.sin(seed * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Where a body stands so that the middle of its head is where the layer says. */
function placeBody(layer: Body, width: number, height: number) {
  const moves: Record<string, ((time: number) => ReturnType<typeof resolvePose>) | undefined> =
    ACTIONS;
  // A move is caught at one moment and stood where it is asked for, not where it had got to.
  const moving = moves[layer.pose]?.(layer.moment);
  const pose = moving ? movePose(moving, -moving.rootX) : resolvePose(poseById(layer.pose));
  const head = layer.head * height;
  const joints = computeSkeleton(pose);
  const sign = layer.facing === 'left' ? -1 : 1;
  const at = {
    x: layer.x * width - joints.head.x * head * sign,
    groundY:
      layer.ground === undefined ? layer.y * height - joints.head.y * head : layer.ground * height,
    head,
    facing: layer.facing,
  } as const;
  const eyes = layer.looksAt
    ? { lookAt: toLocal({ x: layer.looksAt.x * width, y: layer.looksAt.y * height }, at) }
    : {};
  return { pose, joints, at, eyes };
}

function Words({
  layer,
  width,
  height,
}: {
  layer: Extract<PosterLayer, { kind: 'words' }>;
  width: number;
  height: number;
}) {
  const marked = layer.lines.map(viewerText);
  const lines = marked.map((l) => l.replace(/\*/g, ''));
  // Capitals are wider than the letters the fit is measured in: words set in them get less room.
  const capitals = lines.some((l) => /[A-Z]/.test(l) && l === l.toUpperCase());
  const room = width * layer.width * (capitals ? 0.8 : 1);
  const cap = layer.size * height;
  const together = fitSize(lines, cap, room);
  const sizes = lines.map((line) => (layer.justify ? fitSize([line], cap, room) : together));
  const x = layer.x * width;
  const bottom = layer.bottom * height;
  // Each line stands on the one under it, by that line's own height.
  const baselines = sizes.map((_, i) =>
    sizes.slice(i + 1).reduce((y, size) => y - size * 1.04, bottom),
  );
  const top = (baselines[0] ?? bottom) - (sizes[0] ?? 0) * 0.75;
  const middle = (top + bottom) / 2;
  return (
    <g transform={`rotate(${-layer.tilt} ${x} ${middle})`}>
      {lines.map((line, i) => {
        const size = sizes[i] ?? together;
        return (
          <text
            key={i}
            x={x}
            y={baselines[i]}
            textAnchor="middle"
            fontFamily={font}
            fontWeight={700}
            fontSize={size}
            stroke={tokens.captions.stroke}
            strokeWidth={size * 0.2}
            strokeLinejoin={tokens.line.join}
            paintOrder="stroke"
          >
            {(marked[i] ?? line).split(' ').map((word, k) => (
              <tspan
                key={k}
                fill={
                  layer.gold.includes(i) || /^\*.*\*[.,!?]?$/.test(word)
                    ? tokens.captions.emphasis
                    : tokens.captions.fill
                }
              >
                {`${k === 0 ? '' : ' '}${word.replace(/\*/g, '')}`}
              </tspan>
            ))}
          </text>
        );
      })}
    </g>
  );
}

/**
 * Depth by value: a figure further back keeps this much of its light. It is darkened in itself
 * and stays solid, so it reads as a grey figure on a coloured backdrop and not as a ghost.
 */
function Dimmed({ id, light, children }: { id: string; light: number; children: ReactNode }) {
  if (light >= 1) return <>{children}</>;
  return (
    <>
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feColorMatrix
            type="matrix"
            values={`${light} 0 0 0 0  0 ${light} 0 0 0  0 0 ${light} 0 0  0 0 0 1 0`}
          />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>{children}</g>
    </>
  );
}

/** The layers of a poster, drawn into a picture of the given size: a thumbnail, or a picture shot. */
export function PosterLayers({
  layers,
  cast,
  cards,
  seed,
  width,
  height,
  fps,
}: {
  layers: readonly PosterLayer[];
  cast: readonly CastMember[];
  cards: Record<string, CharacterCard>;
  seed: number;
  width: number;
  height: number;
  fps: number;
}) {
  const marksOf = (effects: readonly string[], turn: number): ReactNode => (
    <>
      {effects.includes('sweat-resting') && <RestingSweat />}
      {effects.includes('tear-streams') && <TearStreams turn={turn} t={0.6} />}
      {effects.includes('dollar-eyes') && <DollarEyes turn={turn} />}
      {effects.includes('shock-lines') && <ShockLines />}
    </>
  );
  /** A body, darkened by its distance, with a pale edge when it is asked for. */
  const figure = (layer: Body, look: ReturnType<typeof lookFrom> | undefined, i: Key) => {
    const { pose, joints, at, eyes } = placeBody(layer, width, height);
    const edge = `poster-edge-${i}`;
    const drawn = (
      <Dimmed id={`poster-dim-${i}`} light={layer.light}>
        {layer.outline > 0 && (
          <defs>
            {/* The shape grown outward and painted pale, under the shape itself. */}
            <filter id={edge} x="-30%" y="-30%" width="160%" height="160%">
              <feMorphology
                in="SourceAlpha"
                operator="dilate"
                radius={layer.outline * at.head}
                result="grown"
              />
              <feFlood floodColor={white} />
              <feComposite in2="grown" operator="in" result="edge" />
              <feMerge>
                <feMergeNode in="edge" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}
        <g {...(layer.outline > 0 ? { filter: `url(#${edge})` } : {})}>
          <Character
            {...at}
            pose={pose}
            face={EXPRESSIONS[layer.expression as ExpressionName] ?? EXPRESSIONS.neutral}
            turn={layer.turn}
            {...eyes}
            {...(look ?? {})}
            headEffects={marksOf(layer.effects, layer.turn)}
          />
        </g>
      </Dimmed>
    );
    return { drawn, joints, at };
  };
  const draw = (layer: PosterLayer, i: Key): ReactNode => {
    switch (layer.kind) {
      case 'room': {
        if (!isPlace(layer.place)) return null;
        const spec = sceneBackground(layer.place, layer.treatment, layer.palette, seed);
        return <Background key={i} spec={spec} width={width} height={height} frame={0} fps={fps} />;
      }
      case 'person': {
        const member = cast.find((m) => m.id === layer.character);
        const look = member
          ? lookFrom(member.card ? (cards[member.card] ?? {}) : (member.look ?? {}), member.id)
          : undefined;
        return <g key={i}>{figure(layer, look, i).drawn}</g>;
      }
      case 'split': {
        // The line leans: its top is further right than its bottom by `lean` of the width.
        const top = (layer.at + layer.lean / 2) * width;
        const bottom = (layer.at - layer.lean / 2) * width;
        const id = `poster-split-${i}`;
        return (
          <g key={i}>
            <defs>
              <clipPath id={`${id}-l`}>
                <path d={`M 0 0 L ${top} 0 L ${bottom} ${height} L 0 ${height} Z`} />
              </clipPath>
              <clipPath id={`${id}-r`}>
                <path d={`M ${top} 0 L ${width} 0 L ${width} ${height} L ${bottom} ${height} Z`} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}-l)`}>{layer.left.map((l, k) => draw(l, `${i}l${k}`))}</g>
            <g clipPath={`url(#${id}-r)`}>{layer.right.map((l, k) => draw(l, `${i}r${k}`))}</g>
            {layer.seam > 0 && (
              <line
                x1={top}
                y1={0}
                x2={bottom}
                y2={height}
                stroke={white}
                strokeWidth={layer.seam * height}
              />
            )}
          </g>
        );
      }
      case 'rain': {
        const length = height * 0.055;
        const tone = accent('glint')[0] ?? white;
        return (
          <g
            key={i}
            opacity={layer.light}
            stroke={tone}
            strokeWidth={height * 0.0035}
            strokeLinecap="round"
          >
            {Array.from({ length: layer.count }, (_, k) => {
              const x = scatter(layer.seed, k) * width * 1.2 - width * 0.1;
              const y = scatter(layer.seed + 7, k) * height;
              const long = length * (0.6 + 0.8 * scatter(layer.seed + 13, k));
              return <line key={k} x1={x} y1={y} x2={x - long * layer.slant} y2={y + long} />;
            })}
          </g>
        );
      }
      case 'floor': {
        const y = layer.y * height;
        return (
          <g key={i}>
            <rect
              x={0}
              y={y}
              width={width}
              height={height - y}
              fill={mix(accent(layer.paint).at(-1) ?? ink, ink, layer.deep)}
            />
            <line x1={0} y1={y} x2={width} y2={y} stroke={ink} strokeWidth={height * 0.004} />
          </g>
        );
      }
      case 'paper': {
        const lines = layer.lines.map(viewerText);
        const size = layer.size * height;
        const longest = Math.max(...lines.map((l) => textWidth(l, size) * 1.15));
        const w = longest + size * 1.1;
        const h = lines.length * size * 1.15 + size * 0.9;
        const x = layer.x * width;
        const y = layer.y * height;
        const sheet = accent('cream');
        const fold = size * 0.5;
        return (
          <g key={i} transform={`rotate(${-layer.tilt} ${x} ${y})`}>
            {/* A sheet with one corner turned up, held by two bits of tape. */}
            <path
              d={`M ${x - w / 2} ${y - h / 2} H ${x + w / 2} V ${y + h / 2 - fold} L ${x + w / 2 - fold} ${y + h / 2} H ${x - w / 2} Z`}
              fill={sheet[0]}
              stroke={ink}
              strokeWidth={size * 0.09}
              strokeLinejoin={tokens.line.join}
            />
            <path
              d={`M ${x + w / 2} ${y + h / 2 - fold} H ${x + w / 2 - fold} V ${y + h / 2} Z`}
              fill={sheet[1]}
              stroke={ink}
              strokeWidth={size * 0.07}
              strokeLinejoin={tokens.line.join}
            />
            {[-1, 1].map((side) => (
              <rect
                key={side}
                x={x + side * (w / 2 - size * 0.55) - size * 0.32}
                y={y - h / 2 - size * 0.16}
                width={size * 0.64}
                height={size * 0.3}
                fill={accent('glint')[0]}
                opacity={0.85}
                transform={`rotate(${side * 14} ${x + side * (w / 2 - size * 0.55)} ${y - h / 2})`}
              />
            ))}
            {lines.map((line, k) => (
              <text
                key={k}
                x={x}
                y={y - h / 2 + size * 1.25 + k * size * 1.15}
                textAnchor="middle"
                fontFamily={font}
                fontWeight={700}
                fontSize={size}
                fill={accent(layer.paint)[0]}
              >
                {line}
              </text>
            ))}
          </g>
        );
      }
      case 'backdrop': {
        const id = `poster-backdrop-${i}`;
        const cx = layer.at.x * width;
        const cy = layer.at.y * height;
        const reach = Math.hypot(width, height);
        const bright = accent(layer.inner)[0] ?? ink;
        const dark = mix(accent(layer.outer).at(-1) ?? ink, ink, layer.deep);
        const wedge = layer.rays > 0 ? (2 * Math.PI) / layer.rays : 0;
        return (
          <g key={i}>
            <defs>
              <radialGradient
                id={id}
                gradientUnits="userSpaceOnUse"
                cx={cx}
                cy={cy}
                r={reach * 0.62}
              >
                <stop offset="0" stopColor={bright} />
                <stop offset="0.45" stopColor={accent(layer.outer)[0] ?? ink} />
                <stop offset="1" stopColor={dark} />
              </radialGradient>
              <radialGradient
                id={`${id}-ray`}
                gradientUnits="userSpaceOnUse"
                cx={cx}
                cy={cy}
                r={reach * 0.7}
              >
                <stop offset="0" stopColor={white} stopOpacity={0.22} />
                <stop offset="1" stopColor={white} stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect width={width} height={height} fill={`url(#${id})`} />
            {Array.from({ length: layer.rays }, (_, k) => {
              const a = k * wedge;
              const b = a + wedge * 0.5;
              const p = (t: number) => `${cx + Math.cos(t) * reach} ${cy + Math.sin(t) * reach}`;
              return (
                <path key={k} d={`M ${cx} ${cy} L ${p(a)} L ${p(b)} Z`} fill={`url(#${id}-ray)`} />
              );
            })}
          </g>
        );
      }
      case 'glow': {
        const id = `poster-glow-${i}`;
        const tone = accent(layer.paint)[0] ?? white;
        return (
          <g key={i}>
            <defs>
              <radialGradient id={id}>
                <stop offset="0" stopColor={tone} stopOpacity={layer.strength} />
                <stop offset="1" stopColor={tone} stopOpacity={0} />
              </radialGradient>
            </defs>
            <circle
              cx={layer.at.x * width}
              cy={layer.at.y * height}
              r={layer.radius * height}
              fill={`url(#${id})`}
            />
          </g>
        );
      }
      case 'extra': {
        const look = lookFrom(layer.look ?? PLAIN_CLOTHES, 'figure');
        const { drawn, joints, at } = figure(layer, look, i);
        // A badge sits on the chest, well under the chin, on the line of the body.
        const chest = toScreen(
          {
            x: lerp(joints.shoulder.x, joints.hip.x, 0.42),
            y: lerp(joints.shoulder.y, joints.hip.y, 0.42),
          },
          at,
        );
        const gold = accent('gold');
        return (
          <g key={i}>
            {drawn}
            {layer.badge && (
              <circle
                cx={chest.x}
                cy={chest.y}
                r={at.head * 0.11}
                fill={gold[0]}
                stroke={ink}
                strokeWidth={lineWeights.outline * at.head}
              />
            )}
          </g>
        );
      }
      case 'thing':
        return (
          <StandingProp
            key={i}
            id={layer.prop}
            uid={`poster-${i}`}
            x={layer.x * width}
            groundY={layer.y * height}
            head={layer.head * height}
            t={0.6}
            flip={layer.flip}
          />
        );
      case 'smoke': {
        const head = layer.head * height;
        // It stands on its floor and rises to where its top is asked for.
        const floor = height * layer.floor;
        return (
          <g key={i} opacity={layer.light}>
            {/* Small puffs still reach across the whole picture: the bank is stretched sideways. */}
            <g
              transform={`translate(${width / 2} ${floor}) scale(${Math.max(head, width / (2 * BANK_HALF) / 0.94)} ${head})`}
            >
              <SmokeBank t={0.6} height={(floor - layer.top * height) / head} seed={layer.seed} />
            </g>
          </g>
        );
      }
      case 'shade': {
        const id = `poster-shade-${i}`;
        const across = layer.from === 'left' || layer.from === 'right';
        const first = layer.from === 'top' || layer.from === 'left';
        // The dark starts at its edge and thins inward.
        const [from, to] = first ? [0, 1] : [1, 0];
        const w = across ? width * layer.reach : width;
        const h = across ? height : height * layer.reach;
        return (
          <g key={i}>
            <defs>
              <linearGradient
                id={id}
                x1={across ? from : 0}
                y1={across ? 0 : from}
                x2={across ? to : 0}
                y2={across ? 0 : to}
              >
                <stop offset="0" stopColor={ink} stopOpacity={layer.strength} />
                <stop offset="1" stopColor={ink} stopOpacity={0} />
              </linearGradient>
            </defs>
            <rect
              x={across && !first ? width - w : 0}
              y={!across && !first ? height - h : 0}
              width={w}
              height={h}
              fill={`url(#${id})`}
            />
          </g>
        );
      }
      case 'sign':
        return (
          <Pointer
            key={i}
            text={viewerText(layer.text)}
            at={layer.at}
            to={layer.to}
            width={width}
            height={height}
            paint={layer.paint}
          />
        );
      case 'panel': {
        if (!isPlace(layer.place)) return null;
        const spec = sceneBackground(layer.place, layer.treatment, layer.palette, seed);
        const h = (layer.bottom - layer.top) * height;
        return (
          <svg
            key={i}
            x={0}
            y={layer.top * height}
            width={width}
            height={h}
            viewBox={`0 0 ${width} ${h}`}
          >
            <Background spec={spec} width={width} height={h} frame={0} fps={fps} />
          </svg>
        );
      }
      case 'band':
        return (
          <rect
            key={i}
            x={0}
            y={layer.top * height}
            width={width}
            height={(layer.bottom - layer.top) * height}
            fill={ink}
          />
        );
      case 'tag': {
        const text = viewerText(layer.text);
        const capitals = /[A-Z0-9]/.test(text) && text === text.toUpperCase();
        const size = layer.size * height;
        const w = textWidth(text, size) * (capitals ? 1.2 : 1) + size * 1.1;
        const h = size * 1.55;
        const tone = accent(layer.paint)[0] ?? ink;
        const x = layer.x * width;
        const y = layer.y * height;
        return (
          <g key={i} transform={`rotate(${-layer.tilt} ${x} ${y})`}>
            <rect
              x={x - w / 2}
              y={y - h / 2}
              width={w}
              height={h}
              rx={size * 0.32}
              fill={tone}
              stroke={ink}
              strokeWidth={size * 0.13}
              strokeLinejoin={tokens.line.join}
            />
            <text
              x={x}
              y={y + size * 0.35}
              textAnchor="middle"
              fontFamily={font}
              fontWeight={700}
              fontSize={size}
              fill={luminance(tone) > 0.5 ? ink : tokens.captions.fill}
            >
              {text}
            </text>
          </g>
        );
      }
      case 'crowd': {
        const look = lookFrom(layer.look ?? PLAIN_CLOTHES, 'crowd');
        const figures: ReactNode[] = [];
        for (let r = 0; r < layer.rows; r++) {
          const k = layer.rows === 1 ? 1 : r / (layer.rows - 1);
          const y = lerp(layer.top, layer.bottom, k);
          const head = layer.head * lerp(layer.back, 1, k);
          for (let c = 0; c < layer.cols; c++) {
            const n = r * layer.cols + c;
            const shift = ((r % 2) * 0.5 + (scatter(layer.seed, n) - 0.5) * 0.4) / layer.cols;
            const x =
              lerp(layer.left, layer.right, (c + 0.5) / layer.cols) +
              shift * (layer.right - layer.left);
            if (
              layer.hole &&
              Math.hypot(x - layer.hole.x, (y - layer.hole.y) * (height / width)) < layer.holeRadius
            ) {
              continue;
            }
            const facing = scatter(layer.seed + 5, n) < 0.5 ? 'left' : 'right';
            figures.push(
              <g key={n}>
                {
                  figure(
                    {
                      kind: 'extra',
                      x,
                      y,
                      head,
                      pose: layer.pose,
                      moment: 0.2,
                      facing,
                      turn: 0.1 + 0.3 * scatter(layer.seed + 9, n),
                      expression: layer.expression,
                      effects: [],
                      badge: false,
                      light: layer.light * lerp(0.7, 1, k),
                      outline: 0,
                    },
                    look,
                    `${i}c${n}`,
                  ).drawn
                }
              </g>,
            );
          }
        }
        return <g key={i}>{figures}</g>;
      }
      case 'words':
        return <Words key={i} layer={layer} width={width} height={height} />;
      case 'flat':
        return <rect key={i} width={width} height={height} fill={colourOf(layer.colour)} />;
      case 'headline':
        return (
          <Headline
            key={i}
            lines={layer.lines}
            x={layer.x}
            top={layer.top}
            size={layer.size}
            width={layer.width}
            W={width}
            H={height}
          />
        );
      case 'icon':
        return (
          <Icon
            key={i}
            name={layer.name}
            x={layer.x}
            y={layer.y}
            size={layer.size}
            turn={layer.turn}
            crossed={layer.crossed}
            W={width}
            H={height}
          />
        );
      case 'mark':
        return (
          <Mark
            key={i}
            shape={layer.shape}
            at={layer.at}
            to={layer.to}
            rx={layer.rx}
            ry={layer.ry}
            W={width}
            H={height}
          />
        );
      case 'graphic': {
        // Drawn as it stands at the end of its shot, every piece in place.
        const h = layer.size * height;
        const w = (h * 1080) / 1920;
        return (
          <g key={i}>
            {layer.page && <rect width={width} height={height} fill={PAGE_COLOUR} />}
            <g transform={`translate(${layer.x * width - w / 2} ${layer.y * height - h / 2})`}>
              <ExplainerGraphic
                graphic={layer.graphic}
                local={600}
                duration={600}
                times={graphicSteps(layer.graphic).map(() => 0)}
                width={w}
                height={h}
                bare
              />
            </g>
          </g>
        );
      }
    }
  };
  return <>{layers.map((layer, i) => draw(layer, i))}</>;
}

export const Poster = ({ thumbnail, cast, cards, seed }: PosterProps) => {
  const { width, height, fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: ink }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <PosterLayers
          layers={thumbnail.layers}
          cast={cast}
          cards={cards}
          seed={seed}
          width={width}
          height={height}
          fps={fps}
        />
      </svg>
    </AbsoluteFill>
  );
};
