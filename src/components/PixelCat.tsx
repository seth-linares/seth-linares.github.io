// src/components/PixelCat.tsx
//
// Pixel-art cat rendered as inline SVG. Sprite frames are 18x15 grids; each non-empty
// character becomes a 1x1 SVG rect.
//
// Sprite art adapted from Shepardskin's CC0 cat sprites on OpenGameArt:
//   https://opengameart.org/content/cat-sprites  (CC0 / public domain)
//
// Legend (see pixel-cat.ts for the matching palette fields):
//   .  transparent     B  body          D  dark outline / shadow
//   E  eye             P  pink ear interior
//
// Sprite faces RIGHT by default (head on the right, tail curling up on the left). The
// parent flips horizontally with scaleX(-1) for left-facing motion.

import { memo, type ReactElement } from 'react';
import { CAT_PALETTES, type CatPalette, type CatPose } from '@/types/pixel-cat';

const SPRITE_WIDTH = 18;
const SPRITE_HEIGHT = 15;

// Walk cycle — 6 frames. Frame 0 is the upright "tail-up" idle pose.
const WALK_FRAMES: string[][] = [
    [
        '.............BB...',
        '.BB..........BPB..',
        'B..B.........BBBB.',
        'B..B........BBBEBB',
        'B...........BBBBBB',
        '.B...BBBB..BBBBBB.',
        '..BBBBBBBBBBBBBB..',
        '...BBBBBBBBBBBBB..',
        '....BBBBBBBBBBBB..',
        '....BBBBBBBBBBB...',
        '....BBBBBBBBBBB...',
        '.....BBBD..DDBBB..',
        '.....BDDD..DD.BB..',
        '.....BBD....DDBB..',
        '.....BB.....DD....',
    ],
    [
        '..................',
        '.BBB.........BB...',
        'B...B........BPB..',
        'B............BBBB.',
        'B...........BBBEBB',
        '.B..........BBBBBB',
        '.B...BBBB..BBBBBB.',
        '..BBBBBBBBBBBBBB..',
        '...BBBBBBBBBBBBB..',
        '....BBBBBBBBBBBB..',
        '....BBBBBBBBBBB...',
        '....BBBBBBBBBBB...',
        '.....BBB..DDDBBB..',
        '....BBDDD.DD..BBB.',
        '....BB.DD.DD...BB.',
    ],
    [
        '...B........BB....',
        '.BB.........BPB...',
        'B...........BBBB..',
        'B..........BBBEBB.',
        'B..........BBBBBB.',
        '.B..BBBB..BBBBBB..',
        '.BBBBBBBBBBBBBB...',
        '..BBBBBBBBBBBBB...',
        '...BBBBBBBBBBBB...',
        '...BBBBBBBBBBB....',
        '...BBBBBBBBBB.....',
        '...DBBB..DBB......',
        '...DB....DBB......',
        '...DBB....DBB.....',
        '...DBB....DBB.....',
    ],
    [
        '.....B......BB....',
        '...BB.......BPB...',
        '.BB.........BBBB..',
        'B..........BBBEBB.',
        'B..........BBBBBB.',
        '.B..BBBB..BBBBBB..',
        '.BBBBBBBBBBBBBB...',
        '..BBBBBBBBBBBBB...',
        '...BBBBBBBBBBBB...',
        '...BBBBBBBBBBB....',
        '...BBBBBBBBBBD....',
        '....DDBB..BBDDD...',
        '....DBBB..BB.DD...',
        '....DBB....BBDD...',
        '....DD.....BB.....',
    ],
    [
        '..................',
        '...BB.......BB....',
        '.BB..B......BPB...',
        'B...........BBBB..',
        'B..........BBBEBB.',
        'B..........BBBBBB.',
        '.B..BBBB..BBBBBB..',
        '.BBBBBBBBBBBBBB...',
        '..BBBBBBBBBBBBB...',
        '...BBBBBBBBBBBB...',
        '...BBBBBBBBBBB....',
        '...BBBBBBBBBBD....',
        '....BBB..BBBDDD...',
        '...DDBBB.BB..DDD..',
        '...DD.BB.BB...DD..',
    ],
    [
        '............BB....',
        '.BB.........BPB...',
        'B..B........BBBB..',
        'B..B.......BBBEBB.',
        'B..........BBBBBB.',
        'B...BBBB..BBBBBB..',
        '.BBBBBBBBBBBBBB...',
        '..BBBBBBBBBBBBB...',
        '...BBBBBBBBBBBB...',
        '...BBBBBBBBBBB....',
        '...BBBBBBBBBB.....',
        '...BBBD..BBD......',
        '...BD....BBD......',
        '...BBD....BBD.....',
        '...BBD....BBD.....',
    ],
];

