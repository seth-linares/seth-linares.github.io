// src/utils/cats/tick/publish.ts
//
// Throttled push of poses + messages from the simulation refs to React state.
// React only re-renders the overlay <div>s when these arrays change, so we
// debounce updates to PUSH_POSE_MS (~11fps) — well below the 60fps rAF tick
// but plenty smooth for sprite-frame changes.
//
// Returns the new throttle timestamp. The orchestrator owns the closure
// variable and updates it from this return value.

import type { Dispatch, SetStateAction } from 'react';
import type { CatPose } from '@/types/pixel-cat';
import { PUSH_POSE_MS, RUN_CYCLE_LEN, WALK_CYCLE_LEN } from '../constants';
import type { CatState } from '../types';

export function publishThrottled(
    now: number,
    states: CatState[],
    setPoses: Dispatch<SetStateAction<CatPose[]>>,
    setMessages: Dispatch<SetStateAction<(string | null)[]>>,
    lastPushed: number
): number {
    if (now - lastPushed < PUSH_POSE_MS) return lastPushed;

    const nextPoses: CatPose[] = states.map((cat) => {
        if (cat.state === 'idle') {
            return cat.sitAt && now >= cat.sitAt ? 'sit' : 'idle';
        }
        if (cat.state === 'fleeing' || cat.state === 'startled') {
            return `run${cat.walkFrame % RUN_CYCLE_LEN}` as CatPose;
        }
        return `walk${cat.walkFrame % WALK_CYCLE_LEN}` as CatPose;
    });

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
