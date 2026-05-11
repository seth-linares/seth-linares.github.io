// src/utils/cats/tick/publish.ts
//
// Throttled push of poses + messages from the simulation refs to React state.
// React only re-renders the overlay <div>s when these arrays change, so we
// debounce updates to PUSH_POSE_MS (~11fps) — well below the 60fps rAF tick
// but plenty smooth for sprite-frame changes.
//
// The pose-from-state switch uses an exhaustiveness check via the `never`
// trick: adding a new CatRunState variant (e.g. 'petting') without handling
// it here is a TS error. That's the bug-prevention payoff of the
// discriminated union.

import type { Dispatch, SetStateAction } from 'react';
import type { CatPose } from '@/types/pixel-cat';
import { PUSH_POSE_MS, RUN_POSES, WALK_POSES } from '../constants';
import type { CatState } from '../types';

function poseForCat(cat: CatState, now: number): CatPose {
    switch (cat.run.kind) {
        case 'idle':
            return cat.run.sitAt && now >= cat.run.sitAt ? 'sit' : 'idle';
        case 'fleeing':
        case 'startled':
            return RUN_POSES[cat.walkFrame % RUN_POSES.length];
        case 'walking':
        case 'visiting':
            return WALK_POSES[cat.walkFrame % WALK_POSES.length];
        default: {
            // Exhaustiveness check: if a new CatRunState variant is added
            // without handling it here, TS will error on the `never`
            // assignment. That's the load-bearing safety net for the
            // discriminated union.
            const _exhaustive: never = cat.run;
            return _exhaustive;
        }
    }
}

export function publishThrottled(
    now: number,
    states: CatState[],
    setPoses: Dispatch<SetStateAction<CatPose[]>>,
    setMessages: Dispatch<SetStateAction<(string | null)[]>>,
    lastPushed: number
): number {
    if (now - lastPushed < PUSH_POSE_MS) return lastPushed;

    const nextPoses: CatPose[] = states.map((cat) => poseForCat(cat, now));

    setPoses((prev) => {
        let same = prev.length === nextPoses.length;
        if (same) {
            for (let k = 0; k < prev.length; k++) {
                if (prev[k] !== nextPoses[k]) {
                    same = false;
                    break;
                }
            }
        }
        return same ? prev : nextPoses;
    });

    // Mirror the poses push for bubble messages — same throttle clock, same
    // equality short-circuit. React only re-renders the bubble overlay when
    // a phrase appears/disappears/changes.
    const nextMessages: (string | null)[] = states.map((cat) => cat.message);
    setMessages((prev) => {
        let same = prev.length === nextMessages.length;
        if (same) {
            for (let k = 0; k < prev.length; k++) {
                if (prev[k] !== nextMessages[k]) {
                    same = false;
                    break;
                }
            }
        }
        return same ? prev : nextMessages;
    });

    return now;
}
