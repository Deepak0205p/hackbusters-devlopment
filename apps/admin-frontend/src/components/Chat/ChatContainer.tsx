'use client';

import React, { useRef, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { MessageItem } from './MessageItem';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatContainer() {
  const { messages, isStreaming } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-[400px] max-h-[560px]">
      <AnimatePresence mode="popLayout">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, transform: "scale(0.98) translateY(6px)" }}
            animate={{ opacity: 1, transform: "scale(1) translateY(0px)" }}
            exit={{ opacity: 0, transform: "scale(0.98)" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <MessageItem message={msg} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Streaming Indicator */}
      {isStreaming && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-2 py-2 text-xs font-mono text-gray-500"
        >
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Agent reasoning & executing tools in Docker sandbox...</span>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
