// src/components/regex_playground/TestStringInput.tsx

import { TestStringInputProps } from "@/types/regex";


function TestStringInput({
  testStrings,
  setTestStringAt,
  addTestString,
  removeTestString,
}: TestStringInputProps) {
  return (
    <div className="card bg-linear-to-br from-base-200 to-base-300 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-primary">Test Strings</h2>
          <div className="flex items-center gap-2">
            <button className="btn btn-sm btn-secondary bg-linear-to-r from-primary to-accent text-primary-content" onClick={addTestString}>
              + Add
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {testStrings.map((t, i) => (
            <div key={i} className="flex gap-2 items-start">
              <textarea
                className="textarea textarea-bordered font-mono w-full focus:outline-none focus:ring-2 focus:ring-accent/50"
                rows={4}
                placeholder="Type or paste text to test against your pattern"
                value={t}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTestStringAt(i, e.target.value)}
                aria-label={`Test string ${i + 1}`}
                data-teststring-index={i}
              />
              <button
                className="btn btn-sm btn-error"
                onClick={() => removeTestString(i)}
                disabled={testStrings.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TestStringInput;