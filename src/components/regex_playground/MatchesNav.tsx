// src/components/regex_playground/MatchesNav.tsx

import { MatchesNavProps } from "@/types/regex";

function MatchesNav({
  totalMatches,
  currentIndex,
  disabled,
  onPrev,
  onNext,
  error,
}: MatchesNavProps) {
  return (
    <div className="card bg-linear-to-br from-base-200 to-base-300 shadow-xl backdrop-blur-sm">
      <div className="card-body py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="btn btn-xs" onClick={onPrev} aria-label="Go to previous match" disabled={disabled}>
              ← Prev
            </button>
            <span className="badge badge-sm badge-ghost">
              {disabled ? 0 : Math.max(1, currentIndex)} of {totalMatches}
            </span>
            <button className="btn btn-xs" onClick={onNext} aria-label="Go to next match" disabled={disabled}>
              Next →
            </button>
          </div>
          {!error && (
            <div className="text-xs text-base-content/60">
              <span className="badge badge-sm badge-primary">{totalMatches}</span>
              <span className="ml-1">total matches</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchesNav;