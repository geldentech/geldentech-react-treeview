import React from "react";
import type { MouseEventHandler } from "react";
import { useEffect, useRef, useState } from "react";
import type {
  IState,
  TreeDataConfig,
  TreeNode,
} from "./types";
import {
  transformDataToTreeNodes,
  getChildren,
  updateChildren,
} from "./utils";
import {
  arrowDown,
  arrowLeft,
  arrowRight,
  arrowUp,
  getTreeNodeLevel,
  validKeys,
} from "./keys";
import { TreeViewProvider, useTreeView } from "./provider";

/**
 * The leaf node renders a span label with left padding based on the level of the node,
 * unless a custom component is provided.
 * @param props
 * @constructor
 */
function LeafNode(props: {
  node: TreeNode;
  className?: string;
  style?: React.CSSProperties;
  Component?: (props: {
    node: TreeNode;
    isSelected: boolean;
    isHalfSelected: boolean;
    isExpanded: boolean;
  }) => JSX.Element;
}) {
  const { Component, node, className, style } = props;
  const { selectedNode, halfSelectedNode, expandedIds } = useTreeView();
  const isSelected = selectedNode?.id === node.id;
  const isHalfSelected = halfSelectedNode?.id === node.id;
  const isExpanded = expandedIds.includes(node.id);
  const level = getTreeNodeLevel(node);
  return Component ? (
    <Component
      node={node}
      isExpanded={isExpanded}
      isSelected={isSelected}
      isHalfSelected={isHalfSelected}
    />
  ) : (
    <span className={`${className} tree-node-leaf`} style={{ paddingLeft: 10 * level - 1, ...style }}>
      {node.name}
    </span>
  );
}

/**
 * The branch node renders the ul and li elements for the children of the node
 * and adds accessibility keyboard and mouse event handlers.
 * @param props
 * @constructor
 */
