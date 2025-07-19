"use client";

import MessageCard from "@/app/_components/common/message-card";
import { api } from "@/trpc/react";
import type { Fragment } from "@prisma/client";
import { useEffect, useMemo, useRef } from "react";
import MessageForm from "./message-form";
import MessageLoading from "./message-loading";
import ThreadHeader from "./thread-header";

interface MessageContainerProps {
  threadId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (fragment: Fragment | null) => void;
}

export default function MessageContainer({
  threadId,
  activeFragment,
  setActiveFragment,
}: MessageContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAssistantMessageIdRef = useRef<string | null>(null);
  const { data: messages } = api.message.getMessages.useQuery(
    {
      threadId,
    },
    {
      refetchInterval: 5000,
    },
  );

  useEffect(() => {
    const lastAssistantMessage = [...(messages ?? [])]
      .reverse()
      .find((message) => message.role === "ASSISTANT");
    if (
      lastAssistantMessage?.fragments &&
      lastAssistantMessage.fragments.id !== lastAssistantMessageIdRef.current
    ) {
      setActiveFragment(lastAssistantMessage.fragments);
      lastAssistantMessageIdRef.current = lastAssistantMessage.id;
    }
  }, [messages, setActiveFragment]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, bottomRef]);

  const isLastUserMessage = useMemo(() => {
    return messages?.[messages?.length - 1]?.role === "USER";
  }, [messages]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-gray-50/30 to-white/50 dark:from-gray-950/30 dark:to-gray-900/50">
      <ThreadHeader threadId={threadId} />

      {/* Messages Area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="py-6">
          {/* Welcome Message */}
          {!messages?.length && (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Ready to build something amazing?
              </h3>
              <p className="text-muted-foreground max-w-md">
                Start by describing what you&apos;d like to create. I&apos;ll help you
                build it step by step.
              </p>
            </div>
          )}

          {/* Message List */}
          {messages?.map((message) => (
            <MessageCard
              key={message.id}
              content={message.content}
              role={message.role}
              fragment={message.fragments}
              isActiveFragment={activeFragment?.id === message.fragments?.id}
              onFragmentClick={() => setActiveFragment(message.fragments)}
              type={message.type}
              createdAt={message.createdAt}
            />
          ))}

          {isLastUserMessage && <MessageLoading />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="relative border-t border-white/20 bg-white/50 p-4 backdrop-blur-sm dark:border-gray-800/30 dark:bg-gray-900/50">
        {/* Fade gradient */}
        <div className="pointer-events-none absolute -top-8 right-0 left-0 h-8 bg-gradient-to-b from-transparent to-white/50 dark:to-gray-900/50" />

        <MessageForm threadId={threadId} />
      </div>
    </div>
  );
}
