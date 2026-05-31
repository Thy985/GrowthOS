import React, { useState, useRef, useCallback, memo, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Flame,
  Sprout,
  Target,
  Plus,
  Loader,
  CheckCircle,
  Smile,
  Meh,
  Frown,
  Award,
  Sparkles,
} from 'lucide-react';
import { addRecord } from '../../store/slices/growthSlice';
import { calculateStreak } from '../../utils/recordUtils';
import { GROWTH_BENCHMARKS, STREAK_MILESTONES, ACTIVE_WEEK } from '../../constants';
import { useI18n } from '../../i18n/useI18n';
import type { GrowthRecord, Mood, RootState } from '../../types';
import type { AppDispatch } from '../../store';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const MOOD_ICONS = {
  great: { icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  okay: { icon: Meh, color: 'text-amber-500', bg: 'bg-amber-50' },
  'not_good': { icon: Frown, color: 'text-red-500', bg: 'bg-red-50' },
};

const getMoodLabel = (mood: Mood | undefined): string => {
  const labels: Record<string, string> = {
    'great': '很好',
    'okay': '一般',
    'not_good': '不太好',
  };
  return labels[mood || ''] || '未知';
};

const calculateStats = (records: GrowthRecord[]) => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const thisWeekRecords = records.filter(record => {
    const recordDate = new Date(record.createdAt);
    return recordDate >= weekAgo;
  });
  
  const lastWeekRecords = records.filter(record => {
    const recordDate = new Date(record.createdAt);
    return recordDate >= twoWeeksAgo && recordDate < weekAgo;
  });
  
  const streak = calculateStreak(records);
  
  const moodStats = records.reduce((acc, record) => {
    if (record.mood) {
      acc[record.mood] = (acc[record.mood] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const totalRecords = records.length;
  const growthProgress = Math.min(Math.round((totalRecords / GROWTH_BENCHMARKS.SENIOR) * 100), 100);
  
  const weekChange = thisWeekRecords.length - lastWeekRecords.length;
  const weekChangePercent = lastWeekRecords.length > 0 
    ? Math.round((weekChange / lastWeekRecords.length) * 100) 
    : (thisWeekRecords.length > 0 ? 100 : 0);

  return {
    weeklyRecords: thisWeekRecords.length,
    totalRecords,
    growthProgress,
    streak,
    moodStats,
    weekChange,
    weekChangePercent,
    thisWeekRecords,
    lastWeekRecords
  };
};

const calculateBadges = (stats: ReturnType<typeof calculateStats>) => {
  const earned = [];
  
  if (stats.totalRecords >= GROWTH_BENCHMARKS.FIRST_RECORD) {
    earned.push({ id: 'first_record', name: '初次记录', icon: '🌱', description: '完成第一条记录' });
  }
  if (stats.totalRecords >= GROWTH_BENCHMARKS.STARTER) {
    earned.push({ id: 'ten_records', name: '十次成长', icon: '🌿', description: '完成10条记录' });
  }
  if (stats.totalRecords >= GROWTH_BENCHMARKS.JUNIOR) {
    earned.push({ id: 'fifty_records', name: '稳步前进', icon: '🌳', description: '完成50条记录' });
  }
  if (stats.totalRecords >= GROWTH_BENCHMARKS.SENIOR) {
    earned.push({ id: 'hundred_records', name: '百日成长', icon: '🏆', description: '完成100条记录' });
  }
  
  if (stats.streak >= STREAK_MILESTONES.BEGINNER) {
    earned.push({ id: 'streak_3', name: '连续3天', icon: '🔥', description: '连续记录3天' });
  }
  if (stats.streak >= STREAK_MILESTONES.WEEK) {
    earned.push({ id: 'streak_7', name: '一周坚持', icon: '⭐', description: '连续记录7天' });
  }
  if (stats.streak >= STREAK_MILESTONES.MONTH) {
    earned.push({ id: 'streak_30', name: '月度坚持', icon: '💎', description: '连续记录30天' });
  }
  
  if (stats.weekChangePercent >= ACTIVE_WEEK.MIN_CHANGE_PERCENT && stats.thisWeekRecords.length >= ACTIVE_WEEK.MIN_RECORDS) {
    earned.push({ id: 'active_week', name: '活跃周', icon: '🚀', description: '本周记录数增长50%以上' });
  }
  
  return earned;
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeText?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeText, icon, iconBg, iconColor, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
        <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 font-[var(--font-display)]">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{change >= 0 ? '+' : ''}{changeText || change}</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    activity: '',
    learning: '',
    mood: 'okay' as Mood,
    reflection: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { records, isLoading } = useSelector((state: RootState) => state.growth);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => calculateStats(records), [records]);
  const badges = useMemo(() => calculateBadges(stats), [stats]);

  const recentActivities = useMemo(() => {
    return stats.thisWeekRecords.slice(0, 5).map(record => ({
      id: record.id,
      text: record.activity || record.learning || t('dashboard.noContent'),
      mood: record.mood,
      date: record.createdAt
    }));
  }, [stats.thisWeekRecords, t]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.activity.trim() && !formData.learning.trim()) {
      newErrors.activity = t('dashboard.pleaseEnterActivityOrLearning');
    }
    return newErrors;
  }, [formData, t]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const extractTags = (text: string) => {
        const tagRegex = /#([^\s]+)/g;
        const matches = text.match(tagRegex);
        return matches ? matches.map(tag => tag.substring(1)) : [];
      };
      
      const newRecord = {
        ...formData,
        tags: [...new Set([...extractTags(formData.activity), ...extractTags(formData.learning)])]
      };
      
      dispatch(addRecord(newRecord));
      
      setSuccessMessage(t('dashboard.recordSaved'));
      setTimeout(() => setSuccessMessage(''), 3000);
      
      if (feedbackRef.current) {
        const element = feedbackRef.current;
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        void element.offsetWidth;
        element.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
        setTimeout(() => {
          element.style.opacity = '0';
          element.style.transform = 'scale(0.8)';
        }, 1500);
      }
      
      setFormData({ activity: '', learning: '', mood: 'great', reflection: '' });
    } catch (err) {
      console.error(t('errors.unknown'), err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, dispatch, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={32} />
          <p className="text-[var(--color-text-secondary)]">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] font-[var(--font-display)]">
          {t('dashboard.title')}
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">记录成长每一天</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.weeklyRecords')}
          value={stats.weeklyRecords}
          change={stats.weekChange}
          changeText={`${stats.weekChangePercent}%`}
          icon={<Activity size={24} />}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          delay={0}
        />
        <StatCard
          title={t('dashboard.continuousRecords')}
          value={stats.streak}
          changeText={t('dashboard.days')}
          icon={<Flame size={24} />}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          delay={0.05}
        />
        <StatCard
          title={t('dashboard.totalRecordsCount')}
          value={stats.totalRecords}
          changeText={t('dashboard.recordsUnit')}
          icon={<Sprout size={24} />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          delay={0.1}
        />
        <StatCard
          title={t('dashboard.growthProgress')}
          value={`${stats.growthProgress}%`}
          icon={<Target size={24} />}
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card
              title={t('dashboard.quickRecord')}
              headerAction={
                <Badge variant="info" size="small">
                  <Sparkles size={12} className="mr-1" />
                  快速记录
                </Badge>
              }
            >
              <AnimatePresence mode="wait">
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
                  >
                    <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-emerald-700 font-medium">{successMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                      {t('dashboard.whatDidYouDo')}
                    </label>
                    <input
                      type="text"
                      name="activity"
                      className={`input ${errors.activity ? 'input-error' : ''}`}
                      placeholder={`${t('dashboard.whatDidYouDo')}... ${t('dashboard.supportHashTags')}`}
                      value={formData.activity}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    {errors.activity && (
                      <p className="text-sm text-red-500 mt-1">{errors.activity}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                      {t('dashboard.whatDidYouLearn')}
                    </label>
                    <input
                      type="text"
                      name="learning"
                      className="input"
                      placeholder={`${t('dashboard.whatDidYouLearn')}...`}
                      value={formData.learning}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                      {t('dashboard.howDoYouFeel')}
                    </label>
                    <div className="flex gap-2">
                      {(['great', 'okay', 'not_good'] as Mood[]).map((mood) => {
                        const { icon: MoodIcon, color, bg } = MOOD_ICONS[mood];
                        const isSelected = formData.mood === mood;
                        return (
                          <button
                            key={mood}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, mood }))}
                            disabled={isSubmitting}
                            className={`
                              flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2
                              transition-all duration-200
                              ${isSelected ? `${bg} ${color} border-2 border-current` : 'bg-[var(--color-gray-50)] text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-100)]'}
                              disabled:opacity-50
                            `}
                          >
                            <MoodIcon size={20} />
                            <span className="font-medium text-sm">{getMoodLabel(mood)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                      {t('dashboard.reflection')}
                    </label>
                    <textarea
                      name="reflection"
                      className="input min-h-[72px] resize-none"
                      rows={2}
                      placeholder={t('dashboard.reflectionPlaceholder')}
                      value={formData.reflection}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isSubmitting}
                  leftIcon={<Plus size={18} />}
                >
                  {isSubmitting ? t('dashboard.submitting') : t('dashboard.submitRecord')}
                </Button>
              </form>

              <div ref={feedbackRef} className="opacity-0 mt-4 text-center py-4">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-full">
                  <Sparkles size={24} className="text-emerald-500" />
                  <span className="text-lg font-semibold text-emerald-700">{t('dashboard.experienceGained')}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card title={t('dashboard.weeklyActivity')}>
              {recentActivities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-gray-100)] flex items-center justify-center">
                    <Activity size={32} className="text-[var(--color-gray-400)]" />
                  </div>
                  <p className="text-[var(--color-text-secondary)]">{t('dashboard.noRecordsYet')}</p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">开始记录你的成长吧</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => {
                    const { icon: MoodIcon, color } = MOOD_ICONS[activity.mood as Mood] || MOOD_ICONS.okay;
                    return (
                      <motion.div
                        key={activity.id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-elevated)] transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-xl ${activity.mood === 'great' ? 'bg-emerald-50' : activity.mood === 'okay' ? 'bg-amber-50' : 'bg-red-50'} flex items-center justify-center flex-shrink-0`}>
                          <MoodIcon size={20} className={color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--color-text-primary)] line-clamp-2">{activity.text}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            {new Date(activity.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card title={t('dashboard.growthTreePreview')}>
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl p-8 min-h-[200px] flex items-center justify-center relative overflow-hidden">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, 0, -2, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-center"
                >
                  <div className="text-7xl mb-3">🌳</div>
                  <p className="text-sm text-emerald-600 font-medium">{t('dashboard.growthTreeVisualization')}</p>
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-50/50 to-transparent" />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-3 text-center">
                {t('dashboard.useHashTagsHint')}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card title={t('dashboard.achievementBadges')}>
              {badges.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
                    <Award size={32} className="text-amber-400" />
                  </div>
                  <p className="text-[var(--color-text-secondary)]">{t('dashboard.startRecordingHint')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {badges.map(badge => (
                    <motion.div
                      key={badge.id}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="text-center group relative"
                      title={`${badge.name}: ${badge.description}`}
                    >
                      <div className="w-14 h-14 mx-auto mb-1 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-shadow">
                        {badge.icon}
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium truncate">{badge.name}</p>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {badge.description}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                          <div className="w-2 h-2 bg-gray-900 rotate-45" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Card title={t('dashboard.moodDistribution')}>
              {Object.keys(stats.moodStats).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-gray-100)] flex items-center justify-center">
                    <Smile size={32} className="text-[var(--color-gray-400)]" />
                  </div>
                  <p className="text-[var(--color-text-secondary)]">{t('dashboard.noDataYet')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(stats.moodStats).map(([mood, count]) => {
                    const percent = Math.round((count / stats.totalRecords) * 100);
                    const { icon: MoodIcon, color, bg } = MOOD_ICONS[mood as Mood] || MOOD_ICONS.okay;
                    
                    return (
                      <div key={mood} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                              <MoodIcon size={16} className={color} />
                            </div>
                            <span className="text-sm font-medium text-[var(--color-text-primary)]">{getMoodLabel(mood as Mood)}</span>
                          </div>
                          <span className="text-sm text-[var(--color-text-secondary)]">{count} ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-[var(--color-gray-100)] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className={`h-full rounded-full ${mood === 'great' ? 'bg-emerald-500' : mood === 'okay' ? 'bg-amber-500' : 'bg-red-500'}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default memo(Dashboard);
