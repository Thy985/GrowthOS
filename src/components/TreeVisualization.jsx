import React, { useState, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';

const TreeVisualization = ({ treeData }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // 当树数据变化时更新ReactFlow数据
  useEffect(() => {
    if (treeData) {
      updateReactFlowData(treeData);
    }
  }, [treeData]);

  // 将树数据转换为reactflow的节点和边
  const updateReactFlowData = (tree) => {
    const newNodes = [];
    const newEdges = [];
    
    // 递归遍历树，创建节点和边
    const traverseTree = (node, x = 500, y = 100, level = 0) => {
      // 创建节点
      newNodes.push({
        id: node.id,
        data: { label: node.name },
        position: { x, y },
        style: {
          backgroundColor: getNodeColor(node.type),
          color: '#fff',
          borderRadius: '8px',
          padding: '10px'
        }
      });
      
      // 如果有子节点，创建边并递归
      if (node.children && node.children.length > 0) {
        const childXStart = x - (node.children.length - 1) * 150 / 2;
        node.children.forEach((child, index) => {
          const childX = childXStart + index * 150;
          const childY = y + 150;
          
          // 创建边
          newEdges.push({
            id: `edge-${node.id}-${child.id}`,
            source: node.id,
            target: child.id,
            type: 'smoothstep',
            animated: true
          });
          
          // 递归处理子节点
          traverseTree(child, childX, childY, level + 1);
        });
      }
    };
    
    traverseTree(tree);
    setNodes(newNodes);
    setEdges(newEdges);
  };

  // 根据节点类型返回不同的颜色
  const getNodeColor = (type) => {
    switch (type) {
      case 'skill':
        return '#4CAF50'; // 绿色
      case 'cognition':
        return '#2196F3'; // 蓝色
      case 'habit':
        return '#FFC107'; // 黄色
      case 'life':
        return '#9C27B0'; // 紫色
      default:
        return '#757575'; // 灰色
    }
  };

  return (
    <div className="h-96 bg-gray-100 rounded">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
      >
        <Background variant="dots" gap={12} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default TreeVisualization;