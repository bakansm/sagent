"use client";

import { Button } from "@/app/_components/ui/button";
import { Form, FormField } from "@/app/_components/ui/form";
import { Textarea } from "@/app/_components/ui/textarea";
import { cn } from "@/libs/utils.lib";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SendIcon, ZapIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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

  const { data: user } = api.user.getUser.useQuery();
  const utils = api.useUtils();

  const { refetch: refetchMessages } = api.message.getMessages.useQuery({
    threadId,
  });

  const { mutateAsync: sendMessage, isPending: isSendingMessage } =
    api.message.sendMessage.useMutation({
      onSuccess: async (result) => {
        if (result.success) {
          form.reset();
          await refetchMessages();
          await utils.user.getBillingInfo.invalidate();
          toast.success("Message sent successfully!");
        } else {
          toast.error(result.error);
        }
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

  const creditsColor =
    user?.credits && user.credits > 0
      ? user.credits > 10
        ? "text-green-600"
        : "text-yellow-600"
      : "text-red-500";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative rounded-2xl border bg-white/50 p-3 backdrop-blur-sm transition-all duration-300 dark:bg-gray-900/50",
          isFocused && "shadow-2xl ring-2 ring-blue-500/20",
          isSendingMessage && "animate-pulse",
        )}
      >
        <div className="relative">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="What would you like to build? Describe your next feature..."
                rows={4}
                disabled={isSendingMessage}
                className="placeholder:text-muted-foreground/70 field-sizing-content h-fit max-h-48 min-h-20 resize-none border-none bg-transparent p-4 text-base shadow-none outline-none focus-visible:ring-0 md:text-lg dark:bg-transparent"
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

          {/* Enhanced bottom bar */}
          <div className="flex items-center justify-between gap-x-4 pt-3">
            <div className="flex items-center gap-x-2">
              <ZapIcon className="h-4 w-4 text-yellow-500" />
              <span className={cn("text-sm font-medium", creditsColor)}>
                {user?.credits ?? 0} credits remaining
              </span>
            </div>
            <Button
              type="submit"
              disabled={isSendingMessage || !form.formState.isValid}
              size="lg"
              className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 text-white transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
            >
              {isSendingMessage ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <SendIcon className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
