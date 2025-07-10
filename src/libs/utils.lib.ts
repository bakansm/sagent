import type { FileCollection } from "@/app/_components/common/file-explorer";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLanguageFromFileExtension(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension || "text";
}

export type TreeViewItem = string | [string, ...TreeViewItem[]];

interface TreeNode {
  [key: string]: TreeNode | null;
}

export function convertFilesToTreeView(files: FileCollection) {
  const tree: TreeNode = {};

  const sortedPath = Object.keys(files).sort();

  for (const path of sortedPath) {
    const parts = path.split("/");
    let currentNode: TreeNode = tree;

    for (const part of parts) {
      if (!currentNode[part]) {
        currentNode[part] = {};
      }
      currentNode = currentNode[part] as TreeNode;
    }

    const fileName = parts.pop();
    if (fileName) {
      currentNode[fileName] = null;
    }
  }

  const convertNode = (
    node: TreeNode,
    name?: string,
  ): TreeViewItem[] | TreeViewItem => {
    const entries = Object.entries(node);

    if (entries.length === 0) {
      return name || "";
    }

    const children = entries.map(([key, value]) => {
      if (value === null) {
        return key;
      }
      return convertNode(value, key);
    });

    return [name || "", ...children] as TreeViewItem[];
  };

  return convertNode(tree);
}
