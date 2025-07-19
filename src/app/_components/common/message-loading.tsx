"use client";

import { BotIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Card } from "../ui/card";

export function ShimmerMessage() {
  const shimmerMessages = [
    "Thinking...",
    "Analyzing your request...",
    "Generating code...",
    "Building solution...",
    "Creating components...",
    "Optimizing structure...",
    "Adding functionality...",
    "Almost ready...",
    "Finalizing output...",
    "Preparing preview...",
  ];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % shimmerMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [shimmerMessages.length]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
        <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500 delay-75"></div>
        <div className="h-2 w-2 animate-bounce rounded-full bg-green-500 delay-150"></div>
      </div>
      <span className="animate-pulse text-sm font-medium text-gray-600 dark:text-gray-400">
        {shimmerMessages[currentMessageIndex]}
      </span>
      <SparklesIcon className="h-4 w-4 animate-pulse text-yellow-500" />
    </div>
  );
}

export default function MessageLoading() {
  return (
    <div className="group px-4 pb-6">
      <div className="flex items-start gap-3">
        {/* Assistant Avatar */}
        <div className="mt-1 flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-0 h-8 w-8 animate-pulse rounded-full bg-green-500/20 blur-sm"></div>
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900">
              <BotIcon className="h-4 w-4 animate-pulse text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-3 flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 h-5 w-5 animate-pulse rounded-full bg-green-500/20 blur-sm"></div>
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
            <span className="text-muted-foreground text-xs">is typing...</span>
          </div>

          {/* Loading Message Body */}
          <Card className="relative rounded-2xl border border-gray-200/50 bg-white/50 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 dark:border-gray-700/50 dark:bg-gray-900/50">
            {/* Gradient overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/5 to-blue-500/5 opacity-50"></div>

            <div className="relative z-10">
              <ShimmerMessage />

              {/* Shimmer Lines */}
              <div className="mt-4 space-y-2">
                <div className="h-3 animate-pulse rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"></div>
                <div className="h-3 w-4/5 animate-pulse rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 delay-75 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"></div>
                <div className="h-3 w-3/5 animate-pulse rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 delay-150 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
