import React, { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  BookOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useI18n } from '../../i18n/useI18n';
import type { WeeklyReport } from '../../utils/weeklyReportGenerator';
import Card from '../common/Card';

interface WeeklyReportProps {
  report: WeeklyReport,
  onPreviousWeek?: () => void,
  onNextWeek?: () => void,
  onExport?: () => void,
  isCurrentWeek?: boolean,
}

const WeeklyReport: React.FC<WeeklyReportProps> = memo(({
  report,
  onPreviousWeek,
  onNextWeek,
  onExport,
  isCurrentWeek = true
}) => {
  useI18n();

  const getMoodEmoji = (mood: string): string => {
    const moodMap: Record<string, string> = {
      'great': '😊',
      'okay': '😐',
      'not_good': '😔',
      'none': '❓'
    };
    return moodMap[mood] || '❓';
  };

  const getMoodColor = (mood: string): string => {
    const moodMap: Record<string, string> = {
      'great': 'text-emerald-600',
      'okay': 'text-amber-600',
      'not_good': 'text-red-600',
      'none': 'text-gray-400'
    };
    return moodMap[mood] || 'text-gray-400';
  };

  const getPriorityColor = (priority: string): string => {
    const colorMap: Record<string, string> = {
      'high': 'text-red-600 bg-red-50',
      'medium': 'text-amber-600 bg-amber-50',
      'low': 'text-blue-600 bg-blue-50'
    };
    return colorMap[priority] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">
              第 {report.weekNumber} 周报告
            </h2>
            <p className="text-sm text-gray-500">
              {report.startDate} ~ {report.endDate}
            </p>
          </div>
          <button
            onClick={onNextWeek}
            disabled={isCurrentWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            导出报告
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {report.summary.totalRecords}
            </div>
            <div className="text-sm text-gray-600">本周记录</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">
              {report.summary.totalActivities}
            </div>
            <div className="text-sm text-gray-600">活动记录</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {report.summary.totalLearnings}
            </div>
            <div className="text-sm text-gray-600">学习记录</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="text-center">
            <div className={`text-4xl font-bold mb-2 ${getMoodColor(
              report.summary.avgMoodScore >= 80 ? 'great' :
              report.summary.avgMoodScore >= 50 ? 'okay' : 'not_good'
            )}`}>
              {report.summary.avgMoodScore}
            </div>
            <div className="text-sm text-gray-600">心情指数</div>
          </Card>
        </motion.div>
      </div>

      {report.achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card title="本周成就 🏆">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl"
                >
                  <div className="text-3xl">{achievement.icon}</div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{achievement.title}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card title="每日详情 📅">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {report.dailyBreakdown.map((day, _index) => (
              <div
                key={day.date}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{day.dayOfWeek}</span>
                  <span className="text-2xl">{getMoodEmoji(day.mood)}</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">{day.date}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MessageSquare size={14} />
                    <span>{day.records.length} 条记录</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen size={14} />
                    <span>{day.activities.length} 个活动</span>
                  </div>
                </div>
                {day.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {day.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {report.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card title="智能洞察 💡">
            <div className="space-y-3">
              {report.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${getPriorityColor(insight.priority)}`}
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb size={20} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">{insight.title}</h4>
                      <p className="text-sm mt-1 opacity-80">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {report.goalsProgress.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card title="目标进度 🎯">
            <div className="space-y-4">
              {report.goalsProgress.map(({ goal, progress, weeklyProgress, isOnTrack, daysRemaining }) => (
                <div key={goal.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">{goal.title}</h4>
                      <p className="text-sm text-gray-500">
                        剩余 {daysRemaining} 天
                      </p>
                    </div>
                    {isOnTrack ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm">
                        <CheckCircle size={16} />
                        进度正常
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-sm">
                        <AlertCircle size={16} />
                        需要关注
                      </span>
                    )}
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.5 }}
                      className={`absolute left-0 top-0 h-full rounded-full ${
                        isOnTrack ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {goal.currentValue} / {goal.targetValue}
                    </span>
                    <span className={weeklyProgress >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {weeklyProgress >= 0 ? '+' : ''}{weeklyProgress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {report.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card title="建议 📝">
            <div className="space-y-3">
              {report.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-l-4 ${
                    rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                    rec.priority === 'medium' ? 'border-amber-500 bg-amber-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                        {rec.action} →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {report.summary.tagsUsed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card title="本周标签 🏷️">
            <div className="flex flex-wrap gap-2">
              {report.summary.tagsUsed.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
});

WeeklyReport.displayName = 'WeeklyReport';

export default WeeklyReport;
