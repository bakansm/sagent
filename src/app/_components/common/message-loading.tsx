"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function ShimmerMessage() {
  const shimmerMessages = [
    "Thinking...",
    "Loading...",
    "Generating...",
    "Analyzing...",
    "Building...",
    "Creating...",
    "Preparing...",
    "Processing...",
    "Almost there...",
    "Almost ready...",
    "Optimizing...",
    "Finalizing...",
    "Almost done...",
  ];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % shimmerMessages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground animate-pulse text-base">
        {shimmerMessages[currentMessageIndex]}
      </span>
    </div>
  );
}

export default function MessageLoading() {
  return (
    <div className="group flex flex-col px-2 pb-4">
      <div className="mb-2 flex items-center gap-2 pl-2">
        <Image
          src={"/logo.svg"}
          alt="logo"
          width={16}
          height={16}
          className="shrink-0"
        />
        <span className="text-sm font-medium">Sagent</span>
      </div>
      <div className="flex flex-col gap-y-4 pl-8.5">
        <ShimmerMessage />
      </div>
    </div>
  );
}
