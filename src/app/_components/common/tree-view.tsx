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
}

function Tree({ item, selectedValue, onSelect, parentPath }: TreeProps) {
  const [name, ...items] = Array.isArray(item) ? item : [item];
  const currentPath = parentPath ? `${parentPath}/${name}` : name;

  if (!items.length) {
    const isSelected = selectedValue === currentPath;

    return (
      <SidebarMenuButton
        isActive={isSelected}
        className="data-[active=true]:bg-transparent"
        onClick={() => onSelect?.(currentPath)}
      >
        <FileIcon />
        <span>{name}</span>
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <FolderIcon />
            <span className="truncate">{name}</span>
            <ChevronRightIcon className="transition-transform" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-y-1">
            {items.map((item, index) => (
              <Tree
                key={index}
                item={item}
                selectedValue={selectedValue}
                onSelect={onSelect}
                parentPath={currentPath}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
