/**
 * Tree node type
 */
export type TreeNode<T = any, P = T[keyof T], N = T[keyof T]> = {
  id: string;
  name: N;
  path: P;
  data: T;
  hasChildrenHint?: boolean;
  children: string[];
};

/**
 * Tree state type
 */
export type IState = {
  halfSelectedNode?: TreeNode;
  selectedNode?: TreeNode;
  expandedIds: string[];
};

/**
 * Tree data config type
 * The path and name properties are used to access the path and name properties of the data
 * in case they are not called path and name
 */
export type TreeDataConfig<T = any> = {
  data: T[];
  path: keyof T;
  name: keyof T;
};
