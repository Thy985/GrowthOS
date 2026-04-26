import React from 'react';

const Home = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">仪表盘</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">成长树预览</h2>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-300">成长树可视化区域</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">日常记录</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">做了什么</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="今天做了什么" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">学了什么</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" placeholder="今天学了什么" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态如何</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">选择状态</option>
                <option value="happy">很好</option>
                <option value="neutral">一般</option>
                <option value="sad">不太好</option>
              </select>
            </div>
            <button className="w-full py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
              保存记录
            </button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">最近记录</h2>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="font-medium">学习 React</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">今天</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="font-medium">学习 TypeScript</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">昨天</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="font-medium">学习 Redux</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">2天前</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;