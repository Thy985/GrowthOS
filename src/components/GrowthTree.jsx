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
            <div className="mt-4 space-y-2 text-left">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span>技能树（编程、写作、外语...）</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <span>认知树（阅读、课程、观影...）</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                <span>习惯树（运动、早起、冥想...）</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                <span>生活树（家庭、社交、旅行...）</span>
              </div>
            </div>
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
        <div className="mt-6">
          <h3 className="font-medium mb-4">AI 园丁模式</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">智能归类建议</h4>
            <p className="mb-4">检测到你有多个关于「编程」的记录，是否自动创建一个「编程语言」分类，并将它们归纳进去？</p>
            <div className="flex space-x-4">
              <button className="bg-primary text-white px-4 py-2 rounded hover:bg-green-600">
                确认
              </button>
              <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                取消
              </button>
            </div>
          </div>
          <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">子分类建议</h4>
            <p className="mb-4">你的「技能树」太茂盛了，检测到其中「设计」、「插画」、「Figma」关联度高，是否创建一个「设计能力」子分类？</p>
            <div className="flex space-x-4">
              <button className="bg-primary text-white px-4 py-2 rounded hover:bg-green-600">
                确认
              </button>
              <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                取消
              </button>
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