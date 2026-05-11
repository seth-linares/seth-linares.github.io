// src/utils/cats/targets.ts
//
// Pure target/geometry helpers used by the simulation. None of these touch
// React, refs, or the DOM beyond `document.documentElement` size; they're
// deterministic given their inputs and trivially unit-testable.
//
// All positions are DocPos (document coords). The branded type prevents
// accidentally mixing viewport/clientX-Y coords into these helpers.

import { NAVBAR_HEIGHT, NAVBAR_TOP_PAD, TARGET_MAX_DIST, TARGET_MIN_DIST } from './constants';
import { rng } from './rng';
import { asDoc, type CatState, type DocDims, type DocPos, type ObstacleRect } from './types';

export function getDocDims(): DocDims {
    const docEl = document.documentElement;
    return {
        width: Math.max(docEl.scrollWidth, docEl.clientWidth, window.innerWidth),
        height: Math.max(docEl.scrollHeight, docEl.clientHeight, window.innerHeight),
    };
}

export function pickTarget(catSize: number, dims: DocDims): { x: DocPos; y: DocPos } {
    const inset = catSize + 20;
    const topInset = Math.max(inset, NAVBAR_HEIGHT + catSize / 2 + NAVBAR_TOP_PAD);
    return {
        x: asDoc(inset + rng.next() * Math.max(1, dims.width - inset * 2)),
        y: asDoc(topInset + rng.next() * Math.max(1, dims.height - topInset - inset)),
    };
}

// Pick a target near the cat's current position rather than anywhere in the
// doc. Falls back to global random if the local pick lands outside the safe
// area.
export function pickNearbyTarget(
    catSize: number,
    fromX: DocPos,
    fromY: DocPos,
    dims: DocDims
): { x: DocPos; y: DocPos } {
    const inset = catSize + 20;
    const topInset = Math.max(inset, NAVBAR_HEIGHT + catSize / 2 + NAVBAR_TOP_PAD);
    const angle = rng.next() * Math.PI * 2;
    const dist = TARGET_MIN_DIST + rng.next() * (TARGET_MAX_DIST - TARGET_MIN_DIST);
    const x = fromX + Math.cos(angle) * dist;
    const y = fromY + Math.sin(angle) * dist;
    const minX = inset;
    const maxX = dims.width - inset;
    const minY = topInset;
    const maxY = dims.height - inset;
    if (x < minX || x > maxX || y < minY || y > maxY) {
        return pickTarget(catSize, dims);
    }
    return { x: asDoc(x), y: asDoc(y) };
}

// When a cat is overlapping one or more obstacles, aim past the nearest edge of
// the overlapping set that ACTUALLY escapes after viewport clamping — so cats
// stuck near a near-full-width obstacle (like the hero text block) don't aim
// horizontally only to be clamped back inside. Returns null if the cat isn't
// actually overlapping anything OR if no valid escape exists.
export function pickEscapeTarget(
    catX: DocPos,
    catY: DocPos,
    catSize: number,
    dims: DocDims,
    obstacles: ObstacleRect[]
): { x: DocPos; y: DocPos } | null {
    const halfSize = catSize / 2;
    const catL = catX - halfSize;
    const catT = catY - halfSize;
    const catR = catX + halfSize;
    const catB = catY + halfSize;
    const inset = catSize + 20;
    const topInset = Math.max(inset, NAVBAR_HEIGHT + halfSize + NAVBAR_TOP_PAD);
    const buffer = halfSize + 4;

    const covers: ObstacleRect[] = [];
    for (let k = 0; k < obstacles.length; k++) {
        const o = obstacles[k];
        if (catL < o.x + o.w && catR > o.x && catT < o.y + o.h && catB > o.y) {
            covers.push(o);
        }
    }
    if (covers.length === 0) return null;

    let bestDist = Infinity;
    let bestX = 0;
    let bestY = 0;
    let foundValid = false;

    for (const o of covers) {
        const candidates = [
            { x: o.x - buffer, y: catY, d: catX - o.x }, // left
            { x: o.x + o.w + buffer, y: catY, d: o.x + o.w - catX }, // right
            { x: catX, y: o.y - buffer, d: catY - o.y }, // top
            { x: catX, y: o.y + o.h + buffer, d: o.y + o.h - catY }, // bottom
        ];
        for (const c of candidates) {
            const cx = Math.max(inset, Math.min(dims.width - inset, c.x));
            const cy = Math.max(topInset, Math.min(dims.height - inset, c.y));
            const nL = cx - halfSize;
            const nT = cy - halfSize;
            const nR = cx + halfSize;
            const nB = cy + halfSize;
            let lands_in_obstacle = false;
            for (let m = 0; m < obstacles.length; m++) {
                const oc = obstacles[m];
                if (nL < oc.x + oc.w && nR > oc.x && nT < oc.y + oc.h && nB > oc.y) {
                    lands_in_obstacle = true;
                    break;
                }
            }
            if (lands_in_obstacle) continue;
            if (c.d < bestDist) {
                bestDist = c.d;
                bestX = cx;
                bestY = cy;
                foundValid = true;
            }
        }
    }

    if (!foundValid) return null;
    return { x: asDoc(bestX), y: asDoc(bestY) };
}

