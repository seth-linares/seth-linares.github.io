import React, { lazy, Suspense } from 'react';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

// Lazy load ReactMarkdown only
const ReactMarkdown = lazy(() => import('react-markdown'));

// Only import the specific highlight.js styles needed
import 'highlight.js/styles/github-dark.css';

import useMarkdownRenderer from '@/hooks/token_counter/useMarkdownRenderer';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const { codeRef } = useMarkdownRenderer({ content });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            code({ className, children, ...props }) {
              const match = (className || '').match(/language-(\w+)/);
              return match ? (
                <pre data-language={match[1]} className="rounded-md bg-black/70 p-2">
                  <code ref={codeRef} className={`language-${match[1]}`}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </Suspense>
  );
};

export default MarkdownRenderer;
