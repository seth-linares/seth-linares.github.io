// src/components/regex_playground/CodeSection.tsx

import type { CodeSectionProps } from "@/types/regex";
import CopyButton from "@/components/common/CopyButton";
import { useCodeHighlighting } from "@/hooks/regex_playground/useCodeHighlighting";

function CodeSection({
  title = "Code Generation",
  code,
  pattern,
  flags,
}: CodeSectionProps) {
  const { language, setLanguage, displayCode, codeRef } = useCodeHighlighting({
    code,
    pattern,
    flags,
  });

  return (
    <div className="card bg-gradient-to-br from-base-200 to-base-300 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-primary">{title}</h2>
          <div className="flex gap-2 items-center">
            <select
              className="select select-sm select-bordered"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              aria-label="Select language for code generation"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
            <CopyButton
              text={displayCode}
              className="btn btn-sm btn-outline hover:btn-primary"
            >
              Copy
            </CopyButton>
          </div>
        </div>
        <div className="markdown-content">
          <pre className="rounded-box p-4 my-4 overflow-x-auto bg-neutral text-neutral-content">
            <code 
              ref={codeRef}
              className={`language-${language}`}
            >
              {displayCode}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export default CodeSection;
