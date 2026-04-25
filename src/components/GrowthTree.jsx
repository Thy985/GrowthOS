import React from 'react';

const GrowthTree = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">成长树</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">树管理</h2>
        <div className="h-96 bg-gray-100 rounded flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">成长树可视化管理区域</p>
            <p className="text-sm text-gray-400 mt-2">拖拽节点来调整树结构</p>
          </div>
        </div>
        <div className="mt-6 flex space-x-4">
          <button className="bg-primary text-white p-2 rounded hover:bg-green-600">
            添加节点
          </button>
          <button className="bg-secondary text-white p-2 rounded hover:bg-blue-600">
            编辑节点
          </button>
          <button className="bg-red-500 text-white p-2 rounded hover:bg-red-600">
            删除节点
          </button>
        </div>
        <div className="mt-6">
          <h3 className="font-medium mb-2">未分类节点（影子节点）</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>#Python</span>
              <div className="flex space-x-2">
                <button className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                  确认
                </button>
                <button className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                  删除
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>#阅读</span>
              <div className="flex space-x-2">
                <button className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                  确认
                </button>
                <button className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">节点详情</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">节点名称</label>
            <input type="text" className="w-full p-2 border rounded" value="React 技能" />
          </div>
          <div>
            <label className="block mb-2">掌握度</label>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <p className="text-right mt-1">75%</p>
          </div>
          <div>
            <label className="block mb-2">状态</label>
            <select className="w-full p-2 border rounded">
              <option>未开始</option>
              <option selected>进行中</option>
              <option>深入</option>
            </select>
          </div>
          <div>
            <label className="block mb-2">开始日期</label>
            <input type="date" className="w-full p-2 border rounded" value="2024-01-01" />
          </div>
          <div>
            <label className="block mb-2">最近更新</label>
            <input type="date" className="w-full p-2 border rounded" value="2024-01-15" />
          </div>
          <button className="w-full bg-primary text-white p-2 rounded hover:bg-green-600">
            保存更改
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrowthTree;