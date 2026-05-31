import React, { useState, useMemo, memo } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Sparkles, Calendar } from 'lucide-react';
import { WeeklyReportGenerator } from '../../utils/weeklyReportGenerator';
import { InsightsService } from '../../common/services/insightsService';
import { useI18n } from '../../i18n/useI18n';
import type { RootState } from '../../types';
import WeeklyReport from '../../components/common/WeeklyReport';
import InsightCard from '../../components/common/InsightCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

type ViewMode = 'overview' | 'report' | 'insights';

const InsightsDashboard: React.FC = () => {
  useI18n();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  
  const { records } = useSelector((state: RootState) => state.growth);
  const { goals } = useSelector((state: RootState) => state.goal);

  const currentWeekDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + (selectedWeekOffset * 7));
    return date;
  }, [selectedWeekOffset]);

  const weeklyReport = useMemo(() => {
    return WeeklyReportGenerator.generateWeeklyReport(records, goals, currentWeekDate);
  }, [records, goals, currentWeekDate]);

  const insights = useMemo(() => {
    return InsightsService.generateInsights(records, goals);
  }, [records, goals]);

  const streakInfo = useMemo(() => {
    return InsightsService.getStreakInfo(records);
  }, [records]);

  const handlePreviousWeek = () => {
    setSelectedWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    if (selectedWeekOffset < 0) {
      setSelectedWeekOffset(prev => prev + 1);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      ...weeklyReport,
      generatedAt: new Date().toISOString(),
      userStats: {
        currentStreak: streakInfo.current,
        longestStreak: streakInfo.longest
      }
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growth-report-${weeklyReport.startDate}-${weeklyReport.endDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const ViewModeTabs = () => (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => setViewMode('overview')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          viewMode === 'overview'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        总览
      </button>
      <button
        onClick={() => setViewMode('report')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
          viewMode === 'report'
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Calendar size={16} />
        周报
      </button>
      <button
        onClick={() => setViewMode('insights')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
          viewMode === 'insights'
            ? 'bg-purple-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Sparkles size={16} />
        洞察
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">数据洞察 📊</h1>
          <p className="text-gray-600 mt-1">深入了解你的成长轨迹</p>
        </div>
        <div className="flex gap-3">
          <Card className="px-4 py-2 text-center">
            <div className="text-2xl font-bold text-orange-500">🔥 {streakInfo.current}</div>
            <div className="text-xs text-gray-500">当前连续</div>
          </Card>
          <Card className="px-4 py-2 text-center">
            <div className="text-2xl font-bold text-amber-500">🏆 {streakInfo.longest}</div>
            <div className="text-xs text-gray-500">最长连续</div>
          </Card>
        </div>
      </div>

      <ViewModeTabs />

      {viewMode === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="本周数据总览 📅">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">记录数量</span>
                  <Badge variant="info">{weeklyReport.summary.totalRecords} 条</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">心情指数</span>
                  <Badge variant={
                    weeklyReport.summary.avgMoodScore >= 80 ? 'success' :
                    weeklyReport.summary.avgMoodScore >= 50 ? 'warning' : 'error'
                  }>
                    {weeklyReport.summary.avgMoodScore}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">活跃天数</span>
                  <Badge variant="info">
                    {weeklyReport.dailyBreakdown.filter(d => d.records.length > 0).length} 天
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">使用标签</span>
                  <Badge variant="default">{weeklyReport.summary.tagsUsed.length} 个</Badge>
                </div>
              </div>
            </Card>

            <Card title="目标进度 🎯">
              <div className="space-y-4">
                {weeklyReport.goalsProgress.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">暂无活跃目标</p>
                ) : (
                  weeklyReport.goalsProgress.slice(0, 3).map(({ goal, progress, isOnTrack }) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700 truncate">{goal.title}</span>
                        <Badge variant={isOnTrack ? 'success' : 'warning'}>
                          {isOnTrack ? '正常' : '落后'}
                        </Badge>
                      </div>
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 0.5 }}
                          className={`absolute left-0 top-0 h-full ${
                            isOnTrack ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        {progress}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card title="最新洞察 💡">
            <div className="space-y-3">
              {insights.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无洞察</p>
              ) : (
                insights.slice(0, 5).map(insight => (
                  <InsightCard key={insight.id} insight={insight} />
                ))
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setViewMode('report')}
              className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-shadow text-left"
            >
              <Calendar className="text-green-600 mb-3" size={32} />
              <h3 className="font-semibold text-gray-800 mb-1">查看完整周报</h3>
              <p className="text-sm text-gray-600">获取更详细的每周数据分析</p>
            </button>

            <button
              onClick={() => setViewMode('insights')}
              className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-shadow text-left"
            >
              <Sparkles className="text-purple-600 mb-3" size={32} />
              <h3 className="font-semibold text-gray-800 mb-1">查看所有洞察</h3>
              <p className="text-sm text-gray-600">发现隐藏的成长模式和趋势</p>
            </button>
          </div>
        </motion.div>
      )}

      {viewMode === 'report' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <WeeklyReport
            report={weeklyReport}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
            onExport={handleExportReport}
            isCurrentWeek={selectedWeekOffset === 0}
          />
        </motion.div>
      )}

      {viewMode === 'insights' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <Card title="智能洞察 💡">
            <div className="space-y-3">
              {insights.length === 0 ? (
                <p className="text-gray-500 text-center py-8">继续记录更多内容以获取洞察</p>
              ) : (
                insights.map(insight => (
                  <InsightCard key={insight.id} insight={insight} />
                ))
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {InsightsService.analyzePatterns(records).avgRecordsPerWeek.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">平均每周记录</div>
            </Card>

            <Card className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">
                {InsightsService.analyzePatterns(records).consistencyScore}%
              </div>
              <div className="text-sm text-gray-600">一致性得分</div>
            </Card>

            <Card className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {InsightsService.analyzePatterns(records).commonTags.length}
              </div>
              <div className="text-sm text-gray-600">常用标签</div>
            </Card>
          </div>

          {InsightsService.analyzePatterns(records).commonTags.length > 0 && (
            <Card title="常用标签 🏷️">
              <div className="flex flex-wrap gap-2">
                {InsightsService.analyzePatterns(records).commonTags.map(tag => (
                  <Badge key={tag} variant="default">#{tag}</Badge>
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default memo(InsightsDashboard);
