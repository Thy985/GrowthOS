/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useEffect, useCallback } from 'react';
import { ReactFlow, addEdge, Background, Controls, MiniMap, BackgroundVariant } from 'reactflow';
import type { Node, Edge, OnConnect } from 'reactflow';

interface TreeNode {
  id: string;
  name: string;
  type?: string;
  children?: TreeNode[];
}

interface NodeData {
  label: string;
  [key: string]: unknown;
}

interface TreeVisualizationProps {
  treeData: TreeNode | null;
}

// 根据节点类型返回不同的颜色
const getNodeColor = (type?: string): string => {
  switch (type) {
    case 'skill':
      return '#4CAF50';
    case 'cognition':
      return '#2196F3';
    case 'habit':
      return '#FFC107';
    case 'life':
      return '#9C27B0';
    default:
      return '#757575';
  }
};

// 将树数据转换为 ReactFlow 节点和边
const convertTreeToReactFlow = (tree: TreeNode): { nodes: Node<NodeData>[]; edges: Edge[] } => {
  const newNodes: Node<NodeData>[] = [];
  const newEdges: Edge[] = [];

  const traverseTree = (node: TreeNode, x = 500, y = 100) => {
    newNodes.push({
      id: node.id,
      data: { label: node.name },
      position: { x, y },
      style: {
        backgroundColor: getNodeColor(node.type),
        color: '#fff',
        borderRadius: '8px',
        padding: '10px',
      },
    });

    if (node.children && node.children.length > 0) {
      const childXStart = x - ((node.children.length - 1) * 150) / 2;
      node.children.forEach((child, index) => {
        const childX = childXStart + index * 150;
        const childY = y + 150;

        newEdges.push({
          id: `edge-${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          type: 'smoothstep',
          animated: true,
        });

        traverseTree(child, childX, childY);
      });
    }
  };

  traverseTree(tree);
  return { nodes: newNodes, edges: newEdges };
};

const TreeVisualization = ({ treeData }: TreeVisualizationProps) => {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // 当树数据变化时更新 ReactFlow 数据
  const updateReactFlowData = useCallback((tree: TreeNode) => {
    const { nodes: newNodes, edges: newEdges } = convertTreeToReactFlow(tree);
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  useEffect(() => {
    if (treeData) {
      updateReactFlowData(treeData);
    }
  }, [treeData, updateReactFlowData]);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="h-96 bg-gray-100 rounded">
      <ReactFlow nodes={nodes} edges={edges} onConnect={onConnect}>
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default TreeVisualization;
