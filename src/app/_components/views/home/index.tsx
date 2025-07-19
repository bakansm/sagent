"use client";

import { PROMPT } from "@/constants/prompt.constant";
import { cn } from "@/libs/utils.lib";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePrivy } from "@privy-io/react-auth";
import {
  CodeIcon,
  CreditCardIcon,
  Loader2Icon,
  PaletteIcon,
  RocketIcon,
  SendIcon,
  SmartphoneIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

const features = [
  {
    icon: CodeIcon,
    title: "AI-Powered Development",
    description:
      "Build full-stack applications with intelligent code generation",
  },
  {
    icon: RocketIcon,
    title: "Instant Deployment",
    description: "See your creations come to life in real-time",
  },
  {
    icon: PaletteIcon,
    title: "Beautiful UI/UX",
    description: "Create stunning interfaces with modern design patterns",
  },
  {
    icon: SmartphoneIcon,
    title: "Responsive Design",
    description: "Build apps that work perfectly on all devices",
  },
];

export default function HomeView() {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [displayText, setDisplayText] = useState("");
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

  // Typewriter effect for examples
  useEffect(() => {
    const typeExample = async () => {
      setIsTyping(true);
      const currentText = examples[currentExample];

      if (!currentText) {
        setIsTyping(false);
        return;
      }

      // Type out the text
      for (let i = 0; i <= currentText.length; i++) {
        setDisplayText(currentText.slice(0, i));
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Wait before erasing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Erase the text
      for (let i = currentText.length; i >= 0; i--) {
        setDisplayText(currentText.slice(0, i));
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      setIsTyping(false);
      setCurrentExample((prev) => (prev + 1) % examples.length);
    };

    const interval = setInterval(() => void typeExample(), 4000);
    return () => clearInterval(interval);
  }, [currentExample, examples]);

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
    <div className="relative mx-auto flex w-full max-w-7xl flex-col overflow-hidden">
      {/* Hero Section */}
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
              <span className="inline-block min-w-[200px] text-left">
                <span className="font-semibold text-blue-600">
                  {displayText}
                  {isTyping && <span className="animate-pulse">|</span>}
                </span>
              </span>{" "}
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

      {/* Features Section */}
      <section className="rounded-md border bg-gray-50/10 px-4 py-16 backdrop-blur-xs sm:px-6 lg:px-8 dark:bg-gray-900/5">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl dark:text-white">
              Why Choose Sagent?
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Experience the future of development with our AI-powered platform
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl dark:bg-gray-900/50"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            Ready to start building?
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Join thousands of developers who are already creating amazing apps
            with Sagent
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-white transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700"
              onClick={() => {
                const textarea = document.querySelector("textarea");
                textarea?.focus();
              }}
            >
              <RocketIcon className="mr-2 h-5 w-5" />
              Start Building Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-xl border-2 px-8 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-900"
              asChild
            >
              <Link href="/billing">
                <CreditCardIcon className="mr-2 h-5 w-5" />
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
