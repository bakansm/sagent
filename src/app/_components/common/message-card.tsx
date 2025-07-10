"use client";

import { cn } from "@/libs/utils.lib";
import type { Fragment, MessageRole, MessageType } from "@prisma/client";
import { format } from "date-fns";
import { ChevronRightIcon, Code2Icon } from "lucide-react";
import Image from "next/image";
import { Card } from "../ui/card";

interface AssistantMessageProps {
  content: string;
  fragment: Fragment | null;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
  createdAt: Date;
}

interface UserMessageProps {
  content: string;
}

interface FragmentCardProps {
  fragment: Fragment;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
}

function FragmentCard({
  fragment,
  isActiveFragment,
  onFragmentClick,
}: FragmentCardProps) {
  return (
    <button
      className={cn(
        "bg-muted hover:bg-secondary flex w-fit cursor-pointer items-start gap-2 rounded-lg border p-3 text-start transition-colors",
        isActiveFragment &&
          "bg-primary text-primary-foreground border-primary hover:bg-primary",
      )}
      onClick={() => onFragmentClick(fragment)}
    >
      <Code2Icon className="mt-0.5 size-4" />
      <div className="flex flex-1 flex-col">
        <span className="line-clamp-1 text-sm font-medium">
          {fragment.title}
        </span>
        <span className="text-sm">Preview</span>
      </div>
      <div className="mt-0.5 flex items-center justify-center">
        <ChevronRightIcon className="size-4" />
      </div>
    </button>
  );
}

function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end pr-2 pb-4 pl-10">
      <Card className="bg-muted max-w-4/5 rounded-lg border-none p-3 break-words shadow-none">
        {content}
      </Card>
    </div>
  );
}

function AssistantMessage({
  content,
  fragment,
  isActiveFragment,
  onFragmentClick,
  createdAt,
  type,
}: AssistantMessageProps) {
  return (
    <div
      className={cn(
        "group flex flex-col px-2 pb-4",
        type === "ERROR" && "text-red-700 dark:text-red-500",
      )}
    >
      <div className="mb-2 flex items-center gap-2 pl-2">
        <Image
          src="/logo.svg"
          alt="Sagent"
          width={18}
          height={18}
          className="shrink-0"
        />
        <span className="text-sm font-medium">Sagent</span>
        <span className="text-muted-foreground text-xs opacity-0 transition-opacity group-hover:opacity-100">
          {format(createdAt, "HH:mm 'on' MMM dd, yyyy")}
        </span>
      </div>
      <div className="flex flex-col gap-y-4 pl-8.5">
        <span>{content}</span>
        {fragment && type === "RESULT" && (
          <FragmentCard
            fragment={fragment}
            isActiveFragment={isActiveFragment}
            onFragmentClick={onFragmentClick}
          />
        )}
      </div>
    </div>
  );
}

interface MessageCardProps {
  content: string;
  role: MessageRole;
  fragment: Fragment | null;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
  createdAt: Date;
}

export default function MessageCard({
  content,
  role,
  fragment,
  isActiveFragment,
  onFragmentClick,
  type,
  createdAt,
}: MessageCardProps) {
  if (role === "ASSISTANT")
    return (
      <AssistantMessage
        content={content}
        fragment={fragment}
        isActiveFragment={isActiveFragment}
        onFragmentClick={onFragmentClick}
        type={type}
        createdAt={createdAt}
      />
    );
  return <UserMessage content={content} />;
}
