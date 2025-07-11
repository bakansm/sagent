"use client";

import { cn } from "@/libs/utils.lib";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, SendIcon } from "lucide-react";
import { useState } from "react";
import { Form, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../ui/button";
import { FormField } from "../ui/form";
import { Textarea } from "../ui/textarea";

interface MessageFormProps {
  threadId: string;
}

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Message is required" })
    .max(1000, { message: "Message must be less than 1000 characters" }),
});

export default function MessageForm({ threadId }: MessageFormProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showUsage] = useState(false);

  const { data: user } = api.user.getUser.useQuery();

  const { refetch: refetchMessages } = api.message.getMessages.useQuery({
    threadId,
  });

  const { mutateAsync: sendMessage, isPending: isSendingMessage } =
    api.message.sendMessage.useMutation({
      onSuccess: async () => {
        form.reset();
        await refetchMessages();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await sendMessage({
      message: data.value,
      threadId,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "bg-sidebar dark:bg-sidebar relative rounded-xl border p-2 transition-all",
          isFocused && "shadow-xs",
          showUsage && "roudned-t-none",
        )}
      >
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <Textarea
              {...field}
              placeholder="What would you like to build?"
              rows={4}
              disabled={isSendingMessage}
              className="field-sizing-content h-fit max-h-40 min-h-18 resize-none border-none p-2 shadow-none outline-none focus-visible:ring-0"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  await form.handleSubmit(onSubmit)();
                }
              }}
            />
          )}
        />
        <div className="flex items-end justify-between gap-x-2 pt-2">
          <div className="flex items-center gap-x-2">
            <span className="text-muted-foreground text-sm">
              Credits: {user?.credits ?? 0}
            </span>
          </div>
          <Button
            type="submit"
            disabled={isSendingMessage || !form.formState.isValid}
            size="icon"
            className="size-8 rounded-full"
          >
            {isSendingMessage ? (
              <Loader2 className="animate-spin" />
            ) : (
              <SendIcon />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
