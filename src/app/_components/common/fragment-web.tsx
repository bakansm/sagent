"use client";

import type { Fragment } from "@prisma/client";
import { ExternalLinkIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

interface FragmentWebProps {
  data: Fragment;
}

export default function FragmentWeb({ data }: FragmentWebProps) {
  const [fragmentKey, setFragmentKey] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [sandboxUrl, setSandboxUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
    setIsLoading(true);
  };

  const handleCopy = async () => {
    if (!data.sandboxUrl) return;
    await navigator.clipboard.writeText(data.sandboxUrl);
    toast.success("Copied sandbox url to clipboard");
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  useEffect(() => {
    if (data?.sandboxUrl) {
      setSandboxUrl(data.sandboxUrl);
      setIsLoading(true); // Set loading to true when sandboxUrl changes
    }
  }, [data?.sandboxUrl]);

  return (
    <div className="relative flex h-full w-full flex-col">
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
      {isLoading && (
        <div className="bg-background/80 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
          <p className="bg-primary flex items-center rounded-md p-4">
            <Loader2Icon className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-muted-foreground ml-2">
              Loading sandbox...
            </span>
          </p>
        </div>
      )}

      <iframe
        key={fragmentKey}
        className="h-full w-full"
        sandbox="allow-forms allow-scripts allow-same-origin"
        loading="lazy"
        src={sandboxUrl}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