function BranchNode(props: {
  node: TreeNode;
  classes?: {
    listItem?: string;
    label?: string;
    labelWrapper?: string;
    list?: string;
  }
  data: TreeNode[];
  Component?: (props: {
    node: TreeNode;
    isSelected: boolean;
    isHalfSelected: boolean;
    isExpanded: boolean;
  }) => JSX.Element;
}) {
  const {
    setSelectedNode,
    setHalfSelectedNode,
    setData,
    lazyLoadChildren,
    setExpandedIds,
    state,
    selectedNode,
    singleClickSelect,
    singleClickExpand,
  } = useTreeView();
  const { node, data } = props;
  const children = getChildren(node, data);
  const level = getTreeNodeLevel(node);
  const expanded = state.expandedIds.includes(node.id) || level === 0;

  const handleHalfSelect: MouseEventHandler<HTMLDivElement> = (evt) => {
    evt.stopPropagation();
    if (singleClickExpand)
      arrowRight(
        data,
        state,
        setData,
        lazyLoadChildren,
        setExpandedIds,
        setHalfSelectedNode,
        setSelectedNode,
        node
        // singleClickSelect
      ).then(() => setHalfSelectedNode(node));
    else setHalfSelectedNode(node);
  };

  const handleSelect: MouseEventHandler<HTMLDivElement> = (evt) => {
    evt.stopPropagation();
    if (expanded && singleClickSelect)
      arrowLeft(data, state, setExpandedIds, setHalfSelectedNode);
    else
      arrowRight(
        data,
        state,
        setData,
        lazyLoadChildren,
        setExpandedIds,
        setHalfSelectedNode,
        setSelectedNode,
        node
        // singleClickExpand
      ).then(() => {
        setHalfSelectedNode(node);
        setSelectedNode(node);
      });
  };
  const selected = selectedNode?.id === node.id;
  const halfSelected = state.halfSelectedNode?.id === node.id;
  return (
    <ul className={props.classes?.list}>
      {node.path !== "" && (
        <div
          className={`${props.classes?.labelWrapper} tree-node-label ${selected ? `tree-node-selected` : ""} ${
            halfSelected ? "tree-node-half-selected" : ""
          }`}
          onClick={singleClickSelect ? handleSelect : handleHalfSelect}
          onDoubleClick={singleClickSelect ? undefined : handleSelect}
        >
          <LeafNode className={props.classes?.label} Component={props.Component} node={node} />
        </div>
      )}
      {children.map((child) => (
        <li className={props.classes?.listItem} key={child.id}>
          {expanded && getChildren(child, data) && (
            <BranchNode classes={props.classes} node={child} data={data} Component={props.Component} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function Tree<T = any>({
  cacheId,
  treeDataConfig,
  treeData,
  onLoadChildren,
  Component,
  onHintChildren,
  onSelect,
  singleClickSelect,
  singleClickExpand,
  defaultMultiSelectedIds,
  defaultSelectedId,
  className,
  classes,
}: {
  cacheId?: string;
  treeDataConfig?: TreeDataConfig<T>;
  treeData?: TreeNode[];
  onLoadChildren?: (
    node: TreeNode,
    oldChildren: TreeNode[]
  ) => Promise<TreeNode[]>;
  Component?: (props: {
    node: TreeNode;
    isSelected: boolean;
    isHalfSelected: boolean;
    isExpanded: boolean;
  }) => JSX.Element;
  onHintChildren?: (node: T) => Promise<boolean> | boolean;
  onSelect?: (props: {
    node: TreeNode;
    isSelected: boolean;
    isHalfSelected: boolean;
    isExpanded: boolean;
  }) => void;
  singleClickSelect?: boolean;
  singleClickExpand?: boolean;
  defaultSelectedId?: string;
  defaultMultiSelectedIds?: string;
  className?: string;
  classes?: {
    listItem?: string;
    label?: string;
    labelWrapper?: string;
    list?: string;
  }
}) {
  const getDefaultExpandedIds = () => {
    const result: string[] = [];
    if (defaultSelectedId) {
      let path = "";
      const parts = defaultSelectedId.split("/");
      parts.forEach((part) => {
        path += part;
        result.push(path);
        path += "/";
      });
    }

    return result.filter((r) => !!r);
  };
  if (!treeDataConfig && !treeData)
    throw new Error("treeDataConfig or treeData must be provided");
  const [data, setData] = useState<TreeNode[]>(() =>
    treeData
      ? treeData
      : treeDataConfig
      ? transformDataToTreeNodes<T>({ ...treeDataConfig, onHintChildren })
      : []
  );
  // console.log("===>data", data);

  const [focussed, setFocussed] = useState<boolean>(false);
  const [selectedNode, _setSelectedNode] = useState<TreeNode | undefined>(
    defaultSelectedId ? data.find((d) => d.id === defaultSelectedId) : undefined
  );
  const [halfSelectedNode, setHalfSelectedNode] = useState<
    TreeNode | undefined
  >();
  const [expandedIds, setExpandedIds] = useState<string[]>(
    getDefaultExpandedIds
  );
  useEffect(() => {
    if (defaultSelectedId) {
      setExpandedIds(getDefaultExpandedIds());
      setSelectedNode(data.find((d) => d.id === defaultSelectedId));
    }
  }, [defaultSelectedId]);
  const [multiSelect, setMultiSelect] = useState<boolean>(false);
  const [multiSelectedNodes, setMultiSelectedNodes] = useState<TreeNode[]>(
    defaultMultiSelectedIds?.length
      ? data.filter((d) => defaultMultiSelectedIds.includes(d.id))
      : []
  );

  const ref = useRef<HTMLDivElement>(null);
  const state: IState = { selectedNode, halfSelectedNode, expandedIds };

  const setSelectedNode = (node: TreeNode | undefined) => {
    _setSelectedNode(node);
    if (node) {
      if (!multiSelect) setMultiSelectedNodes([node].filter((n) => !!n));
      else setMultiSelectedNodes([...multiSelectedNodes, node]);
    }
    if (onSelect && node) {
      onSelect({
        node,
        isSelected:
          node.id === selectedNode?.id || multiSelectedNodes.includes(node),
        isHalfSelected: node.id === halfSelectedNode?.id,
        isExpanded: expandedIds.includes(node.id),
      });
    }
  };

  async function lazyLoadChildren(node: TreeNode) {
    if (!onLoadChildren) return data;
    const oldChildren = getChildren(node, data);
    const children = await onLoadChildren(node, oldChildren);
    node.children = children.map((c) => c.id);
    return updateChildren(node, children, data);
  }

  useEffect(() => {
    const div = ref.current;
    if (!div) return;

    const focus = () => setFocussed(true);
    const blur = () => setFocussed(false);

    ref.current.addEventListener("focusin", focus);
    ref.current.addEventListener("focusout", blur);
    return () => {
      div?.removeEventListener("focusin", focus);
      div?.removeEventListener("focusout", blur);
    };
  }, []);

  useEffect(() => {
    const div = ref.current;
    if (!focussed || !div) return;
    const keydown = async (e: KeyboardEvent) => {
      if (!validKeys.includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "ArrowDown") arrowDown(data, state, setHalfSelectedNode);
      if (e.key === "ArrowUp") arrowUp(data, state, setHalfSelectedNode);
      if (e.key === "ArrowRight")
        await arrowRight(
          data,
          state,
          setData,
          lazyLoadChildren,
          setExpandedIds,
          setHalfSelectedNode,
          setSelectedNode
        );
      if (e.key === "ArrowLeft")
        arrowLeft(data, state, setExpandedIds, setHalfSelectedNode);
      if (e.key === "Enter" || e.key === " ") {
        const node = data.find((n) => n.id === state.halfSelectedNode?.id);
        if (!node) return;
        setSelectedNode(node);
      }
    };
    div.addEventListener("keydown", keydown);
    return () => {
      div.removeEventListener("keydown", keydown);
    };
  }, [focussed, halfSelectedNode, expandedIds, data, selectedNode]);

  const root = data[0];

  return (
    <TreeViewProvider
      value={{
        cacheId,
        state,
        halfSelectedNode,
        setHalfSelectedNode,
        selectedNode,
        setSelectedNode,
        data,
        setData,
        lazyLoadChildren,
        expandedIds,
        setExpandedIds,
        multiSelect,
        setMultiSelect,
        multiSelectedNodes,
        singleClickExpand,
        singleClickSelect,
      }}
    >
      <div className={`${className} tree-view`} tabIndex={0} ref={ref}>
        <BranchNode classes={classes} Component={Component} node={root} data={data} />
      </div>
    </TreeViewProvider>
  );
}
