import { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  BackgroundVariant,
  Controls, 
  MiniMap,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

interface TreeNode {
  id: string;
  name: string;
  type: 'skill' | 'cognition' | 'habit' | 'life' | string;
  children?: TreeNode[];
}

interface TreeVisualizationProps {
  treeData?: TreeNode;
}

interface ReactFlowNodeData {
  label: string;
}

const TreeVisualization: React.FC<TreeVisualizationProps> = ({ treeData }) => {
  const [nodes, setNodes] = useState<Node<ReactFlowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const updateReactFlowData = useCallback((tree: TreeNode) => {
    const newNodes: Node<ReactFlowNodeData>[] = [];
    const newEdges: Edge[] = [];
    
    const traverseTree = (node: TreeNode, x = 500, y = 100, level = 0) => {
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
      
      if (node.children && node.children.length > 0) {
        const childXStart = x - (node.children.length - 1) * 150 / 2;
        node.children.forEach((child, index) => {
          const childX = childXStart + index * 150;
          const childY = y + 150;
          
          newEdges.push({
            id: `edge-${node.id}-${child.id}`,
            source: node.id,
            target: child.id,
            type: 'smoothstep',
            animated: true
          });
          
          traverseTree(child, childX, childY, level + 1);
        });
      }
    };
    
    traverseTree(tree);
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  useEffect(() => {
    if (treeData) {
      updateReactFlowData(treeData);
    }
  }, [treeData, updateReactFlowData]);

  const getNodeColor = (type: string): string => {
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

  return (
    <div className="h-96 bg-gray-100 rounded">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default TreeVisualization;
