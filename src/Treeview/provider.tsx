import React from "react";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect } from "react";
import type { IState, TreeNode } from "./types";

export type TreeViewContextProps = {
  cacheId?: string;
  state: IState;
  selectedNode?: TreeNode;
  setSelectedNode: (node?: TreeNode) => void;
  halfSelectedNode?: TreeNode;
  setHalfSelectedNode: (node?: TreeNode) => void;
  data: TreeNode[];
  setData: (data: TreeNode[]) => void;
  lazyLoadChildren: (node: TreeNode) => Promise<TreeNode[]>;
  expandedIds: string[];
  setExpandedIds: (ids: string[]) => void;
  multiSelect?: boolean;
  setMultiSelect: (val: boolean) => void;
  multiSelectedNodes: TreeNode[];
  singleClickSelect?: boolean;
  singleClickExpand?: boolean;
  defaultSelectedId?: string;
  defaultMultiSelectedIds?: string;
};

export const TreeViewContext = createContext<TreeViewContextProps>({
  state: { expandedIds: [], halfSelectedNode: undefined },
  setSelectedNode: () => {},
  setHalfSelectedNode: () => {},
  data: [],
  setData: () => {},
  lazyLoadChildren: async () => [],
  expandedIds: [],
  setExpandedIds: () => {},
  multiSelect: false,
  setMultiSelect: () => {},
  multiSelectedNodes: [],
});

// We might want to be able to access the context from outside the component tree
const contextCache = new Map<string, TreeViewContextProps>();

// The provider is responsible for caching the context
export const TreeViewProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: TreeViewContextProps;
}) => {
  useEffect(() => {
    const id = value.cacheId;
    if (id) {
      if (!contextCache.has(id)) contextCache.set(id, value);
      return () => {
        contextCache.delete(id);
      };
    }
  }, [value]);
  return (
    <TreeViewContext.Provider value={value}>
      {children}
    </TreeViewContext.Provider>
  );
};

// This hook is responsible for retrieving the context, from the cache if outside the component tree
export function useTreeView(cacheId?: string) {
  let context = useContext(TreeViewContext);
  if (cacheId) context = getTreeViewCache(cacheId) || context;
  return context;
}

// This function is responsible for retrieving the context from the cache
export function getTreeViewCache(cacheId: string) {
  return contextCache.get(cacheId);
}
