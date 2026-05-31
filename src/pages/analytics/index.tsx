import { useState, useMemo } from 'react';
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
  ScatterChart, 
  Scatter, 
  ZAxis, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../types';
import { AppDispatch } from '../../store';
import { exportData, importData } from '../../store/slices/growthSlice';
import ErrorBoundary from '../../components/ErrorBoundary';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded shadow-md border border-gray-200">
        <p className="font-medium">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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

const moodLabels: Record<number, string> = {
  0: '不太好',
  1: '一般',
  2: '很好'
};

interface RecordData {
  createdAt: string;
  mood: string;
  activity?: string;
  tags?: string[];
}

interface GrowthState {
  records: RecordData[];
}

interface Stats {
  weeklyRecords: number;
  totalRecords: number;
  averageMood: string;
}

type ExportFormat = 'json' | 'csv' | 'markdown';

interface ChartDataResult {
  dailyRecords: Array<{ date: string; count: number }>;
  moodTrend: Array<{ day: string; mood: number; moodLabel: string }>;
  activityDistribution: Array<{ name: string; value: number }>;
  weeklyTrend: Array<{ week: string; records: number; avgMood: number }>;
  skillsRadar: Array<{ subject: string; A: number; fullMark: number }>;
  categoryBreakdown: Array<{ name: string; value: number }>;
  studyTimeData: Array<{ date: string; hours: number }>;
  scatterData: Array<{ x: number; y: number; z: number }>;
  heatmapData: Array<{ week: string; activity: string; intensity: number }>;
}

