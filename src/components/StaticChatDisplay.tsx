import React, { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Message } from '@ai-sdk/react';

interface StaticChatDisplayProps {
  messages: Message[];
}

export const StaticChatDisplay: React.FC<StaticChatDisplayProps> = ({ messages }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, []); // Run only once

  return (
    <div className="flex flex-col h-full">
      {/* Display Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex items-start gap-3",
                m.role === 'user' ? "justify-end" : ""
              )}
            >
              {m.role === 'assistant' && (
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[70%] rounded-lg p-3 text-sm shadow-sm break-words",
                  m.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {/* Basic markdown support for newlines */}
                {m.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </div>
              {m.role === 'user' && (
                 <Avatar className="h-8 w-8 border">
                  <AvatarFallback>U</AvatarFallback>
                 </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      {/* No Input Area Needed */}
    </div>
  );
}; 