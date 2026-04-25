import React, { useState, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';

const GrowthTree = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [nodeDetails, setNodeDetails] = useState({
    name: 'React 技能',
    mastery: 75,
    status: '进行中',
    startDate: '2024-01-01',
    lastUpdate: '2024-01-15'
  });

  // 从localStorage加载成长树数据
  useEffect(() => {
    const savedTree = localStorage.getItem('growthos-tree');
    if (savedTree) {
      setTreeData(JSON.parse(savedTree));
      updateReactFlowData(JSON.parse(savedTree));
    } else {
      // 初始化默认成长树
      const defaultTree = {
        id: '1',
        name: '成长树',
        children: [
          {
            id: '2',
            name: '技能树',
            type: 'skill',
            children: [
              { id: '3', name: '编程', type: 'skill' },
              { id: '4', name: '写作', type: 'skill' },
              { id: '5', name: '外语', type: 'skill' }
            ]
          },
          {
            id: '6',
            name: '认知树',
            type: 'cognition',
            children: [
              { id: '7', name: '阅读', type: 'cognition' },
              { id: '8', name: '课程', type: 'cognition' },
              { id: '9', name: '观影', type: 'cognition' }
            ]
          },
          {
            id: '10',
            name: '习惯树',
            type: 'habit',
            children: [
              { id: '11', name: '运动', type: 'habit' },
              { id: '12', name: '早起', type: 'habit' },
              { id: '13', name: '冥想', type: 'habit' }
            ]
          },
          {
            id: '14',
            name: '生活树',
            type: 'life',
            children: [
              { id: '15', name: '家庭', type: 'life' },
              { id: '16', name: '社交', type: 'life' },
              { id: '17', name: '旅行', type: 'life' }
            ]
          }
        ]
      };
      setTreeData(defaultTree);
      updateReactFlowData(defaultTree);
      localStorage.setItem('growthos-tree', JSON.stringify(defaultTree));
    }
  }, []);

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

  // 处理节点详情变化
  const handleNodeDetailChange = (e) => {
    const { name, value } = e.target;
    setNodeDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  return (
    <div>
      <h1 className="page-title">成长树</h1>
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">树管理</h2>
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
        <div className="mt-6">
          <h3 className="font-medium mb-2">未分类节点（影子节点）</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between tree-node">
              <span>#Python</span>
              <div className="flex space-x-2">
                <button className="btn btn-primary text-xs">
                  确认
                </button>
                <button className="btn btn-danger text-xs">
                  删除
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between tree-node">
              <span>#阅读</span>
              <div className="flex space-x-2">
                <button className="btn btn-primary text-xs">
                  确认
                </button>
                <button className="btn btn-danger text-xs">
                  删除
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between tree-node wilting">
              <span>#React</span>
              <div className="flex space-x-2">
                <button className="btn btn-primary text-xs">
                  确认
                </button>
                <button className="btn btn-danger text-xs">
                  删除
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between tree-node wilting">
              <span>#跑步</span>
              <div className="flex space-x-2">
                <button className="btn btn-primary text-xs">
                  确认
                </button>
                <button className="btn btn-danger text-xs">
                  删除
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between tree-node wilted">
              <span>#王者荣耀</span>
              <div className="flex space-x-2">
                <button className="btn btn-primary text-xs">
                  确认
                </button>
                <button className="btn btn-danger text-xs">
                  删除
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between tree-node">
              <span>...</span>
              <button className="btn btn-primary text-xs">
                查看更多
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <p>提示：未分类的节点如果 7 天内未被确认，会逐渐枯萎并最终被归档</p>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-medium mb-4">AI 园丁模式</h3>
          <div className="suggestion-card primary">
            <h4 className="font-medium mb-2">智能归类建议</h4>
            <p className="mb-4">检测到你有多个关于「编程」的记录，是否自动创建一个「编程语言」分类，并将它们归纳进去？</p>
            <div className="flex space-x-4">
              <button className="btn btn-primary">
                确认
              </button>
              <button className="btn btn-outline">
                取消
              </button>
            </div>
          </div>
          <div className="suggestion-card warning">
            <h4 className="font-medium mb-2">子分类建议</h4>
            <p className="mb-4">你的「技能树」太茂盛了，检测到其中「设计」、「插画」、「Figma」关联度高，是否创建一个「设计能力」子分类？</p>
            <div className="flex space-x-4">
              <button className="btn btn-primary">
                确认
              </button>
              <button className="btn btn-outline">
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
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
    </div>
  );
};

export default GrowthTree;