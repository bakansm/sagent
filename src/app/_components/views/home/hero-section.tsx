"use client";

import { PROMPT } from "@/constants/prompt.constant";
import { cn } from "@/libs/utils.lib";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePrivy } from "@privy-io/react-auth";
import { Loader2Icon, SendIcon, SparklesIcon, ZapIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../ui/button";
import { Form, FormField } from "../../ui/form";
import { Textarea } from "../../ui/textarea";
import { TypingAnimation } from "../../ui/typing-animation";

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Message is required" })
    .max(1000, { message: "Message must be less than 1000 characters" }),
});

export default function HeroSection() {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);

  const examples = useMemo(
    () => [
      "a task management app",
      "an e-commerce store",
      "a social media dashboard",
      "a portfolio website",
      "a music streaming app",
    ],
    [],
  );

  const { authenticated, login } = usePrivy();

  const { data: user } = api.user.getUser.useQuery(undefined, {
    enabled: authenticated,
  });
  const utils = api.useUtils();

  const { mutateAsync: createThread, isPending: isCreatingThread } =
    api.thread.createThread.useMutation({
      onSuccess: async (result) => {
        if (result.success && result.thread) {
          await utils.user.getUser.invalidate();
          router.push(`/thread/${result.thread.id}`);
          toast.success("New conversation started!");
        } else if (!result.success) {
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

  // Cycle through examples
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % examples.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [examples.length]);

  const onSelect = (content: string) => {
    form.setValue("value", content, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (authenticated) {
      await createThread({
        value: data.value,
      });
    } else {
      login();
    }
  };

  const creditsColor =
    user?.credits && user.credits > 0
      ? user.credits > 10
        ? "text-green-600"
        : "text-yellow-600"
      : "text-red-500";

  return (
    <section className="relative space-y-8 px-4 py-[12vh] text-center sm:px-6 lg:px-8 2xl:py-32">
      {/* Logo with glow effect */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full bg-blue-500/20 blur-xl"></div>
          <Image
            src="/logo.svg"
            alt="Sagent"
            width={64}
            height={64}
            className="relative z-0 mx-auto drop-shadow-lg"
          />
        </div>
      </div>

      {/* Main headline with gradient */}
      <div className="space-y-4">
        <h1 className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-6xl lg:text-7xl">
          Build anything with Sagent{" "}
          <SparklesIcon className="absolute top-0 right-0 h-6 w-6 animate-bounce text-yellow-400" />
        </h1>

        {/* Dynamic typewriter subtitle */}
        <div className="mx-auto max-w-4xl">
          <p className="text-muted-foreground text-lg md:text-xl lg:text-2xl">
            Create{" "}
            <TypingAnimation
              key={currentExample}
              className="text-lg leading-normal font-semibold text-blue-600 md:text-xl lg:text-2xl"
              duration={100}
              delay={200}
              as="span"
            >
              {examples[currentExample] || ""}
            </TypingAnimation>{" "}
            <br className="sm:hidden" />
            in seconds with AI-powered development
          </p>
        </div>
      </div>

      {/* Enhanced input form */}
      <div className="mx-auto w-full max-w-4xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className={cn(
              "relative rounded-2xl border bg-white/50 p-3 backdrop-blur-sm transition-all duration-300 dark:bg-gray-900/50",
              isFocused && "shadow-2xl ring-2 ring-blue-500/20",
              isCreatingThread && "animate-pulse",
            )}
          >
            <div className="relative">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="What would you like to build today? Describe your dream app..."
                    rows={4}
                    disabled={isCreatingThread}
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
                <div className="flex items-center gap-x-4">
                  <div className="flex items-center gap-x-2">
                    <ZapIcon className="h-4 w-4 text-yellow-500" />
                    <span className={cn("text-sm font-medium", creditsColor)}>
                      {user?.credits ?? 0} credits remaining
                    </span>
                  </div>
                  {!authenticated && (
                    <span className="text-muted-foreground text-xs">
                      Sign in for more credits
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    isCreatingThread ||
                    !form.formState.isValid ||
                    !form.watch("value")?.trim()
                  }
                  size="lg"
                  className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 text-white transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {isCreatingThread ? (
                    <>
                      <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <SendIcon className="mr-2 h-5 w-5" />
                      Build Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>

        {/* Enhanced template buttons */}
        <div className="mt-8">
          <p className="text-muted-foreground mb-4 text-sm font-medium">
            Or try one of these popular templates:
          </p>
          <div className="flex max-w-4xl flex-wrap justify-center gap-3">
            {PROMPT.TEMPLATE_PROMPT.map((template, index) => (
              <Button
                key={template.title}
                variant="outline"
                size="sm"
                className={cn(
                  "group relative rounded-full border-2 bg-white/80 px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-lg dark:bg-gray-900/80",
                  "hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-950/50",
                )}
                onClick={() => onSelect(template.prompt)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="relative z-10">{template.title}</span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
