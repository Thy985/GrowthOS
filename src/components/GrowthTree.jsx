import React from 'react';
import { useGrowth } from '../contexts/GrowthContext';
import TreeVisualization from './TreeVisualization';
import UncategorizedNodes from './UncategorizedNodes';
import AIGardener from './AIGardener';
import NodeDetails from './NodeDetails';

const GrowthTree = () => {
  const { treeData } = useGrowth();

  return (
    <div>
      <h1 className="page-title">成长树</h1>
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">树管理</h2>
        <TreeVisualization treeData={treeData} />
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
        <UncategorizedNodes />
        <AIGardener />
      </div>
      <NodeDetails />
    </div>
  );
};

export default GrowthTree;