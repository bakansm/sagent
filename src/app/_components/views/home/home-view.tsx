"use client";

import { PROMPT } from "@/constants/prompt.constant";
import { cn } from "@/libs/utils.lib";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SendIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../ui/button";
import { Form, FormField } from "../../ui/form";
import { Textarea } from "../../ui/textarea";

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Message is required" })
    .max(1000, { message: "Message must be less than 1000 characters" }),
});

export default function HomeView() {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [showUsage] = useState(false);

  const { mutateAsync: createThread, isPending: isCreatingThread } =
    api.thread.createThread.useMutation({
      onSuccess: (data) => {
        router.push(`/thread/${data.id}`);
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

  const onSelect = (content: string) => {
    form.setValue("value", content, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await createThread({
      value: data.value,
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col">
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <Image
          src="/logo.svg"
          alt="Sagent"
          width={50}
          height={50}
          className="mx-auto hidden md:block"
        />
        <h1 className="text-center text-2xl font-bold md:text-5xl">
          Build something with Sagent
        </h1>
        <p className="text-muted-foreground text-center text-lg md:text-xl">
          Create apps and websites by chatting with AI
        </p>
        <div className="mx-auto w-full max-w-3xl">
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
                    disabled={isCreatingThread}
                    className="field-sizing-content h-fit max-h-40 min-h-18 resize-none border-none p-2 shadow-none outline-none focus-visible:ring-0"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)();
                      }
                    }}
                  />
                )}
              />
              <div className="flex items-end justify-end gap-x-2 pt-2">
                <Button
                  type="submit"
                  disabled={isCreatingThread || !form.formState.isValid}
                  size="icon"
                  className="size-8 rounded-full"
                >
                  {isCreatingThread ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <SendIcon />
                  )}
                </Button>
              </div>
            </form>
            <div className="mt-4 hidden max-w-3xl flex-wrap justify-center gap-2 md:flex">
              {PROMPT.TEMPLATE_PROMPT.map((template) => (
                <Button
                  key={template.title}
                  variant="outline"
                  size="sm"
                  className="dark:bg-sidebar rounded-full bg-white"
                  onClick={() => onSelect(template.prompt)}
                >
                  {template.title}
                </Button>
              ))}
            </div>
          </Form>
        </div>
      </section>
    </div>
  );
}