export function rectContainsBbox(
    x: DocPos,
    y: DocPos,
    halfSize: number,
    obstacles: ObstacleRect[]
): boolean {
    const L = x - halfSize;
    const T = y - halfSize;
    const R = x + halfSize;
    const B = y + halfSize;
    for (let k = 0; k < obstacles.length; k++) {
        const o = obstacles[k];
        if (L < o.x + o.w && R > o.x && T < o.y + o.h && B > o.y) return true;
    }
    return false;
}

// Sample a few intermediate points along the straight-line path from→to and
// return true if every point's bbox is in clear space. Used to avoid picking
// targets whose path would dive through cover unnecessarily.
export function pathIsClear(
    fromX: DocPos,
    fromY: DocPos,
    toX: DocPos,
    toY: DocPos,
    catSize: number,
    obstacles: ObstacleRect[]
): boolean {
    const halfSize = catSize / 2;
    const SAMPLES = 6;
    for (let i = 1; i <= SAMPLES; i++) {
        const t = i / SAMPLES;
        const x = asDoc(fromX + (toX - fromX) * t);
        const y = asDoc(fromY + (toY - fromY) * t);
        if (rectContainsBbox(x, y, halfSize, obstacles)) return false;
    }
    return true;
}

// True when (x, y) is within `radius` of any other cat in `states`, treating
// (x, y) as the new candidate position for `states[selfIdx]`. The visiting
// pair is exempt — if selfIdx is visiting j (or j is visiting selfIdx), they
// must be allowed to close to MEETUP_DISTANCE; otherwise CAT_SPACING_RADIUS
// would smother the meetup behavior. Distance-squared compared against
// radius² to avoid a per-call sqrt.
export function tooCloseToOtherCat(
    x: DocPos,
    y: DocPos,
    selfIdx: number,
    states: CatState[],
    radius: number
): boolean {
    const radiusSq = radius * radius;
    const self = states[selfIdx];
    const selfVisiting = self && self.run.kind === 'visiting' ? self.run.visitTarget : -1;
    for (let j = 0; j < states.length; j++) {
        if (j === selfIdx) continue;
        const other = states[j];
        // Skip the partner of an active visit so visitors can still arrive.
        if (selfVisiting === j) continue;
        if (other.run.kind === 'visiting' && other.run.visitTarget === selfIdx) continue;
        const dx = x - other.x;
        const dy = y - other.y;
        if (dx * dx + dy * dy < radiusSq) return true;
    }
    return false;
}

// Avoidance options. `states + selfIdx + spacing` only make sense as a group
// — passing one without the others used to silently skip avoidance. The
// options bag forces them together: either provide all three (and optionally
// `attempts`), or omit the bag entirely and skip avoidance explicitly.
export interface AvoidanceOpts {
    states: CatState[];
    selfIdx: number;
    spacing: number;
    attempts?: number;
}

// Random doc-coord target that's also not inside any obstacle. When `avoid`
// is provided, also rejects targets within `spacing` of another cat (modulo
// the visiting-pair exemption in tooCloseToOtherCat). Falls back to a plain
// random target after enough failed attempts so the simulation never stalls.
export function pickClearTarget(
    catSize: number,
    dims: DocDims,
    obstacles: ObstacleRect[],
    avoid?: AvoidanceOpts
): { x: DocPos; y: DocPos } {
    const halfSize = catSize / 2;
    const attempts = avoid?.attempts ?? 12;
    for (let i = 0; i < attempts; i++) {
        const t = pickTarget(catSize, dims);
        if (rectContainsBbox(t.x, t.y, halfSize, obstacles)) continue;
        if (avoid && tooCloseToOtherCat(t.x, t.y, avoid.selfIdx, avoid.states, avoid.spacing)) {
            continue;
        }
        return t;
    }
    return pickTarget(catSize, dims);
}

// Cat is currently standing in a gap; pick a NEARBY target that's also in a
// gap AND reachable via a straight-line path that stays in clear space. When
// `avoid` is provided, also rejects targets within `spacing` of another cat
// so two cats can't independently pick the same destination.
export function pickNearbyClearTarget(
    catSize: number,
    fromX: DocPos,
    fromY: DocPos,
    dims: DocDims,
    obstacles: ObstacleRect[],
    avoid?: AvoidanceOpts
): { x: DocPos; y: DocPos } {
    const halfSize = catSize / 2;
    const attempts = avoid?.attempts ?? 10;
    for (let i = 0; i < attempts; i++) {
        const t = pickNearbyTarget(catSize, fromX, fromY, dims);
        if (rectContainsBbox(t.x, t.y, halfSize, obstacles)) continue;
        if (!pathIsClear(fromX, fromY, t.x, t.y, catSize, obstacles)) continue;
        if (avoid && tooCloseToOtherCat(t.x, t.y, avoid.selfIdx, avoid.states, avoid.spacing)) {
            continue;
        }
        return t;
    }
    return pickNearbyTarget(catSize, fromX, fromY, dims);
}
