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
    <div className="h-screen w-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex min-h-0 flex-col"
        >
          {/* <Suspense fallback={<div>Loading Project...</div>}>
            <ThreadHeader threadId={threadId} />
          </Suspense> */}
          <Suspense fallback={<div>Loading Messages...</div>}>
            <MessageContainer
              threadId={threadId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          defaultSize={65}
          minSize={50}
          className="flex min-h-0 flex-col"
        >
          <Tabs
            className="h-full gap-y-0"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value) => setTabState(value as "preview" | "code")}
          >
            <TabsList>
              <TabsTrigger value="preview" className="rounded-md">
                <EyeIcon />
                <span>Preview</span>
              </TabsTrigger>
              <TabsTrigger value="code" className="rounded-md">
                <CodeIcon />
                <span>Code</span>
              </TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-x-2">
              <Button variant="default" asChild size={"sm"}>
                <Link href={`/pricing `}>
                  <CrownIcon /> Upgrade
                </Link>
              </Button>
            </div>
            <TabsContent value="preview">
              {!!activeFragment && <FragmentWeb data={activeFragment} />}
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
              {!!activeFragment && (
                <FileExplorer files={activeFragment.files as FileCollection} />
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
