"use client";

import type { Fragment } from "@prisma/client";
import { CodeIcon, CrownIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";

import { FileExplorer, type FileCollection } from "../../common/file-explorer";
import FragmentWeb from "../../common/fragment-web";
import MessageContainer from "../../common/message-container";
import { Button } from "../../ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../../ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";

interface ProjectViewProps {
  threadId: string;
}

export default function ProjectView({ threadId }: ProjectViewProps) {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code">("preview");

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-50/20 to-blue-50/10 dark:from-gray-950/20 dark:to-blue-950/15">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex min-h-0 flex-col border-r border-white/20 bg-white/80 backdrop-blur-md dark:border-gray-800/30 dark:bg-gray-900/80"
        >
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="rounded-xl bg-white/50 p-6 shadow-lg backdrop-blur-sm dark:bg-gray-900/50">
                  <div className="animate-pulse text-center">
                    <div className="mb-2 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              </div>
            }
          >
            <MessageContainer
              threadId={threadId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle className="w-1 bg-gradient-to-b from-blue-500/20 to-purple-500/20 transition-colors hover:from-blue-500/40 hover:to-purple-500/40" />
        <ResizablePanel
          defaultSize={65}
          minSize={50}
          className="flex min-h-0 flex-col bg-white/80 backdrop-blur-md dark:bg-gray-900/80"
        >
          <Tabs
            className="h-full gap-y-0"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value) => setTabState(value as "preview" | "code")}
          >
            <div className="flex w-full items-center justify-between border-b border-white/20 bg-white/50 p-4 backdrop-blur-sm dark:border-gray-800/30 dark:bg-gray-900/50">
              <TabsList className="border border-white/20 bg-white/80 backdrop-blur-sm dark:border-gray-800/30 dark:bg-gray-900/80">
                <TabsTrigger
                  value="preview"
                  className="rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <EyeIcon className="mr-2 h-4 w-4" />
                  <span>Preview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
                >
                  <CodeIcon className="mr-2 h-4 w-4" />
                  <span>Code</span>
                </TabsTrigger>
              </TabsList>
              <Button
                variant="default"
                asChild
                size="sm"
                className="rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white transition-all duration-200 hover:scale-105 hover:from-yellow-600 hover:to-orange-600"
              >
                <Link href="/billing">
                  <CrownIcon className="mr-2 h-4 w-4" />
                  Upgrade
                </Link>
              </Button>
            </div>
            <TabsContent value="preview" className="m-0 flex-1 p-0">
              {!!activeFragment ? (
                <FragmentWeb data={activeFragment} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-md rounded-2xl border border-white/20 bg-white/50 p-8 text-center shadow-lg backdrop-blur-sm dark:border-gray-800/30 dark:bg-gray-900/50">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50">
                      <EyeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                      No Preview Available
                    </h3>
                    <p className="text-muted-foreground">
                      Start a conversation to see your app preview here
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="code" className="m-0 min-h-0 flex-1 p-0">
              {!!activeFragment ? (
                <FileExplorer files={activeFragment.files as FileCollection} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-md rounded-2xl border border-white/20 bg-white/50 p-8 text-center shadow-lg backdrop-blur-sm dark:border-gray-800/30 dark:bg-gray-900/50">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50">
                      <CodeIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                      No Code Available
                    </h3>
                    <p className="text-muted-foreground">
                      Start a conversation to see your generated code here
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
