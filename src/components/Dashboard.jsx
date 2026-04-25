import React from 'react';

const Dashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">仪表盘</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">成长树预览</h2>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            <p>成长树可视化区域</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">日常记录</h2>
          <form>
            <div className="mb-4">
              <label className="block mb-2">做了什么</label>
              <input type="text" className="w-full p-2 border rounded" placeholder="今天做了什么..." />
            </div>
            <div className="mb-4">
              <label className="block mb-2">学了什么</label>
              <input type="text" className="w-full p-2 border rounded" placeholder="今天学了什么..." />
            </div>
            <div className="mb-4">
              <label className="block mb-2">状态如何</label>
              <select className="w-full p-2 border rounded">
                <option>很好</option>
                <option>一般</option>
                <option>不太好</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-primary text-white p-2 rounded hover:bg-green-600">
              提交
            </button>
          </form>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">快速统计</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">本周记录</p>
              <p className="text-2xl font-bold">5</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">总记录</p>
              <p className="text-2xl font-bold">28</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">成长进度</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;