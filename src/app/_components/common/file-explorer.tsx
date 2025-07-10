import {
  convertFilesToTreeView,
  getLanguageFromFileExtension,
} from "@/libs/utils.lib";
import { CopyCheckIcon, CopyIcon } from "lucide-react";
import { Fragment, useCallback, useMemo, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Button } from "../ui/button";
import { CodeView } from "../ui/code-view";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
import TreeView from "./tree-view";

export type FileCollection = {
  [path: string]: string;
};

interface FileExplorerProps {
  files: FileCollection;
}

interface FileExplorerProps {
  files: FileCollection;
}

interface FileBreadcrumbProps {
  path: string;
}

function FileBreadcrumb({ path }: FileBreadcrumbProps) {
  const pathParts = path.split("/");
  const maxParts = 4;

  const breadcrumbItems = () => {
    if (pathParts.length <= maxParts) {
      return pathParts.map((part, index) => {
        const isLast = index === pathParts.length - 1;
        return (
          <Fragment key={index}>
            <BreadcrumbItem>
              {isLast ? (
                <BreadcrumbPage className="font-medium">{part}</BreadcrumbPage>
              ) : (
                <span className="text-muted-foreground">{part}</span>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </Fragment>
        );
      });
    } else {
      const firstPart = pathParts[0];
      const lastPart = pathParts[pathParts.length - 1];
      return (
        <Fragment>
          <BreadcrumbItem>
            <span className="text-muted-foreground">{firstPart}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">{lastPart}</BreadcrumbPage>
          </BreadcrumbItem>
        </Fragment>
      );
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>{breadcrumbItems()}</BreadcrumbList>
    </Breadcrumb>
  );
}

export function FileExplorer({ files }: FileExplorerProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [activeFile, setActiveFile] = useState<string | undefined>(() => {
    const fileKeys = Object.keys(files);
    if (fileKeys.length === 0) return undefined;
    return fileKeys[0];
  });

  const handleCopyPath = useCallback(() => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  }, [activeFile]);

  const treeView = useMemo(() => {
    return convertFilesToTreeView(files);
  }, [files]);

  const handleSelectFile = useCallback(
    (path: string) => {
      if (files[path]) {
        setActiveFile(path);
      }
    },
    [files],
  );

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={30} minSize={20} className="bg-sidebar">
        <TreeView
          files={treeView}
          setActiveFile={handleSelectFile}
          activeFile={activeFile}
        />
      </ResizablePanel>
      <ResizableHandle className="hover:bg-primary transition-colors" />
      <ResizablePanel defaultSize={70} minSize={50} className="bg-sidebar">
        {activeFile && files[activeFile] ? (
          <div className="flex h-full w-full flex-col">
            <div className="bg-sidebar flex items-center justify-between gap-x-2 border-b px-4 py-2">
              <FileBreadcrumb path={activeFile} />
              <Button
                variant={"outline"}
                size={"icon"}
                className="ml-auto"
                onClick={handleCopyPath}
                disabled={isCopied}
              >
                {isCopied ? (
                  <CopyCheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <CodeView
                code={files[activeFile]}
                language={getLanguageFromFileExtension(activeFile)}
              />
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <p>Select a file to view its contents</p>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
