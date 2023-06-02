import type { TreeDataConfig, TreeNode } from "./types";

/**
 * Ensures that the path is a valid path JSON pointer/path (RFC 6901)
 * @param path
 */
export function validPath(path: string) {
  return path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

/**
 * Transforms a node of type T with a path and name property into a TreeNode<T>
 *   Note: Children are added later
 * @param node
 * @param path
 * @param name
 * @param hasChildrenHint
 */
export function transformDataToTreeNode<T>(
  node: T,
  path: keyof T,
  name: keyof T,
  hasChildrenHint: boolean
): TreeNode<T> {
  const id = validPath(`${node[path]}/${node[name]}`);
  return {
    name: node[name],
    path: node[path],
    id,
    data: node,
    children: [], // Children are added later
    hasChildrenHint,
  };
}

/**
 * Transforms a list of data of type T with a path and name property into a list of TreeNode<T>
 * @param config
 */
export function transformDataToTreeNodes<T>(
  config: TreeDataConfig<T> & {
    onHintChildren?: (node: T) => Promise<boolean> | boolean;
  }
): TreeNode<T>[] {
  const { onHintChildren } = config;

  const treeNodeData = config.data.map((data) =>
    transformDataToTreeNode(
      data,
      config.path,
      config.name,
      // we only care about loading children on click if we have a callback
      !!onHintChildren && !!onHintChildren
    )
  );

  // Add children to each node
  treeNodeData.forEach(
    (node) => (node.children = getChildren(node, treeNodeData).map((n) => n.id))
  );

  // Sort nodes by id. This is important for navigation
  treeNodeData.sort((a, b) => a.id.localeCompare(b.id));

  // Add root node to return value
  const children = treeNodeData.filter((n) => n.path === "").map((n) => n.id);
  return [
    { name: "", path: "", id: "/", data: {} as T, children } as TreeNode<T>,
    ...treeNodeData,
  ];
}

/**
 * Returns the children of a node by filtering the list of nodes to match the parent id using node's path
 * @param node
 * @param list
 */
export function getChildren<T>(node: TreeNode<T>, list: TreeNode<T>[]) {
  return list.filter((n) => n.path === node.id);
}

/**
 * Returns a new list of children when a parent node is clicked.
 * @param node
 * @param children
 * @param data
 */
export const updateChildren = (
  node: TreeNode,
  children: TreeNode[],
  data: TreeNode[]
) => {
  const parentIndex = data.findIndex((n) => n.id === node.id);
  const parent = data[parentIndex];
  if (!parent) throw new Error("parent not found");
  const newData = data.filter((n) => n.path !== node.id);
  newData.splice(parentIndex + 1, 0, ...children);
  newData.sort((a, b) => {
    return a.id.localeCompare(b.id);
  });
  return newData;
};
