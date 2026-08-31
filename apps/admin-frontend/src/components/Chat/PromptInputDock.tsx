'use client';

import React, { useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { socketManager } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { ArrowUp, Paperclip, Square, Sparkles } from 'lucide-react';

export function PromptInputDock() {
  const { currentInput, setCurrentInput, addMessage, isStreaming, setStreaming } = useChatStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = () => {
    if (!currentInput.trim() || isSubmitting || isStreaming) return;

    const userPrompt = currentInput.trim();
    setCurrentInput('');
    setIsSubmitting(true);

    // 1. Add User Message to UI
    addMessage({
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    // 2. Submit Task over WebSocket
    socketManager.sendChatTask(userPrompt, []);
    setIsSubmitting(false);
  };

  const handleStop = () => {
    setStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur-md p-3 transition-all focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-300/40">
      {/* Dynamic input area with comfortable typography */}
      <textarea
        value={currentInput}
        onChange={(e) => setCurrentInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message MRPL Sovereign AI or ask an engineering question..."
        rows={2}
        className="w-full bg-transparent text-xs text-gray-900 placeholder-gray-400 outline-none resize-none leading-relaxed font-sans min-h-[52px] max-h-[140px]"
      />

      {/* Action Footer Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-1">
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="ghost" 
            className="min-h-[36px] h-8 px-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            <Paperclip className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-[11px] font-mono">Attach PDF/P&ID</span>
          </Button>

          <span className="text-[10px] font-mono text-gray-500 hidden sm:inline flex items-center">
            <Sparkles className="h-3 w-3 mr-1 text-blue-600" />
            DeepSeek 4B Edge Compute
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {isStreaming ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleStop}
              className="min-h-[36px] h-8 px-3 text-xs font-mono text-[#e5484d] border-[#e5484d]/40 hover:bg-[#e5484d]/10 rounded-lg transition-all"
            >
              <Square className="h-3 w-3 mr-1.5 fill-current" />
              <span>Stop</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={handleSend}
              disabled={!currentInput.trim() || isSubmitting}
              className="min-h-[36px] h-8 w-8 p-0 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-gray-900 transition-all flex items-center justify-center"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
