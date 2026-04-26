import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactFlow, { Controls, Background, MiniMap, Panel, NodeToolbar, useNodesState, useEdgesState, addEdge, ConnectionLineType } from 'reactflow';
import 'reactflow/dist/style.css';
import ErrorBoundary from '../../components/ErrorBoundary';

const GrowthTree = () => {
  const dispatch = useDispatch();
  const { trees, records, tags } = useSelector(state => state.growth);
  
  // 从tags和records生成树节点
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // 生成树节点和边
  useEffect(() => {
    // 从标签生成节点
    const generatedNodes = tags.map((tag, index) => ({
      id: `node-${tag}`,
      type: 'default',
      position: {
        x: 100 + (index % 5) * 200,
        y: 100 + Math.floor(index / 5) * 150
      },
      data: {
        label: tag,
        description: `关于 ${tag} 的学习内容`
      }
    }));
    
    // 生成边（简单示例，实际应用中可能需要更复杂的逻辑）
    const generatedEdges = [];
    for (let i = 1; i < generatedNodes.length; i++) {
      generatedEdges.push({
        id: `edge-${i}`,
        source: generatedNodes[0].id,
        target: generatedNodes[i].id,
        animated: true
      });
    }
    
    setNodes(generatedNodes);
    setEdges(generatedEdges);
  }, [tags]);
  
  // 处理节点点击
  const handleNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);
  
  // 处理边的添加
  const handleConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);
  
  return (
    <ErrorBoundary>
      <div className="growth-tree-page">
        <h1 className="page-title">成长树</h1>
        
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">树可视化</h2>
          <div className="tree-visualization-container">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              onConnect={handleConnect}
              connectionLineType={ConnectionLineType.Bezier}
              defaultZoom={1.2}
              minZoom={0.5}
              maxZoom={2}
            >
              <Controls />
              <Background variant="dots" gap={16} size={1} />
              <MiniMap />
              <Panel position="top-right">
                <div className="text-sm">
                  <p>节点数量: {nodes.length}</p>
                  <p>边数量: {edges.length}</p>
                </div>
              </Panel>
              <NodeToolbar />
            </ReactFlow>
          </div>
          
          <div className="mt-6 flex space-x-4">
            <button className="btn btn-primary">
              添加节点
            </button>
            <button className="btn btn-secondary">
              编辑节点
            </button>
            <button className="btn btn-danger">
              删除节点
            </button>
          </div>
        </div>
        
        {selectedNode && (
          <div className="card mt-4">
            <h2 className="text-xl font-semibold mb-4">节点详情</h2>
            <div className="node-details">
              <h3>{selectedNode.data.label}</h3>
              <p>{selectedNode.data.description}</p>
              <div className="mt-4">
                <h4>相关记录</h4>
                <ul>
                  {records
                    .filter(record => record.tags.includes(selectedNode.data.label))
                    .map(record => (
                      <li key={record.id} className="mb-2">
                        <p className="font-medium">{record.activity}</p>
                        <p className="text-sm text-gray-600">{record.learning}</p>
                        <p className="text-xs text-gray-500">{new Date(record.createdAt).toLocaleDateString()}</p>
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default GrowthTree;