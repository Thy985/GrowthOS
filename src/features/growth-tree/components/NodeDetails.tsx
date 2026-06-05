import React, { useState } from 'react';

const NodeDetails = () => {
  const [nodeDetails, setNodeDetails] = useState({
    name: 'React 技能',
    mastery: 75,
    status: '进行中',
    startDate: '2024-01-01',
    lastUpdate: '2024-01-15'
  });

  // 处理节点详情变化
  const handleNodeDetailChange = (e) => {
    const { name, value } = e.target;
    setNodeDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="mt-6 card">
      <h2 className="text-xl font-semibold mb-4">节点详情</h2>
      <div className="space-y-4">
        <div>
          <label className="form-label">节点名称</label>
          <input 
            type="text" 
            className="form-input" 
            name="name"
            value={nodeDetails.name} 
            onChange={handleNodeDetailChange}
          />
        </div>
        <div>
          <label className="form-label">掌握度</label>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${nodeDetails.mastery}%` }}></div>
          </div>
          <p className="text-right mt-1">{nodeDetails.mastery}%</p>
        </div>
        <div>
          <label className="form-label">状态</label>
          <select 
            className="form-input"
            name="status"
            value={nodeDetails.status}
            onChange={handleNodeDetailChange}
          >
            <option value="未开始">未开始</option>
            <option value="进行中">进行中</option>
            <option value="深入">深入</option>
          </select>
        </div>
        <div>
          <label className="form-label">开始日期</label>
          <input 
            type="date" 
            className="form-input" 
            name="startDate"
            value={nodeDetails.startDate} 
            onChange={handleNodeDetailChange}
          />
        </div>
        <div>
          <label className="form-label">最近更新</label>
          <input 
            type="date" 
            className="form-input" 
            name="lastUpdate"
            value={nodeDetails.lastUpdate} 
            onChange={handleNodeDetailChange}
          />
        </div>
        <button className="btn btn-primary w-full">
          保存更改
        </button>
      </div>
    </div>
  );
};

export default NodeDetails;