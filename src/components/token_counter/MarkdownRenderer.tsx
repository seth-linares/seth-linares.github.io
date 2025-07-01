import React, { lazy, Suspense, useRef } from 'react';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import supersub from 'remark-supersub';
import 'highlight.js/styles/github-dark.css';

const ReactMarkdown = lazy(() => import('react-markdown'));

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const codeRef = useRef<HTMLDivElement>(null);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="prose markdown-content">
        <ReactMarkdown
          remarkPlugins={[[remarkGfm, { singleTilde: false }], supersub]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            code({ className, children, ...props }) {
              const match = (className || '').match(/language-(\w+)/);
              return match ? (
                <pre data-language={match[1]} className="rounded-md bg-black/70 p-2">
                  <code className={`language-${match[1]}`} ref={codeRef}>
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