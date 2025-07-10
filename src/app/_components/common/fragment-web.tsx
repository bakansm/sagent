"use client";

import { getSandbox } from "@/inngest/utils";
import type { Fragment } from "@prisma/client";
import { ExternalLinkIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

interface FragmentWebProps {
  data: Fragment;
}

export default function FragmentWeb({ data }: FragmentWebProps) {
  const [fragmentKey, setFragmentKey] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchSandbox = async () => {
      await getSandbox(data.sandboxId);
    };
    fetchSandbox();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.sandboxUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="bg-sidebar flex items-center gap-x-2 border-b p-2">
        <Button size={"sm"} variant={"outline"} onClick={onRefresh}>
          <RefreshCwIcon />
        </Button>
        <Button
          size={"sm"}
          variant={"outline"}
          onClick={handleCopy}
          disabled={!data.sandboxUrl || copied}
          className="flex-1 justify-start font-normal"
        >
          <span className="truncate">{data.sandboxUrl}</span>
        </Button>
        <Button
          size={"sm"}
          disabled={!data.sandboxUrl}
          variant={"outline"}
          onClick={() => {
            if (!data.sandboxUrl) return;
            window.open(data.sandboxUrl, "_blank ");
          }}
        >
          <ExternalLinkIcon />
        </Button>
      </div>
      <iframe
        key={fragmentKey}
        className="h-full w-full"
        sandbox="allow-forms allow-scripts allow-same-origin"
        loading="lazy"
        src={data.sandboxUrl}
      />
    </div>
  );
}
