"use client";

import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "./_components/ui/button";
import { Textarea } from "./_components/ui/textarea";

export default function Temp() {
  const { mutateAsync: createThread, isPending: isCreatingThread } =
    api.thread.createThread.useMutation({
      onSuccess: (data) => {
        router.push(`/thread/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const router = useRouter();

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleCreateThread = async () => {
    if (inputRef.current) {
      await createThread({
        value: inputRef.current.value,
      });
    }
  };

  return (
    <div className="mx-auto mt-20 w-200 space-y-4">
      <Textarea
        placeholder="Enter message"
        ref={inputRef}
        rows={4}
        className="field-sizing-content h-fit max-h-40 min-h-18 resize-none"
      />
      <Button onClick={handleCreateThread} disabled={isCreatingThread}>
        {isCreatingThread ? "Sending..." : "Send"}
      </Button>
    </div>
  );
}
