// src/utils/cats/bubbles.ts
//
// Tomodachi-style speech-bubble system: phrase pools per event + the
// setMessage helper that writes one onto a cat. Self-contained — bubble
// content can be tweaked here without touching the simulation tick.

import type { CatState } from './types';

// Each event maps to a tiny pool of phrases; `setMessage` picks one at random
// when the corresponding state transition fires. Pools are deliberately short
// — adding/tweaking content here is the expected way to change the feel of
// the cats without touching the simulation.
export type BubbleEvent =
    | 'visit_start'
    | 'meetup_friendly'
    | 'meetup_shy'
    | 'meetup_rebuffed'
    | 'flee_start'
    | 'startle'
    | 'spawned';

export const BUBBLE_POOLS: Record<BubbleEvent, readonly string[]> = {
    visit_start: [
        'hi!',
        '♪',
        'wait up!',
        'hey!!',
        'wanna play?',
        'yoohoo',
        'psst',
        'scoot over',
        'incoming',
        'sup',
        'henlo',
        'guess who',
        'tag ur it',
        'boop time',
        'omw',
    ],
    meetup_friendly: [
        '♪',
        'purr',
        'hang time',
        ':)',
        '♪♪',
        'bestie',
        'we vibin',
        '<3',
        'snuggle',
        'mlem',
        'headbonk',
        'co-loafing',
        'soft hours',
        'good cat',
        'nap buddy',
        'best day',
        'two cats',
        'blep',
        'cozy',
        'paw five',
    ],
    meetup_shy: [
        'eek!',
        'no!',
        'go away',
        'yikes!',
        'back off',
        'no touchy',
        'space pls',
        'STRANGER',
        'nope nope',
    ],
    meetup_rebuffed: [
        'oh!',
        'okay…',
        'rude',
        'sheesh',
        'wow ok',
        'harsh',
        'fine.',
        'ur loss',
        'next time',
    ],
    flee_start: ['ah!', 'eep!', 'gah', 'yipe', 'scatter!', 'nope!', 'skedaddle', 'human!!'],
    startle: ['!', '!!', '!?', '?!', 'rude!', 'wha-', 'hey!!', 'spooked'],
    spawned: ['hi!', 'new cat', '♪', 'hello', 'ta-da', 'sup', 'henlo', "i'm here", 'behold'],
};

export const BUBBLE_DEFAULT_MS = 2000;

// Set a speech bubble on a cat. Overwriting is the replacement contract — a
// new event simply clobbers the previous bubble, including ones that haven't
// expired yet. Most state transitions in the simulation are guarded so they
// only fire once per "episode" (e.g. entering flee state, starting a visit),
// which keeps bubble flicker low without needing an explicit suppress check.
export function setMessage(cat: CatState, event: BubbleEvent, durationMs = BUBBLE_DEFAULT_MS) {
    const pool = BUBBLE_POOLS[event];
    cat.message = pool[Math.floor(Math.random() * pool.length)];
    cat.messageUntil = performance.now() + durationMs;
}
