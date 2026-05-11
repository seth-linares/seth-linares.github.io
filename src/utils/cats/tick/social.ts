// src/utils/cats/tick/social.ts
//
// Playful cats periodically decide to visit a nearby cat. This phase only
// flips the state to `visiting` and stamps the visitTarget; the actual
// movement toward the target and the meetup logic live in tick/visit.ts.
//
// Two cooldowns prevent visible cluster cascades:
//  - skip cats that just finished a meetup (lastMeetupAt) so a freshly-met
//    chill cat isn't immediately re-targeted by another playful cat,
//  - skip cats that are currently the target of someone else's active visit
//    so two playful cats don't converge on the same chill cat simultaneously.

import { setMessage } from '../bubbles';
import {
    MEETUP_COOLDOWN_MS,
    MEETUP_DISTANCE,
    SOCIAL_CHECK_INTERVAL_MS,
    VISIT_RADIUS,
} from '../constants';
import type { CatState } from '../types';
import type { TickContext } from './types';

export function updateSocialPick(cat: CatState, ctx: TickContext): void {
    if (cat.behavior !== 'playful') return;
    if (cat.run.kind !== 'walking' && cat.run.kind !== 'idle') return;
    if (ctx.now < cat.nextSocialCheck) return;

    cat.nextSocialCheck = ctx.now + SOCIAL_CHECK_INTERVAL_MS;
    // The cat just considered a visit; its own recent meetup also makes it a
    // poor visitor. Skip the search entirely when on cooldown — the meetup
    // pause is shorter than the cooldown so the cat will be back to walking
    // before it tries again.
    if (ctx.now - cat.lastMeetupAt < MEETUP_COOLDOWN_MS) return;

    let nearestIdx = -1;
    let nearestDist = VISIT_RADIUS;
    for (let j = 0; j < ctx.states.length; j++) {
        if (j === ctx.i) continue;
        const other = ctx.states[j];
        if (other.run.kind === 'fleeing' || other.run.kind === 'startled') continue;
        if (ctx.now - other.lastMeetupAt < MEETUP_COOLDOWN_MS) continue;
        // Skip if another cat is already visiting this one.
        let alreadyTargeted = false;
        for (let k = 0; k < ctx.states.length; k++) {
            if (k === ctx.i || k === j) continue;
            const candidate = ctx.states[k];
            if (candidate.run.kind === 'visiting' && candidate.run.visitTarget === j) {
                alreadyTargeted = true;
                break;
            }
        }
        if (alreadyTargeted) continue;
        const d = Math.hypot(other.x - cat.x, other.y - cat.y);
        if (d > MEETUP_DISTANCE && d < nearestDist) {
            nearestIdx = j;
            nearestDist = d;
        }
    }

    if (nearestIdx >= 0) {
        // Seed an initial visit target — visit.ts will overwrite next frame
        // with the offset-from-target position, so the initial value here
        // is a placeholder that just keeps the variant shape valid.
        cat.run = {
            kind: 'visiting',
            visitTarget: nearestIdx,
            targetX: cat.x,
            targetY: cat.y,
        };
        setMessage(cat, 'visit_start');
    }
}
