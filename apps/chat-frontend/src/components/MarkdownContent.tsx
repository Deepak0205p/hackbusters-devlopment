'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const MarkdownContent = ({ content }: { content: string }) => (
  <div className="prose prose-sm dark:prose-invert max-w-none break-words">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  </div>
);

export default MarkdownContent;
