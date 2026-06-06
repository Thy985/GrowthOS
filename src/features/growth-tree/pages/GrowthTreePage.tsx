/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

interface NodeData {
  label: string;
  description?: string;
  [key: string]: unknown;
}

const GrowthTree = () => {
  const { t } = useTranslation();
  const { tags } = useSelector((state: RootState) => state.records);

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
        description: t('growthTree.defaultDescription', { tag }),
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
  }, [tags, t]);

  const [nodes, setNodes, onNodesChange] = useNodesState(generatedData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(generatedData.edges);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showEditNodeModal, setShowEditNodeModal] = useState(false);
  const [nodeFormData, setNodeFormData] = useState({ label: '', description: '' });

  React.useEffect(() => {
    setNodes(generatedData.nodes as any);
    setEdges(generatedData.edges);
  }, [generatedData, setNodes, setEdges]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
  }, []);

  const handleConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  const handleNodeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNodeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNode = () => {
    if (nodeFormData.label) {
      logger.info('Node added successfully', { nodeLabel: nodeFormData.label });
      setNodeFormData({ label: '', description: '' });
      setShowAddNodeModal(false);
    }
  };

  const handleEditNode = () => {
    if (selectedNode && nodeFormData.label) {
      setNodes((prev: any) =>
        prev.map((node: Node<NodeData>) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                label: nodeFormData.label,
                description:
                  nodeFormData.description ||
                  t('growthTree.defaultDescription', { tag: nodeFormData.label }),
              },
            };
          }
          return node;
        }),
      );
      setNodeFormData({ label: '', description: '' });
      setShowEditNodeModal(false);
      logger.info('Node updated successfully', {
        nodeId: selectedNode.id,
        nodeLabel: nodeFormData.label,
      });
    }
  };

  const handleDeleteNode = () => {
    if (selectedNode) {
      setNodes((prev: any) => prev.filter((node: Node) => node.id !== selectedNode.id));
      setEdges((prev: any) =>
        prev.filter(
          (edge: Edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id,
        ),
      );
      setSelectedNode(null);
      logger.info('Node deleted successfully', { nodeId: selectedNode.id });
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
        description: selectedNode.data.description ?? '',
      });
      setShowEditNodeModal(true);
    }
  };

  const { records } = useSelector((state: RootState) => state.records);
  const relatedRecords = useMemo(() => {
    if (!selectedNode) return [];
    return records.filter((record) => record.tags && record.tags.includes(selectedNode.data.label));
  }, [selectedNode, records]);

  return (
    <ErrorBoundary>
      <div className="growth-tree-page">
        <h1 className="page-title">{t('growthTree.title', '成长树')}</h1>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">
            {t('growthTree.visualization', '树可视化')}
          </h2>
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
                  <p>{t('growthTree.nodeCount', { count: nodes.length })}</p>
                  <p>{t('growthTree.edgeCount', { count: edges.length })}</p>
                </div>
              </Panel>
              <NodeToolbar />
            </ReactFlow>
          </div>

          <div className="mt-6 flex space-x-4">
            <button className="btn btn-primary" onClick={openAddNodeModal}>
              {t('growthTree.addNode', '添加节点')}
            </button>
            <button
              className="btn btn-secondary"
              onClick={openEditNodeModal}
              disabled={!selectedNode}
            >
              {t('growthTree.editNode', '编辑节点')}
            </button>
            <button className="btn btn-danger" onClick={handleDeleteNode} disabled={!selectedNode}>
              {t('growthTree.deleteNode', '删除节点')}
            </button>
          </div>
        </div>

        {selectedNode && (
          <div className="card mt-4">
            <h2 className="text-xl font-semibold mb-4">
              {t('growthTree.nodeDetails', '节点详情')}
            </h2>
            <div className="node-details">
              <h3>{selectedNode.data.label}</h3>
              <p>{selectedNode.data.description}</p>
              <div className="mt-4">
                <h4>{t('growthTree.relatedRecords', '相关记录')}</h4>
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

        {showAddNodeModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-title">{t('growthTree.addNode', '添加节点')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('growthTree.nodeLabel', '节点标签')}
                  </label>
                  <input
                    type="text"
                    name="label"
                    className="input w-full"
                    value={nodeFormData.label}
                    onChange={handleNodeInputChange}
                    placeholder={t('growthTree.nodeLabelPlaceholder', '请输入节点标签')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('growthTree.nodeDescription', '节点描述')}
                  </label>
                  <textarea
                    name="description"
                    className="input w-full"
                    rows={3}
                    value={nodeFormData.description}
                    onChange={handleNodeInputChange}
                    placeholder={t('growthTree.nodeDescriptionPlaceholder', '请输入节点描述')}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowAddNodeModal(false)}>
                  {t('common.cancel', '取消')}
                </button>
                <button className="btn btn-primary" onClick={handleAddNode}>
                  {t('common.add', '添加')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditNodeModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-title">{t('growthTree.editNode', '编辑节点')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('growthTree.nodeLabel', '节点标签')}
                  </label>
                  <input
                    type="text"
                    name="label"
                    className="input w-full"
                    value={nodeFormData.label}
                    onChange={handleNodeInputChange}
                    placeholder={t('growthTree.nodeLabelPlaceholder', '请输入节点标签')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('growthTree.nodeDescription', '节点描述')}
                  </label>
                  <textarea
                    name="description"
                    className="input w-full"
                    rows={3}
                    value={nodeFormData.description}
                    onChange={handleNodeInputChange}
                    placeholder={t('growthTree.nodeDescriptionPlaceholder', '请输入节点描述')}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowEditNodeModal(false)}>
                  {t('common.cancel', '取消')}
                </button>
                <button className="btn btn-primary" onClick={handleEditNode}>
                  {t('common.update', '更新')}
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
