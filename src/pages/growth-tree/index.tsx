import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../types';
import ReactFlow, { Controls, Background, BackgroundVariant, MiniMap, Panel, NodeToolbar, useNodesState, useEdgesState, addEdge, ConnectionLineType, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import ErrorBoundary from '../../components/ErrorBoundary';
import { secureStorage } from '../../utils/secureStorage';
import logger from '../../utils/logger';

interface NodeFormData {
  label: string;
  description: string;
}

const GrowthTree = () => {
  const { records, tags } = useSelector((state: RootState) => state.growth);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showEditNodeModal, setShowEditNodeModal] = useState(false);
  const [nodeFormData, setNodeFormData] = useState<NodeFormData>({ label: '', description: '' });
  
  useEffect(() => {
    (async () => {
      try {
        const savedNodes = await secureStorage.getItem<Node[]>('growth-tree-nodes');
        const savedEdges = await secureStorage.getItem<Edge[]>('growth-tree-edges');
        
        if (savedNodes && savedEdges) {
          setNodes(savedNodes);
          setEdges(savedEdges);
          logger.info('成长树结构加载成功', { nodesCount: savedNodes.length, edgesCount: savedEdges.length });
        } else {
          const generatedNodes: Node[] = tags.map((tag, index) => ({
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
          
          const generatedEdges: Edge[] = [];
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
          await secureStorage.setItem('growth-tree-nodes', generatedNodes);
          await secureStorage.setItem('growth-tree-edges', generatedEdges);
        }
      } catch (error) {
        logger.error('加载成长树结构异常', error as Error);
      }
    })();
  }, [tags, setNodes, setEdges]);
  
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      (async () => {
        try {
          await secureStorage.setItem('growth-tree-nodes', nodes);
          await secureStorage.setItem('growth-tree-edges', edges);
          logger.info('成长树结构保存成功', { nodesCount: nodes.length, edgesCount: edges.length });
        } catch (error) {
          logger.error('保存成长树结构异常', error as Error);
        }
      })();
    }
  }, [nodes, edges]);
  
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);
  
  const handleConnect = useCallback((params: Parameters<typeof addEdge>[0]) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);
  
  const handleNodeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNodeFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddNode = () => {
    if (nodeFormData.label) {
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'default',
        position: { x: 200, y: 200 },
        data: {
          label: nodeFormData.label,
          description: nodeFormData.description || `关于 ${nodeFormData.label} 的学习内容`
        }
      };
      setNodes(prev => [...prev, newNode]);
      setNodeFormData({ label: '', description: '' });
      setShowAddNodeModal(false);
      logger.info('节点添加成功', { nodeLabel: nodeFormData.label });
    }
  };
  
  const handleEditNode = () => {
    if (selectedNode && nodeFormData.label) {
      setNodes(prev => prev.map(node => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              label: nodeFormData.label,
              description: nodeFormData.description || `关于 ${nodeFormData.label} 的学习内容`
            }
          };
        }
        return node;
      }));
      setNodeFormData({ label: '', description: '' });
      setShowEditNodeModal(false);
      logger.info('节点更新成功', { nodeId: selectedNode.id, nodeLabel: nodeFormData.label });
    }
  };
  
  const handleDeleteNode = () => {
    if (selectedNode) {
      setNodes(prev => prev.filter(node => node.id !== selectedNode.id));
      setEdges(prev => prev.filter(edge => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
      setSelectedNode(null);
      logger.info('节点删除成功', { nodeId: selectedNode.id });
    }
  };
  
  const openAddNodeModal = () => {
    setNodeFormData({ label: '', description: '' });
    setShowAddNodeModal(true);
  };
  
  const openEditNodeModal = () => {
    if (selectedNode) {
      setNodeFormData({
        label: selectedNode.data.label,
        description: selectedNode.data.description
      });
      setShowEditNodeModal(true);
    }
  };

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
              defaultViewport={{ x: 0, y: 0, zoom: 1.2 }}
              minZoom={0.5}
              maxZoom={2}
            >
              <Controls />
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
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
            <button className="btn btn-primary" onClick={openAddNodeModal}>
              添加节点
            </button>
            <button className="btn btn-secondary" onClick={openEditNodeModal} disabled={!selectedNode}>
              编辑节点
            </button>
            <button className="btn btn-danger" onClick={handleDeleteNode} disabled={!selectedNode}>
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
                    .filter(record => record.tags && record.tags.includes(selectedNode.data.label))
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
        
        {showAddNodeModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-title">添加节点</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">节点标签</label>
                  <input 
                    type="text" 
                    name="label" 
                    className="input w-full"
                    value={nodeFormData.label}
                    onChange={handleNodeInputChange}
                    placeholder="请输入节点标签"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">节点描述</label>
                  <textarea 
                    name="description" 
                    className="input w-full" 
                    rows={3}
                    value={nodeFormData.description}
                    onChange={handleNodeInputChange}
                    placeholder="请输入节点描述"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowAddNodeModal(false)}
                >
                  取消
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleAddNode}
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showEditNodeModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-title">编辑节点</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">节点标签</label>
                  <input 
                    type="text" 
                    name="label" 
                    className="input w-full"
                    value={nodeFormData.label}
                    onChange={handleNodeInputChange}
                    placeholder="请输入节点标签"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">节点描述</label>
                  <textarea 
                    name="description" 
                    className="input w-full" 
                    rows={3}
                    value={nodeFormData.description}
                    onChange={handleNodeInputChange}
                    placeholder="请输入节点描述"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowEditNodeModal(false)}
                >
                  取消
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleEditNode}
                >
                  更新
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default GrowthTree;
