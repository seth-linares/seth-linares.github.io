// src/types/pixel-cat.ts
//
// Types and palettes for the PixelCat sprite. Sprite art is adapted from Shepardskin's
// CC0 cat sprites on OpenGameArt: https://opengameart.org/content/cat-sprites
//
// Sprite legend (used inside PixelCat.tsx grids):
//   .  transparent
//   B  body color (palette.body)
//   D  dark outline / shading (palette.outline)
//   E  eye (palette.eye)
//   P  pink ear interior (palette.earPink)

export type CatPose =
    | 'idle'
    | 'walk0'
    | 'walk1'
    | 'walk2'
    | 'walk3'
    | 'walk4'
    | 'walk5'
    | 'run0'
    | 'run1'
    | 'run2'
    | 'run3'
    | 'run4'
    | 'run5'
    | 'sit';

export interface CatPalette {
    body: string;
    outline: string;
    eye: string;
    earPink: string;
}

export const CAT_PALETTES: Record<string, CatPalette> = {
    orange: {
        body: '#E48933',
        outline: '#7a3a04',
        eye: '#1c1c20',
        earPink: '#ffb59a',
    },
    black: {
        body: '#3a3a44',
        outline: '#15151a',
        eye: '#FBC02D',
        earPink: '#7a4a55',
    },
    gray: {
        body: '#9aa0a8',
        outline: '#3f434c',
        eye: '#1c1c20',
        earPink: '#dba39a',
    },
    siamese: {
        body: '#f3e7d3',
        outline: '#6e4c2c',
        eye: '#3aa6d8',
        earPink: '#e0a59a',
    },
};
