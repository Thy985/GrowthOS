import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const Analytics = () => {
  const [records, setRecords] = useState([]);
  const [chartData, setChartData] = useState({
    dailyRecords: [],
    moodTrend: [],
    activityDistribution: []
  });

  // 从localStorage加载数据
  useEffect(() => {
    const savedRecords = localStorage.getItem('growthos-records');
    if (savedRecords) {
      const parsedRecords = JSON.parse(savedRecords);
      setRecords(parsedRecords);
      processChartData(parsedRecords);
    }
  }, []);

  // 处理图表数据
  const processChartData = (records) => {
    // 计算过去7天的记录数
    const now = new Date();
    const dailyData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRecords = records.filter(record => {
        return record.createdAt.startsWith(dateStr);
      });
      
      dailyData.push({
        date: dateStr,
        count: dayRecords.length
      });
    }
    
    // 计算情绪趋势
    const moodData = [];
    records.slice(0, 10).reverse().forEach((record, index) => {
      let moodValue = 0;
      switch (record.mood) {
        case '很好':
          moodValue = 2;
          break;
        case '一般':
          moodValue = 1;
          break;
        case '不太好':
          moodValue = 0;
          break;
      }
      
      moodData.push({
        day: `Day ${index + 1}`,
        mood: moodValue
      });
    });
    
    // 计算活动分布
    const activityCounts = {};
    records.forEach(record => {
      if (record.activity) {
        const activities = record.activity.split(' ').filter(word => word.startsWith('#'));
        activities.forEach(activity => {
          const activityName = activity.substring(1);
          activityCounts[activityName] = (activityCounts[activityName] || 0) + 1;
        });
      }
    });
    
    const activityData = Object.entries(activityCounts).map(([name, value]) => ({
      name,
      value
    })).slice(0, 5); // 只取前5个
    
    setChartData({
      dailyRecords: dailyData,
      moodTrend: moodData,
      activityDistribution: activityData
    });
  };

  // 计算情绪平均值
  const calculateAverageMood = () => {
    if (records.length === 0) return 0;
    
    const totalMood = records.reduce((sum, record) => {
      switch (record.mood) {
        case '很好':
          return sum + 2;
        case '一般':
          return sum + 1;
        case '不太好':
          return sum + 0;
        default:
          return sum;
      }
    }, 0);
    
    return (totalMood / records.length).toFixed(1);
  };
  return (
    <div>
      <h1 className="page-title">分析</h1>
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">数据统计</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">本周记录</p>
            <p className="text-2xl font-bold">{records.filter(record => {
              const recordDate = new Date(record.createdAt);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return recordDate >= weekAgo;
            }).length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">总记录</p>
            <p className="text-2xl font-bold">{records.length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">情绪平均值</p>
            <p className="text-2xl font-bold">{calculateAverageMood()}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-medium mb-3">过去7天记录趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.dailyRecords}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="font-medium mb-3">情绪趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.moodTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 2]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="mood" stroke="#2196F3" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-medium mb-3">活动分布</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData.activityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.activityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336'][index % 5]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">AI分析-层级一（数据清洗与结构化）</h2>
        <div className="bg-gray-50 p-4 rounded">
          <p className="mb-2">自动标签化：#技能学习、#前端、#困难</p>
          <p className="mb-2">情绪打分：+3</p>
          <p>关联节点：React 技能树</p>
        </div>
      </div>
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">AI分析-层级二（洞察与发现）</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">归因分析</h3>
            <p>检测到当你前一天睡眠不足（小于6h）且摄入咖啡因时，今日专注度平均下降 40%。</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">隐性模式识别</h3>
            <p>分析显示，你的'放弃'通常发生在项目开始后的第 3 周（热情消退期），建议此时设置强制提醒。</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">性格/价值观动态画像</h3>
            <p>本月你 80% 的记录都与'帮助他人'有关，你的核心价值观正从'成就导向'向'利他导向'偏移。</p>
          </div>
        </div>
      </div>
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">AI分析-层级三（行动建议）</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">动态策略调整</h3>
            <p>你本周'深度学习'节点的进度滞后，但'会议'记录过多。建议下周开启'勿扰模式'，每天预留 2 小时深度工作。</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-2">成长树养护建议</h3>
            <p>你的'编程'技能树已经很久没生长了，要不要回顾一下上个月的笔记？</p>
          </div>
        </div>
      </div>
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">成长报告</h2>
        <div className="bg-gray-50 p-4 rounded">
          <p className="mb-2">本周成长报告（2024-01-01 至 2024-01-07）</p>
          <p>你本周共记录了 3 条活动，主要集中在前端技能学习和项目开发。你的情绪状态整体良好，平均情绪值为 +5。</p>
          <p className="mt-2">AI 建议：继续保持当前的学习节奏，建议增加一些体育锻炼来提高专注力。</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;