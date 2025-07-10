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

export function convertFilesToTreeView(
  files: Record<string, string>,
): TreeViewItem[] {
  // Define proper type for tree structure
  interface TreeNode {
    [key: string]: TreeNode | null;
  }

  // Build a tree structure first
  const tree: TreeNode = {};

  // Sort files to ensure consistent ordering
  const sortedPaths = Object.keys(files).sort();

  for (const filePath of sortedPaths) {
    const parts = filePath.split("/");
    let current = tree;

    // Navigate/create the tree structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part) {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }

    // Add the file (leaf node)
    const fileName = parts[parts.length - 1];
    if (fileName) {
      current[fileName] = null; // null indicates it's a file
    }
  }

  // Convert tree structure to TreeItem format
  function convertNode(
    node: TreeNode,
    name?: string,
  ): TreeViewItem[] | TreeViewItem {
    const entries = Object.entries(node);

    if (entries.length === 0) {
      return name || "";
    }

    const children: TreeViewItem[] = [];

    for (const [key, value] of entries) {
      if (value === null) {
        // It's a file
        children.push(key);
      } else {
        // It's a folder
        const subTree = convertNode(value, key);
        if (Array.isArray(subTree)) {
          children.push([key, ...subTree]);
        } else {
          children.push([key, subTree]);
        }
      }
    }

    return children;
  }

  const result = convertNode(tree);
  return Array.isArray(result) ? result : [result];
}