// Run cycle — 6 frames. Body stretched and tail trailing back; used while fleeing.
const RUN_FRAMES: string[][] = [
    [
        '..................',
        '..................',
        '.BB...............',
        'B..B.........BBBB.',
        'B..B..........BBBB',
        'BB..........BBBBEB',
        '.BB.....BBBBBBBBBB',
        '..BB..BBBBBBBBBBBB',
        '...BBBBBBBBBBBB...',
        '....BBBBBBBBBBBBB.',
        '....BBBBBB..DBBBBB',
        '....BBBB.....DD.BB',
        '.....BB......DD...',
        '....BBD...........',
        '....BBD...........',
    ],
    [
        '.BB...............',
        'B..B..............',
        'B..B..............',
        'BB................',
        '.BB...............',
        '..BB..BBBB...BBBB.',
        '...BBBBBBBBB..BBBB',
        '....BBBBBBBBBBBBEB',
        '....BBBBBBBBBBBBBB',
        '....BBBBBBBBBBBBBB',
        '..BBBB....BBBBBBB.',
        '..BBB......DDDBBBB',
        '...........DD...BB',
        '............DD....',
        '............DD....',
    ],
    [
        '..................',
        '.BBB..............',
        'B...B.............',
        'BB................',
        '.BB...BBBB........',
        '..BBBBBBBBB...BBBB',
        '....BBBBBBBBB..BBB',
        '.....BBBBBBBBBBBBE',
        '.....BBBBBBBBBBBBB',
        '......BBBBBBBBBBBB',
        '......BBBD.BBBBB..',
        '.....BBBD..DDBBB..',
        '.....BBDD..D..BBB.',
        '...........DD..BBB',
        '...........DD...BB',
    ],
    [
        '..................',
        '..................',
        '.BBB..............',
        'B...B.............',
        'BB............BBBB',
        '.BB....BBBBBB..BBB',
        '..BBBBBBBBBBBBBBBE',
        '....BBBBBBBBBBBBBB',
        '......BBBBBBBBBBBB',
        '......BBBBBBBBBBB.',
        '......BBBD..BBBB..',
        '......BBBDD.DBB...',
        '.......BBDDDDBB...',
        '.......BB..DD.BB..',
        '..............BB..',
    ],
    [
        '..................',
        '..................',
        '..................',
        '.BBB..............',
        'B...B.........BBBB',
        'BB.......BBBB..BBB',
        '.BB....BBBBBBBBBBE',
        '..BBBBBBBBBBBBBBBB',
        '....BBBBBBBBBBBBBB',
        '......BBBBBBBBBBB.',
        '.......BBBB.BBBB..',
        '.......BBBD..BBD..',
        '........BBDDBBBD..',
        '.........BBDBBD...',
        '.........BB.......',
    ],
    [
        '..................',
        '..................',
        '..................',
        '.BBB..........BBBB',
        'B...B..........BBB',
        'BB.......BBBBBBBBE',
        '.BB....BBBBBBBBBBB',
        '..BBBBBBBBBBBBBBBB',
        '....BBBBBBBBBBBBB.',
        '......BBBBBB.BBBD.',
        '.......BBBBD..BBBD',
        '.......BBBD....BBD',
        '........BBDD...BBD',
        '........BBDD......',
        '........BB........',
    ],
];

// Sit pose — front legs together straight under the chest, hindquarters tucked.
// Hand-crafted from walk frame 0 (head/back identical) with the leg block reworked.
const SIT_FRAME: string[] = [
    '.............BB...',
    '.BB..........BPB..',
    'B..B.........BBBB.',
    'B..B........BBBEBB',
    'B...........BBBBBB',
    '.BB..BBBB..BBBBBB.',
    '..BBBBBBBBBBBBBB..',
    '..BBBBBBBBBBBBBBB.',
    '..BBBBBBBBBBBBBBB.',
    '..BBBBBBBBBBBBBBB.',
    '..BBBBBBBBBBBBBB..',
    '...BBBBB....BBBB..',
    '...BBBBB....BBBD..',
    '...DBBBD....DBBD..',
    '....DDD......DD...',
];

const FRAMES: Record<CatPose, string[]> = {
    idle: WALK_FRAMES[0],
    walk0: WALK_FRAMES[0],
    walk1: WALK_FRAMES[1],
    walk2: WALK_FRAMES[2],
    walk3: WALK_FRAMES[3],
    walk4: WALK_FRAMES[4],
    walk5: WALK_FRAMES[5],
    run0: RUN_FRAMES[0],
    run1: RUN_FRAMES[1],
    run2: RUN_FRAMES[2],
    run3: RUN_FRAMES[3],
    run4: RUN_FRAMES[4],
    run5: RUN_FRAMES[5],
    sit: SIT_FRAME,
};

interface Props {
    pose?: CatPose;
    palette?: CatPalette;
    size?: number; // pixel width of rendered sprite
}

function PixelCat({ pose = 'idle', palette = CAT_PALETTES.orange, size = 56 }: Props) {
    const grid = FRAMES[pose];
    const rects: ReactElement[] = [];
    for (let y = 0; y < grid.length; y++) {
        const row = grid[y];
        for (let x = 0; x < row.length; x++) {
            const ch = row[x];
            if (ch === '.' || ch === ' ') continue;
            let fill: string;
            switch (ch) {
                case 'B':
                    fill = palette.body;
                    break;
                case 'D':
                    fill = palette.outline;
                    break;
                case 'E':
                    fill = palette.eye;
                    break;
                case 'P':
                    fill = palette.earPink;
                    break;
                default:
                    continue;
            }
            rects.push(<rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
        }
    }

    const renderHeight = (size * SPRITE_HEIGHT) / SPRITE_WIDTH;

    return (
        <svg
            width={size}
            height={renderHeight}
            viewBox={`0 0 ${SPRITE_WIDTH} ${SPRITE_HEIGHT}`}
            shapeRendering="crispEdges"
            style={{ imageRendering: 'pixelated', display: 'block' }}
            aria-hidden="true"
        >
            {rects}
        </svg>
    );
}

export default memo(PixelCat);
