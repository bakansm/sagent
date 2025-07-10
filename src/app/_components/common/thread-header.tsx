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
  const [thread] = api.thread.getThread.useSuspenseQuery({ threadId });

  const { setTheme, theme } = useTheme();

  return (
    <header className="flex items-center justify-between border-b p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={"ghost"}
            size={"sm"}
            className="pl-2! transition-opacity hover:bg-transparent hover:opacity-75 focus-visible:ring-0"
          >
            <Image
              src={"/logo.svg"}
              alt="Sagent Logo"
              width={18}
              height={18}
              className="shrink-0"
            />
            <span className="text-sm font-medium">{thread.name}</span>
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href={`/`}>
              <ChevronLeftIcon />
              <span className="text-sm font-medium">Go to dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <SunMoonIcon className="text-muted-foreground size-4" />
              <span>Appearance</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value)}
              >
                <DropdownMenuRadioItem value="light">
                  <span>Light</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <span>Dark</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <span>System</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
