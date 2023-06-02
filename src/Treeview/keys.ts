import type { IState, TreeNode } from "./types";

/**
 * Get the level of a tree node based on its id (aka full path)
 * @param n
 */
export function getTreeNodeLevel(n: TreeNode) {
  if (n.id === "/") return 0;
  return n.id.split("/").filter((s) => s).length;
}

/**
 * Navigate to the next node in the tree
 * @param data
 * @param state
 * @param setHalfSelectedNode
 */
export const arrowDown = (
  data: TreeNode[],
  state: IState,
  setHalfSelectedNode: (node?: TreeNode) => void
) => {
  // const lowestLevel = getLowestNodeLevel(data.map((n) => n.id)) - 1;
  const index = data.findIndex((n) => n.id === state.halfSelectedNode?.id);
  if (index >= data.length) return;
  const next = data.find((n, i) => {
    if (i <= index) return false;
    const level = getTreeNodeLevel(n);
    return 1 === level || state.expandedIds.includes(n.path);
  });
  if (next) setHalfSelectedNode(next);
};

/**
 * Navigate to the previous node in the tree
 * @param data
 * @param state
 * @param setHalfSelectedNode
 */
export const arrowUp = (
  data: TreeNode[],
  state: IState,
  setHalfSelectedNode: (node?: TreeNode) => void
) => {
  const index = data.findIndex((n) => n.id === state.halfSelectedNode?.id);

  if (index < 1) return;
  const reversed = [...data].filter((n, i) => i < index).reverse();

  const next = reversed.find((n) => {
    const level = getTreeNodeLevel(n);
    if (level === 1) return true;
    return state.expandedIds.includes(n.path);
  });

  if (next) setHalfSelectedNode(next);
};

/**
 * Expand the current node
 * @param data
 * @param state
 * @param setData
 * @param loadChildren
 * @param setExpandedIds
 * @param setHalfSelectedNode
 * @param setSelectedNode
 * @param clickedNode
 */
export const arrowRight = async (
  data: TreeNode[],
  state: IState,
  setData: (data: TreeNode[]) => void,
  loadChildren: (node: TreeNode) => Promise<TreeNode[]>,
  setExpandedIds: (ids: string[]) => void,
  setHalfSelectedNode: (node?: TreeNode) => void,
  setSelectedNode: (node?: TreeNode) => void,
  clickedNode?: TreeNode
) => {
  const node =
    clickedNode || data.find((n) => n.id === state.halfSelectedNode?.id);

  if (!node) return;

  const isExpanded =
    state.halfSelectedNode?.id &&
    state.expandedIds.includes(node?.id || state.halfSelectedNode?.id);

  const newData = !isExpanded ? await loadChildren(node) : data;
  const hasChildren = node.children.length > 0 || node.hasChildrenHint;
  if (!isExpanded && hasChildren)
    setExpandedIds([...state.expandedIds, node.id]);
  else {
    const next = newData.find((n) => n.path === node.id);
    if (next) setHalfSelectedNode(next);
  }
  setData(newData);
  const stillSelected = newData.find((n) => n.id === node.id);
  if (!stillSelected) {
    setSelectedNode(undefined);
    setHalfSelectedNode(undefined);
  }
};

/**
 * Collapse the current node
 * @param data
 * @param state
 * @param setExpandedIds
 * @param setHalfSelectedNode
 */
export const arrowLeft = (
  data: TreeNode[],
  state: IState,
  setExpandedIds: (ids: string[]) => void,
  setHalfSelectedNode: (node?: TreeNode) => void
) => {
  const node = data.find((n) => n.id === state.halfSelectedNode?.id);

  if (!node) return;

  const isExpanded =
    state.halfSelectedNode?.id &&
    state.expandedIds.includes(state.halfSelectedNode?.id);
  const hasChildren = node.children.length > 0 || node.hasChildrenHint;

  const level = getTreeNodeLevel(node);
  if (isExpanded && hasChildren) {
    if (level !== 0) {
      setExpandedIds(state.expandedIds.filter((id) => !id.startsWith(node.id)));
    }
  } else if (level > 1) {
    const parent = data.find((n) => n.id === node.path);
    if (parent) setHalfSelectedNode(parent);
  }
};

/**
 * Listen only to these key events
 */
export const validKeys = [
  "Enter",
  " ",
  "ArrowDown",
  "ArrowUp",
  "ArrowLeft",
  "ArrowRight",
];
