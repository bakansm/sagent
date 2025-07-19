import { api } from "@/trpc/react";

import { ChevronDownIcon, ChevronLeftIcon, SunMoonIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface ThreadHeaderProps {
  threadId: string;
}

export default function ThreadHeader({ threadId }: ThreadHeaderProps) {
  const { data: thread } = api.thread.getThread.useQuery({ threadId });

  const { setTheme, theme } = useTheme();

  return (
    <header className="flex items-center justify-between border-b border-white/20 bg-white/50 p-4 backdrop-blur-sm dark:border-gray-800/30 dark:bg-gray-900/50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 rounded-xl border-2 bg-white/50 px-3 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:bg-gray-900/50 dark:hover:bg-gray-900/80"
          >
            <div className="relative">
              <div className="absolute inset-0 h-5 w-5 rounded-full bg-blue-500/20 blur-sm"></div>
              <Image
                src="/logo.svg"
                alt="Sagent Logo"
                width={20}
                height={20}
                className="relative z-10 shrink-0 drop-shadow-sm"
              />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              {thread?.name ?? "Untitled"}
            </span>
            <ChevronDownIcon className="h-4 w-4 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56 rounded-xl border bg-white/80 shadow-lg backdrop-blur-md dark:bg-gray-900/80"
        >
          <DropdownMenuItem
            asChild
            className="rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <Link href="/" className="flex items-center gap-3 p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <ChevronLeftIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">
                  Go to Dashboard
                </span>
                <p className="text-muted-foreground text-xs">
                  Return to home page
                </p>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex cursor-pointer items-center gap-3 rounded-lg transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-950">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <SunMoonIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                Appearance
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-48 rounded-xl border bg-white/90 shadow-xl backdrop-blur-md dark:bg-gray-900/90">
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(value) => setTheme(value)}
                >
                  <DropdownMenuRadioItem
                    value="light"
                    className="cursor-pointer rounded-lg transition-all duration-200 hover:bg-yellow-500 dark:hover:bg-yellow-900"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-yellow-300 dark:bg-yellow-700">
                        🌞
                      </div>
                      <span className="font-medium">Light</span>
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="dark"
                    className="cursor-pointer rounded-lg transition-all duration-200 hover:bg-gray-500 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-300 dark:bg-gray-700">
                        🌙
                      </div>
                      <span className="font-medium">Dark</span>
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="system"
                    className="cursor-pointer rounded-lg transition-all duration-200 hover:bg-blue-500 dark:hover:bg-blue-900"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-300 dark:bg-blue-700">
                        ⚙️
                      </div>
                      <span className="font-medium">System</span>
                    </div>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
