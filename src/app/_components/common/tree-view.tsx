import type { TreeViewItem } from "@/libs/utils.lib";
import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "../ui/sidebar";

interface TreeViewProps {
  files: TreeViewItem[] | TreeViewItem;
  setActiveFile: (path: string) => void;
  activeFile: string | undefined;
}

export default function TreeView({
  files,
  setActiveFile,
  activeFile,
}: TreeViewProps) {
  const isArray = Array.isArray(files);

  return (
    <SidebarProvider>
      <Sidebar collapsible="none" className="w-full">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Files</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isArray ? (
                  files.map((file, index) => (
                    <Tree
                      key={index}
                      item={file}
                      selectedValue={activeFile}
                      onSelect={setActiveFile}
                      parentPath=""
                    />
                  ))
                ) : (
                  <Tree
                    item={files as TreeViewItem}
                    selectedValue={activeFile}
                    onSelect={setActiveFile}
                    parentPath=""
                  />
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  );
}

interface TreeProps {
  item: TreeViewItem;
  selectedValue?: string | null;
  onSelect?: (value: string) => void;
  parentPath: string;
  level?: number; // add level for indentation
}

function Tree({
  item,
  selectedValue,
  onSelect,
  parentPath,
  level = 0,
}: TreeProps) {
  const indent = { paddingLeft: `${level * 16}px` };

  if (typeof item === "string") {
    const currentPath = parentPath ? `${parentPath}/${item}` : item;
    const isSelected = selectedValue === currentPath;
    return (
      <SidebarMenuButton
        isActive={isSelected}
        style={indent}
        onClick={() => onSelect?.(currentPath)}
      >
        <FileIcon />
        <span>{item}</span>
      </SidebarMenuButton>
    );
  }

  // item is [folderName, ...children]
  const [name, ...children] = item;
  const currentPath = parentPath ? `${parentPath}/${name}` : name;

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:last-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton style={indent}>
            <FolderIcon />
            <span className="truncate">{name}</span>
            <ChevronRightIcon className="ml-auto transition-transform" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-y-1">
            {children.map((child, index) => (
              <Tree
                key={index}
                item={child}
                selectedValue={selectedValue}
                onSelect={onSelect}
                parentPath={currentPath}
                level={level + 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
