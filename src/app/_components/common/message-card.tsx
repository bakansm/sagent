"use client";

import { cn } from "@/libs/utils.lib";
import type {
  Fragment,
  MessageRole,
  MessageStatus,
  MessageType,
} from "@prisma/client";
import { format } from "date-fns";
import {
  AlertCircleIcon,
  BotIcon,
  ChevronRightIcon,
  Code2Icon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import Image from "next/image";
import { Card } from "../ui/card";

interface AssistantMessageProps {
  content: string;
  fragment: Fragment | null;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
  createdAt: Date;
  status: MessageStatus;
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
        "group relative rounded-2xl border bg-white/50 p-4 text-start backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-lg dark:bg-gray-900/50",
        isActiveFragment
          ? "border-blue-500/50 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg dark:from-blue-950 dark:to-purple-950"
          : "border-gray-200/50 hover:border-blue-300/50 dark:border-gray-700/50",
      )}
      onClick={() => onFragmentClick(fragment)}
    >
      {/* Gradient overlay for active state */}
      {isActiveFragment && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
      )}

      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
            isActiveFragment
              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
              : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-gray-800 dark:text-gray-400",
          )}
        >
          <Code2Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h4
              className={cn(
                "truncate text-sm font-semibold",
                isActiveFragment
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-gray-900 dark:text-white",
              )}
            >
              {fragment.title}
            </h4>
            <ChevronRightIcon
              className={cn(
                "h-4 w-4 transition-transform duration-200 group-hover:translate-x-1",
                isActiveFragment ? "text-blue-600" : "text-gray-400",
              )}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Click to preview in code panel
          </p>
        </div>
      </div>
    </button>
  );
}

function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end px-4 pb-6">
      <div className="flex max-w-[80%] items-start gap-3">
        <Card className="relative rounded-2xl border-0 bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white shadow-lg">
          {content}
        </Card>

        <div className="mt-1 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
            <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
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
  status,
}: AssistantMessageProps) {
  const isError = type === "ERROR";

  return (
    <div className="group px-4 pb-6">
      <div className="flex items-start gap-3">
        {/* Assistant Avatar */}
        <div className="mt-1 flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-0 h-8 w-8 animate-pulse rounded-full bg-green-500/20 blur-sm"></div>
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900">
              {isError ? (
                <AlertCircleIcon className="h-4 w-4 text-red-500" />
              ) : (
                <BotIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-3 flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 h-5 w-5 rounded-full bg-green-500/20 blur-sm"></div>
              <Image
                src="/logo.svg"
                alt="Sagent"
                width={20}
                height={20}
                className="relative z-10 drop-shadow-sm"
              />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Sagent
            </span>
            <span className="text-muted-foreground text-xs opacity-0 transition-opacity group-hover:opacity-100">
              {format(createdAt, "HH:mm 'on' MMM dd")}
            </span>
          </div>

          {/* Message Body */}
          <Card
            className={cn(
              "relative rounded-2xl border p-4 shadow-sm backdrop-blur-sm transition-all duration-200",
              isError
                ? "border-red-200 bg-red-50/50 text-red-700 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-300"
                : "border-gray-200/50 bg-white/50 dark:border-gray-700/50 dark:bg-gray-900/50",
            )}
          >
            {/* Gradient overlay */}
            <div
              className={cn(
                "absolute inset-0 rounded-2xl opacity-50",
                isError
                  ? "bg-gradient-to-br from-red-500/5 to-pink-500/5"
                  : "bg-gradient-to-br from-green-500/5 to-blue-500/5",
              )}
            ></div>

            <div className="relative z-10">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {status === "PROCESSING" ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500 delay-75"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-green-500 delay-150"></div>
                    </div>
                    <span className="animate-pulse text-sm font-medium text-gray-600 dark:text-gray-400">
                      {content}
                    </span>
                    <SparklesIcon className="h-4 w-4 animate-pulse text-yellow-500" />
                  </div>
                ) : (
                  content
                )}
              </div>

              {/* Fragment Preview */}
              {fragment && type === "RESULT" && (
                <div className="mt-4 border-t border-gray-200/50 pt-4 dark:border-gray-700/50">
                  <FragmentCard
                    fragment={fragment}
                    isActiveFragment={isActiveFragment}
                    onFragmentClick={onFragmentClick}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
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
  status: MessageStatus;
}

export default function MessageCard({
  content,
  role,
  fragment,
  isActiveFragment,
  onFragmentClick,
  type,
  createdAt,
  status,
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
        status={status}
      />
    );
  return <UserMessage content={content} />;
}
