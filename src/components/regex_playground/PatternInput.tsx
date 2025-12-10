// src/components/regex_playground/PatternInput.tsx
import type { FlagToggleProps, PatternInputProps, RegexFlags } from '@/types/regex';
import { useDebouncedValue } from '@/hooks/regex_playground/useDebouncedValue';

function FlagToggle({ 
  k, 
  active, 
  onToggle 
}: FlagToggleProps) {
  const label = '/' + k;
  return (
    <button type="button" className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`} onClick={onToggle} aria-pressed={active} aria-label={`Toggle ${k} flag`}>
      <span className="badge">{label}</span>
    </button>
  );
}

function PatternInput({
  pattern,
  setPattern,
  flags,
  toggleFlag,
}: PatternInputProps) {
  // Use shared hook for debounce so spinner only shows while typing
  const debouncedPattern = useDebouncedValue(pattern, 300);
  const showLoading = pattern !== debouncedPattern;

  return (
    <div className="card bg-linear-to-br from-base-200 to-base-300 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="card-body">
        <div className="flex items-center justify-between gap-2">
          <h2 className="card-title text-primary">Pattern Editor</h2>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(flags) as (keyof RegexFlags)[]).map((k) => (
              <FlagToggle key={k} k={k} active={!!flags[k]} onToggle={() => toggleFlag(k)} />
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            className="textarea textarea-bordered font-mono w-full mt-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
            placeholder="Enter your regex pattern (e.g. \\b\\w+@\\w+\\.\\w+\\b)"
            value={pattern}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPattern(e.target.value)}
            aria-label="Regex pattern input"
          />
          {/* Loading indicator during debounce */}
          {showLoading && (
            <div className="absolute top-2 right-2">
              <div className="loading loading-spinner loading-xs opacity-60" aria-label="Parsing pattern"></div>
            </div>
          )}
        </div>
        <div className="text-xs text-base-content/60 mt-1">
          Flags: g = global, i = ignore case, m = multiline, s = dotAll, u = unicode, y = sticky
        </div>
      </div>
    </div>
  );
}

export default PatternInput;
