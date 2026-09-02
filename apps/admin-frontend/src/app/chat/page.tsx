'use client';

import React from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-blue-600" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chat Workspace</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          The conversational AI workspace is hosted on the public chat interface.
          Access it via the dedicated chat frontend for the full streaming experience.
        </p>
      </div>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Open Chat Interface
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