const Analytics = () => {
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string }>({ success: false, message: '' });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<{
    format: ExportFormat;
    dataTypes: string[];
    startDate: string;
    endDate: string;
  }>({
    format: 'json',
    dataTypes: ['records', 'goals', 'tags', 'trees'] as string[],
    startDate: '',
    endDate: ''
  });
  const [activeChart, setActiveChart] = useState('daily');
  const [timeRange, setTimeRange] = useState('7d');
  const dispatch = useDispatch<AppDispatch>();
  const { records } = useSelector<RootState, GrowthState>(state => state.growth);

  const getMoodValue = (mood: string): number => {
    switch (mood) {
      case '很好':
        return 2;
      case '一般':
        return 1;
      case '不太好':
        return 0;
      default:
        return 0;
    }
  };

  const stats = useMemo<Stats>(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyRecords = records.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= weekAgo;
    }).length;
    
    const totalRecords = records.length;
    
    const moodSum = records.reduce((sum, record) => {
      return sum + getMoodValue(record.mood);
    }, 0);
    
    const averageMood = totalRecords > 0 ? (moodSum / totalRecords).toFixed(1) : '0.0';
    
    return {
      weeklyRecords,
      totalRecords,
      averageMood
    };
  }, [records]);

  const processChartData = (records: RecordData[], timeRange: string): ChartDataResult => {
    const now = new Date();
    const dailyData: Array<{ date: string; count: number }> = [];
    
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

    const moodData: Array<{ day: string; mood: number; moodLabel: string }> = [];
    records.slice(0, 10).reverse().forEach((record) => {
      const moodValue = getMoodValue(record.mood);
      
      const recordDate = record.createdAt ? new Date(record.createdAt) : new Date();
      const dateStr = recordDate.toISOString().split('T')[0];
      
      moodData.push({
        day: dateStr,
        mood: moodValue,
        moodLabel: moodLabels[moodValue]
      });
    });

    const activityCounts: Record<string, number> = {};
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
    })).slice(0, 5);

    const weeklyData: Array<{ week: string; records: number; avgMood: number }> = [];
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
        return sum + getMoodValue(record.mood);
      }, 0);
      
      weeklyData.push({
        week: `第${4 - i}周`,
        records: weekRecords.length,
        avgMood: weekRecords.length > 0 ? weekMood / weekRecords.length : 0
      });
    }

    const skillsData = [
      { subject: '编程', A: Math.min(records.filter(r => r.tags?.includes('编程')).length + 3, 10), fullMark: 10 },
      { subject: '学习', A: Math.min(records.filter(r => r.tags?.includes('学习')).length + 2, 10), fullMark: 10 },
      { subject: '阅读', A: Math.min(records.filter(r => r.tags?.includes('阅读')).length + 2, 10), fullMark: 10 },
      { subject: '运动', A: Math.min(records.filter(r => r.tags?.includes('运动')).length + 1, 10), fullMark: 10 },
      { subject: '社交', A: Math.min(records.filter(r => r.tags?.includes('社交')).length + 1, 10), fullMark: 10 },
      { subject: '冥想', A: Math.min(records.filter(r => r.tags?.includes('冥想')).length + 1, 10), fullMark: 10 }
    ];

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

    const studyTimeData: Array<{ date: string; hours: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      studyTimeData.push({
        date: dateStr,
        hours: Math.random() * 5 + 1
      });
    }

    const scatterData = records.slice(0, 20).map(record => ({
      x: getMoodValue(record.mood),
      y: Math.random() * 6 + 1,
      z: record.tags?.length || 0
    }));

    const heatmapData: Array<{ week: string; activity: string; intensity: number }> = [];
    const activities = ['编程', '阅读', '运动', '学习', '社交'];
    for (let week = 1; week <= 4; week++) {
      activities.forEach(activity => {
        heatmapData.push({
          week: `第${week}周`,
          activity,
          intensity: Math.floor(Math.random() * 10) + 1
        });
      });
    }
    
    return {
      dailyRecords: dailyData,
      moodTrend: moodData,
      activityDistribution: activityData,
      weeklyTrend: weeklyData,
      skillsRadar: skillsData,
      categoryBreakdown: categoryData,
      studyTimeData,
      scatterData,
      heatmapData
    };
  };

  const chartData = useMemo(() => {
    return processChartData(records, timeRange);
  }, [records, timeRange]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        dispatch(importData(data));
        setImportStatus({ success: true, message: '数据导入成功！' });
        setTimeout(() => {
          setImportStatus({ success: false, message: '' });
        }, 3000);
      } catch {
        setImportStatus({ success: false, message: '数据导入失败，文件格式错误。' });
        setTimeout(() => {
          setImportStatus({ success: false, message: '' });
        }, 3000);
      }
    };
    reader.readAsText(file);
  };

  const renderChart = () => {
    switch (activeChart) {
      case 'daily':
        return (
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-medium mb-3">过去7天记录趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.dailyRecords}>
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
              <AreaChart data={chartData.weeklyTrend}>
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
              <RadarChart data={chartData.skillsRadar}>
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
              <BarChart data={chartData.categoryBreakdown} layout="vertical">
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

      case 'study-time':
        return (
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-medium mb-3">学习时间趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.studyTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke={chartColors.accent} 
                  name="学习时间（小时）" 
                  activeDot={{ r: 8, fill: chartColors.accent }}
                  strokeWidth={2}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'scatter':
        return (
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-medium mb-3">情绪与学习时间关系</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="情绪" 
                  domain={[0, 2]} 
                  tickFormatter={(value) => moodLabels[value]}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="学习时间（小时）" 
                  domain={[0, 7]}
                />
                <ZAxis type="number" dataKey="z" name="标签数量" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const payloadData = payload[0].payload as { x: number; y: number; z: number };
                      return (
                        <div className="bg-white p-3 rounded shadow-md border border-gray-200">
                          <p className="font-medium">情绪: {moodLabels[payloadData.x]}</p>
                          <p>学习时间: {payloadData.y.toFixed(1)} 小时</p>
                          <p>标签数量: {payloadData.z}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Scatter 
                  name="数据点" 
                  data={chartData.scatterData} 
                  fill={chartColors.purple} 
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );

      case 'heatmap':
        return (
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-medium mb-3">每周活动热力图</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={chartData.heatmapData} 
                layout="vertical" 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="activity" type="category" width={80} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const payloadData = payload[0].payload as { activity: string; week: string; intensity: number };
                      return (
                        <div className="bg-white p-3 rounded shadow-md border border-gray-200">
                          <p className="font-medium">{payloadData.activity}</p>
                          <p>周: {payloadData.week}</p>
                          <p>强度: {payloadData.intensity}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="intensity" 
                  name="活动强度" 
                  fill={chartColors.primary}
                  animationEasing="ease-in-out"
                >
                  {chartData.heatmapData.map((entry, idx) => (
                    <Cell 
                      key={`cell-${idx}`} 
                      fill={`rgba(76, 175, 80, ${0.2 + entry.intensity * 0.08})`} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="analytics-page">
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
            <div className="relative">
              <button 
                className="btn btn-primary"
                onClick={() => setShowExportModal(true)}
              >
                导出数据
              </button>
              {showExportModal && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                  <h3 className="font-medium mb-3">导出选项</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">导出格式</label>
                      <select 
                        className="input w-full" 
                        value={exportOptions.format}
                        onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value as ExportFormat })}
                      >
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                        <option value="markdown">Markdown</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">数据类型</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={exportOptions.dataTypes.includes('records')}
                            onChange={(e) => {
                              const newDataTypes = e.target.checked 
                                ? [...exportOptions.dataTypes, 'records'] 
                                : exportOptions.dataTypes.filter(t => t !== 'records');
                              setExportOptions({ ...exportOptions, dataTypes: newDataTypes });
                            }}
                          />
                          <span className="ml-2 text-sm">记录</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={exportOptions.dataTypes.includes('goals')}
                            onChange={(e) => {
                              const newDataTypes = e.target.checked 
                                ? [...exportOptions.dataTypes, 'goals'] 
                                : exportOptions.dataTypes.filter(t => t !== 'goals');
                              setExportOptions({ ...exportOptions, dataTypes: newDataTypes });
                            }}
                          />
                          <span className="ml-2 text-sm">目标</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={exportOptions.dataTypes.includes('tags')}
                            onChange={(e) => {
                              const newDataTypes = e.target.checked 
                                ? [...exportOptions.dataTypes, 'tags'] 
                                : exportOptions.dataTypes.filter(t => t !== 'tags');
                              setExportOptions({ ...exportOptions, dataTypes: newDataTypes });
                            }}
                          />
                          <span className="ml-2 text-sm">标签</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={exportOptions.dataTypes.includes('trees')}
                            onChange={(e) => {
                              const newDataTypes = e.target.checked 
                                ? [...exportOptions.dataTypes, 'trees'] 
                                : exportOptions.dataTypes.filter(t => t !== 'trees');
                              setExportOptions({ ...exportOptions, dataTypes: newDataTypes });
                            }}
                          />
                          <span className="ml-2 text-sm">成长树</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">时间范围</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                          <input 
                            type="date" 
                            className="input"
                            value={exportOptions.startDate}
                            onChange={(e) => setExportOptions({ ...exportOptions, startDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                          <input 
                            type="date" 
                            className="input"
                            value={exportOptions.endDate}
                            onChange={(e) => setExportOptions({ ...exportOptions, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="btn btn-primary flex-1"
                        onClick={() => {
                          dispatch(exportData({
                            format: exportOptions.format,
                            dataTypes: exportOptions.dataTypes,
                            startDate: exportOptions.startDate ? new Date(exportOptions.startDate) : undefined,
                            endDate: exportOptions.endDate ? new Date(exportOptions.endDate) : undefined
                          }));
                          setShowExportModal(false);
                        }}
                      >
                        导出
                      </button>
                      <button 
                        className="btn btn-outline"
                        onClick={() => setShowExportModal(false)}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {importStatus.message && (
          <div className={`mb-6 ${importStatus.success ? 'success-message' : 'error-message'}`}>
            {importStatus.message}
          </div>
        )}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">数据统计</h2>
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
            <div className="flex gap-2">
              <span className="text-sm text-gray-600 self-center">时间范围：</span>
              <button 
                className={`btn ${timeRange === '7d' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setTimeRange('7d')}
              >
                7天
              </button>
              <button 
                className={`btn ${timeRange === '30d' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setTimeRange('30d')}
              >
                30天
              </button>
              <button 
                className={`btn ${timeRange === '90d' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setTimeRange('90d')}
              >
                90天
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                className={`btn ${activeChart === 'daily' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setActiveChart('daily')}
              >
                日趋势
              </button>
              <button 
                className={`btn ${activeChart === 'weekly' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setActiveChart('weekly')}
              >
                周趋势
              </button>
              <button 
                className={`btn ${activeChart === 'skills' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setActiveChart('skills')}
              >
                技能雷达
              </button>
              <button 
                className={`btn ${activeChart === 'categories' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setActiveChart('categories')}
              >
                分类分布
              </button>
              <button 
                className={`btn ${activeChart === 'study-time' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setActiveChart('study-time')}
              >
                学习时间
              </button>
              <button 
                className={`btn ${activeChart === 'scatter' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setActiveChart('scatter')}
              >
                情绪与学习
              </button>
              <button 
                className={`btn ${activeChart === 'heatmap' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setActiveChart('heatmap')}
              >
                活动热力图
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderChart()}
            <div>
              <h3 className="font-medium mb-3">情绪趋势</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.moodTrend}>
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
                        const data = payload[0].payload as { moodLabel: string };
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
              <PieChart>
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
                  {chartData.activityDistribution.map((entry, idx) => (
                    <Cell 
                      key={`cell-${idx}`} 
                      fill={[chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.purple, chartColors.error][idx % 5]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
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
              <p>分析显示，你的&apos;放弃&apos;通常发生在项目开始后的第 3 周（热情消退期），建议此时设置强制提醒。</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium mb-2">性格/价值观动态画像</h3>
              <p>本月你 80% 的记录都与&apos;帮助他人&apos;有关，你的核心价值观正从&apos;成就导向&apos;向&apos;利他导向&apos;偏移。</p>
            </div>
          </div>
        </div>
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">AI分析-层级三（行动建议）</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium mb-2">动态策略调整</h3>
              <p>你本周&apos;深度学习&apos;节点的进度滞后，但&apos;会议&apos;记录过多。建议下周开启&apos;勿扰模式&apos;，每天预留 2 小时深度工作。</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium mb-2">成长树养护建议</h3>
              <p>你的&apos;编程&apos;技能树已经很久没生长了，要不要回顾一下上个月的笔记？</p>
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
    </ErrorBoundary>
  );
};

export default Analytics;
