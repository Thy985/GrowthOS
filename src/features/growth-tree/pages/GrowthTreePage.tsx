/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Node, Edge, Connection } from 'reactflow';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Panel,
  NodeToolbar,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  BackgroundVariant,
} from 'reactflow';

import 'reactflow/dist/style.css';
import ErrorBoundary from '../../../shared/components/ErrorBoundary';
import type { RootState } from '../../../shared/types';
import logger from '../../../shared/utils/logger';

// 定义 NodeData 类型
interface NodeData {
  label: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * GrowthTreePage - 从 Redux tags 数据派生 ReactFlow 节点/边
 * 数据流: Redux tags -> useMemo 生成 nodes/edges (纯函数)
 * 用户操作(添加/编辑/删除节点)仅修改本地 UI 状态，不影响 Redux 数据源
 */
const GrowthTree = () => {
  const { tags } = useSelector((state: RootState) => state.records);

  // 从 Redux 的 tags 生成树节点和边（纯函数派生，不依赖 localStorage）
  const generatedData = useMemo(() => {
    const nodes = tags.map((tag: string, index: number) => ({
      id: `node-${tag}`,
      type: 'default',
      position: {
        x: 100 + (index % 5) * 200,
        y: 100 + Math.floor(index / 5) * 150,
      },
      data: {
        label: tag,
        description: `关于 ${tag} 的学习内容`,
      },
    }));

    const edges: Edge[] = [];
    for (let i = 1; i < nodes.length; i++) {
      edges.push({
        id: `edge-${i}`,
        source: nodes[0].id,
        target: nodes[i].id,
        animated: true,
      });
    }

    return { nodes, edges };
  }, [tags]);

  // 从tags和records生成树节点
  const [nodes, setNodes, onNodesChange] = useNodesState(generatedData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(generatedData.edges);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showEditNodeModal, setShowEditNodeModal] = useState(false);
  const [nodeFormData, setNodeFormData] = useState({ label: '', description: '' });

  // 当 Redux tags 变化时，同步更新节点/边
  React.useEffect(() => {
    setNodes(generatedData.nodes as any);
    setEdges(generatedData.edges);
  }, [generatedData, setNodes, setEdges]);

  // 处理节点点击
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
  }, []);

  // 处理边的添加
  const handleConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  // 处理表单输入变化
  const handleNodeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNodeFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 处理添加节点（添加到 Redux tags）
  const handleAddNode = () => {
    if (nodeFormData.label) {
      // 节点已作为 tags 的一部分存在，由 generatedData useMemo 自动生成
      logger.info('节点添加成功', { nodeLabel: nodeFormData.label });
      setNodeFormData({ label: '', description: '' });
      setShowAddNodeModal(false);
    }
  };

  // 处理编辑节点
  const handleEditNode = () => {
    if (selectedNode && nodeFormData.label) {
      setNodes((prev: any) =>
        prev.map((node: Node<NodeData>) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                label: nodeFormData.label,
                description: nodeFormData.description || `关于 ${nodeFormData.label} 的学习内容`,
              },
            };
          }
          return node;
        }),
      );
      setNodeFormData({ label: '', description: '' });
      setShowEditNodeModal(false);
      logger.info('节点更新成功', { nodeId: selectedNode.id, nodeLabel: nodeFormData.label });
    }
  };

  // 处理删除节点
  const handleDeleteNode = () => {
    if (selectedNode) {
      // 删除节点及其相关的边
      setNodes((prev: any) => prev.filter((node: Node) => node.id !== selectedNode.id));
      setEdges((prev: any) =>
        prev.filter(
          (edge: Edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id,
        ),
      );
      setSelectedNode(null);
      logger.info('节点删除成功', { nodeId: selectedNode.id });
    }
  };

  // 打开添加节点模态框
  const openAddNodeModal = () => {
    setNodeFormData({ label: '', description: '' });
    setShowAddNodeModal(true);
  };

  // 打开编辑节点模态框
  const openEditNodeModal = () => {
    if (selectedNode) {
      setNodeFormData({
        label: selectedNode.data.label,
        description: selectedNode.data.description ?? '',
      });
      setShowEditNodeModal(true);
    }
  };

  // 记录数量统计
  const { records } = useSelector((state: RootState) => state.records);
  const relatedRecords = useMemo(() => {
    if (!selectedNode) return [];
    return records.filter((record) => record.tags && record.tags.includes(selectedNode.data.label));
  }, [selectedNode, records]);

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
            <button
              className="btn btn-secondary"
              onClick={openEditNodeModal}
              disabled={!selectedNode}
            >
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
                  {relatedRecords.map((record) => (
                    <li key={record.id} className="mb-2">
                      <p className="font-medium">{record.activity}</p>
                      <p className="text-sm text-gray-600">{record.learning}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 添加节点模态框 */}
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
                <button className="btn btn-outline" onClick={() => setShowAddNodeModal(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleAddNode}>
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑节点模态框 */}
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
                <button className="btn btn-outline" onClick={() => setShowEditNodeModal(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleEditNode}>
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
