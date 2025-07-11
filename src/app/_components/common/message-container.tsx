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
    <div className="flex min-h-0 flex-1 flex-col">
      <ThreadHeader threadId={threadId} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="pt-2 pr-1">
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
      <div className="relative p-3 pt-1">
        <div className="from-background/70 pointer-events-none absolute -top-6 right-0 left-0 h-6 bg-gradient-to-b to-transparent" />
        <MessageForm threadId={threadId} />
      </div>
    </div>
  );
}
