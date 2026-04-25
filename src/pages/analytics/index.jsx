import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import { exportData, importData } from '../../store/slices/growthSlice';
import { Card, Button } from '../../components/common';

// 自定义工具提示组件
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded shadow-md border border-gray-200">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 图表颜色配置
const chartColors = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  accent: '#FFC107',
  purple: '#9C27B0',
  error: '#F44336',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6'
};

// 情绪标签映射
const moodLabels = {
  0: '不太好',
  1: '一般',
  2: '很好'
};

const Analytics = () => {
  const [importStatus, setImportStatus] = useState({ success: false, message: '' });
  const [activeChart, setActiveChart] = useState('daily');
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d
  const dispatch = useDispatch();
  const { records } = useSelector(state => state.growth);

  // 计算统计数据
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyRecords = records.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= weekAgo;
    }).length;
    
    const totalRecords = records.length;
    
    const moodSum = records.reduce((sum, record) => {
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
      return sum + moodValue;
    }, 0);
    
    const averageMood = totalRecords > 0 ? (moodSum / totalRecords).toFixed(1) : '0.0';
    
    return {
      weeklyRecords,
      totalRecords,
      averageMood
    };
  }, [records]);

  // 处理图表数据
  const chartData = useMemo(() => {
    return processChartData(records, timeRange);
  }, [records, timeRange]);

  // 处理文件导入
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        dispatch(importData(data));
        setImportStatus({ success: true, message: '数据导入成功！' });
        setTimeout(() => {
          setImportStatus({ success: false, message: '' });
        }, 3000);
      } catch (error) {
        setImportStatus({ success: false, message: '数据导入失败，文件格式错误。' });
        setTimeout(() => {
          setImportStatus({ success: false, message: '' });
        }, 3000);
      }
    };
    reader.readAsText(file);
  };

  // 处理图表数据
  const processChartData = (records, timeRange) => {
    // 计算记录数
    const now = new Date();
    const dailyData = [];
    
    // 根据时间范围确定天数
    let days = 7;
    switch (timeRange) {
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      default:
        days = 7;
    }
    
    for (let i = days - 1; i >= 0; i--) {
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
      
      // 获取记录日期
      const recordDate = record.createdAt ? new Date(record.createdAt) : new Date();
      const dateStr = recordDate.toISOString().split('T')[0];
      
      moodData.push({
        day: dateStr,
        mood: moodValue,
        moodLabel: moodLabels[moodValue]
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

    // 计算每周趋势
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekRecords = records.filter(record => {
        const recordDate = new Date(record.createdAt);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });
      
      const weekMood = weekRecords.reduce((sum, record) => {
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
        return sum + moodValue;
      }, 0);
      
      weeklyData.push({
        week: `第${4 - i}周`,
        records: weekRecords.length,
        avgMood: weekRecords.length > 0 ? weekMood / weekRecords.length : 0
      });
    }

    // 技能雷达图数据
    const skillsData = [
      { subject: '编程', A: Math.min(records.filter(r => r.tags?.includes('编程')).length + 3, 10), fullMark: 10 },
      { subject: '学习', A: Math.min(records.filter(r => r.tags?.includes('学习')).length + 2, 10), fullMark: 10 },
      { subject: '阅读', A: Math.min(records.filter(r => r.tags?.includes('阅读')).length + 2, 10), fullMark: 10 },
      { subject: '运动', A: Math.min(records.filter(r => r.tags?.includes('运动')).length + 1, 10), fullMark: 10 },
      { subject: '社交', A: Math.min(records.filter(r => r.tags?.includes('社交')).length + 1, 10), fullMark: 10 },
      { subject: '冥想', A: Math.min(records.filter(r => r.tags?.includes('冥想')).length + 1, 10), fullMark: 10 }
    ];

    // 分类分布
    const categories = ['技能', '认知', '习惯', '生活'];
    const categoryData = categories.map(category => {
      const categoryRecords = records.filter(record => {
        const tags = record.tags || [];
        return tags.some(tag => 
          (category === '技能' && ['编程', '学习', '技能'].includes(tag)) ||
          (category === '认知' && ['阅读', '课程', '观影'].includes(tag)) ||
          (category === '习惯' && ['运动', '早起', '冥想'].includes(tag)) ||
          (category === '生活' && ['家庭', '社交', '旅行'].includes(tag))
        );
      });
      return {
        name: category,
        value: categoryRecords.length
      };
    });
    
    return {
      dailyRecords: dailyData,
      moodTrend: moodData,
      activityDistribution: activityData,
      weeklyTrend: weeklyData,
      skillsRadar: skillsData,
      categoryBreakdown: categoryData
    };
  };

  // 渲染不同的图表
  const renderChart = () => {
    switch (activeChart) {
      case 'daily':
        return (
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-medium mb-3">过去7天记录趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.dailyRecords} animationDuration={1500}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="count" 
                  fill={chartColors.primary} 
                  name="记录数"
                  radius={[4, 4, 0, 0]}
                  animationEasing="ease-in-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'weekly':
        return (
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-medium mb-3">每周趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.weeklyTrend} animationDuration={1500}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="records" 
                  stackId="1"
                  stroke={chartColors.primary} 
                  fill={chartColors.primary}
                  fillOpacity={0.3}
                  name="记录数"
                />
                <Area 
                  type="monotone" 
                  dataKey="avgMood" 
                  stackId="2"
                  stroke={chartColors.secondary} 
                  fill={chartColors.secondary}
                  fillOpacity={0.3}
                  name="平均情绪"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'skills':
        return (
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-medium mb-3">技能雷达图</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={chartData.skillsRadar} animationDuration={1500}>
                <PolarGrid stroke="#f0f0f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} />
                <Radar 
                  name="技能得分" 
                  dataKey="A" 
                  stroke={chartColors.primary} 
                  fill={chartColors.primary} 
                  fillOpacity={0.4} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'categories':
        return (
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-medium mb-3">分类分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.categoryBreakdown} animationDuration={1500} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill={chartColors.secondary} 
                  name="记录数"
                  radius={[0, 4, 4, 0]}
                  animationEasing="ease-in-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">分析</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <input 
              type="file" 
              id="import-file" 
              accept=".json" 
              onChange={handleImport} 
              className="hidden"
            />
            <label 
              htmlFor="import-file" 
              className="btn btn-secondary cursor-pointer"
            >
              导入数据
            </label>
          </div>
          <button 
            onClick={() => dispatch(exportData())} 
            className="btn btn-primary"
          >
            导出数据
          </button>
        </div>
      </div>
      {importStatus.message && (
        <div className={`mb-6 ${importStatus.success ? 'success-message' : 'error-message'}`}>
          {importStatus.message}
        </div>
      )}
      <Card title="数据统计" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">本周记录</p>
            <p className="text-2xl font-bold">{stats.weeklyRecords}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">总记录</p>
            <p className="text-2xl font-bold">{stats.totalRecords}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">情绪平均值</p>
            <p className="text-2xl font-bold">{stats.averageMood}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          {/* 时间范围选择器 */}
          <div className="flex gap-2">
            <span className="text-sm text-gray-600 self-center">时间范围：</span>
            <Button 
              variant={timeRange === '7d' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setTimeRange('7d')}
            >
              7天
            </Button>
            <Button 
              variant={timeRange === '30d' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setTimeRange('30d')}
            >
              30天
            </Button>
            <Button 
              variant={timeRange === '90d' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setTimeRange('90d')}
            >
              90天
            </Button>
          </div>
          
          {/* 图表切换按钮 */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={activeChart === 'daily' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setActiveChart('daily')}
            >
              日趋势
            </Button>
            <Button 
              variant={activeChart === 'weekly' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setActiveChart('weekly')}
            >
              周趋势
            </Button>
            <Button 
              variant={activeChart === 'skills' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setActiveChart('skills')}
            >
              技能雷达
            </Button>
            <Button 
              variant={activeChart === 'categories' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setActiveChart('categories')}
            >
              分类分布
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderChart()}
          <div>
            <h3 className="font-medium mb-3">情绪趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.moodTrend} animationDuration={1500}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  domain={[0, 2]} 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => moodLabels[value]}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded shadow-md border border-gray-200">
                          <p className="font-medium">{label}</p>
                          <p style={{ color: chartColors.secondary }}>
                            情绪: {data.moodLabel}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke={chartColors.secondary} 
                  name="情绪" 
                  activeDot={{ r: 8, fill: chartColors.secondary }}
                  strokeWidth={2}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-medium mb-3">活动分布</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart animationDuration={1500}>
              <Pie
                data={chartData.activityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                animationEasing="ease-in-out"
              >
                {chartData.activityDistribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={[chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.purple, chartColors.error][index % 5]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="AI分析-层级一（数据清洗与结构化）" className="mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <p className="mb-2">自动标签化：#技能学习、#前端、#困难</p>
          <p className="mb-2">情绪打分：+3</p>
          <p>关联节点：React 技能树</p>
        </div>
      </Card>
      <Card title="AI分析-层级二（洞察与发现）" className="mb-6">
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
      </Card>
      <Card title="AI分析-层级三（行动建议）" className="mb-6">
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
      </Card>
      <Card title="成长报告">
        <div className="bg-gray-50 p-4 rounded">
          <p className="mb-2">本周成长报告（2024-01-01 至 2024-01-07）</p>
          <p>你本周共记录了 3 条活动，主要集中在前端技能学习和项目开发。你的情绪状态整体良好，平均情绪值为 +5。</p>
          <p className="mt-2">AI 建议：继续保持当前的学习节奏，建议增加一些体育锻炼来提高专注力。</p>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
