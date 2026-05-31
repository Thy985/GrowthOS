import type { GrowthRecord, Goal } from '../../types';

export interface Insight {
  id: string,
  type: 'pattern' | 'trend' | 'recommendation' | 'achievement' | 'warning',
  title: string,
  description: string,
  priority: 'high' | 'medium' | 'low',
  category: 'activity' | 'mood' | 'learning' | 'goal' | 'habit',
  data?: any,
  createdAt: Date,
}

export interface PatternAnalysis {
  mostActiveDay: string | null,
  mostActiveTime: string | null,
  commonTags: string[],
  moodTrend: 'improving' | 'stable' | 'declining',
  avgRecordsPerWeek: number,
  consistencyScore: number,
}

export class InsightsService {
  static analyzePatterns(records: GrowthRecord[]): PatternAnalysis {
    if (records.length === 0) {
      return {
        mostActiveDay: null,
        mostActiveTime: null,
        commonTags: [],
        moodTrend: 'stable',
        avgRecordsPerWeek: 0,
        consistencyScore: 0
      };
    }

    const dayCounts = new Array(7).fill(0);
    const timeCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const tagCounts: Record<string, number> = {};
    
    records.forEach(record => {
      const date = new Date(record.createdAt);
      dayCounts[date.getDay()]++;
      
      const hour = date.getHours();
      if (hour >= 5 && hour < 12) timeCounts.morning++;
      else if (hour >= 12 && hour < 18) timeCounts.afternoon++;
      else if (hour >= 18 && hour < 22) timeCounts.evening++;
      else timeCounts.night++;
      
      record.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const maxDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    const mostActiveDay = dayCounts[maxDayIndex] > 0 ? dayNames[maxDayIndex] : null;
    
    const timeNames = {
      morning: '早上 (5:00-12:00)',
      afternoon: '下午 (12:00-18:00)',
      evening: '晚上 (18:00-22:00)',
      night: '深夜 (22:00-5:00)'
    };
    const mostActiveTimeKey = Object.entries(timeCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    const mostActiveTime = mostActiveTimeKey ? timeNames[mostActiveTimeKey as keyof typeof timeNames] : null;
    
    const commonTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
    
    const moodTrend = this.analyzeMoodTrend(records);
    
    const weeks = this.calculateWeeksActive(records);
    const avgRecordsPerWeek = weeks > 0 ? records.length / weeks : 0;
    
    const consistencyScore = this.calculateConsistencyScore(records);
    
    return {
      mostActiveDay,
      mostActiveTime,
      commonTags,
      moodTrend,
      avgRecordsPerWeek,
      consistencyScore
    };
  }

  private static analyzeMoodTrend(records: GrowthRecord[]): 'improving' | 'stable' | 'declining' {
    if (records.length < 3) return 'stable';
    
    const moodScores: Record<string, number> = {
      'great': 3,
      'okay': 2,
      'not_good': 1
    };
    
    const recentRecords = records
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 7);
    
    const avgScore = recentRecords.reduce(
      (sum, r) => sum + (moodScores[r.mood] || 2),
      0
    ) / recentRecords.length;
    
    if (avgScore >= 2.5) return 'improving';
    if (avgScore <= 1.5) return 'declining';
    return 'stable';
  }

  private static calculateWeeksActive(records: GrowthRecord[]): number {
    if (records.length === 0) return 0;
    
    const dates = records
      .map(r => new Date(r.createdAt).getTime())
      .sort((a, b) => a - b);
    
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const diffDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));
    
    return Math.max(1, Math.ceil(diffDays / 7));
  }

  private static calculateConsistencyScore(records: GrowthRecord[]): number {
    if (records.length === 0) return 0;
    
    const uniqueDays = new Set(
      records.map(r => new Date(r.createdAt).toISOString().split('T')[0])
    ).size;
    
    const weeks = this.calculateWeeksActive(records);
    const expectedDays = weeks * 7;
    const score = (uniqueDays / expectedDays) * 100;
    
    return Math.min(100, Math.round(score));
  }

  static generateInsights(
    records: GrowthRecord[],
    goals: Goal[]
  ): Insight[] {
    const insights: Insight[] = [];
    const patterns = this.analyzePatterns(records);
    
    if (patterns.mostActiveDay) {
      insights.push({
        id: `pattern-day-${Date.now()}`,
        type: 'pattern',
        title: '最活跃日发现',
        description: `你通常在 ${patterns.mostActiveDay} 记录最多。这可能是你最有动力的一天。`,
        priority: 'low',
        category: 'activity',
        data: { day: patterns.mostActiveDay },
        createdAt: new Date()
      });
    }
    
    if (patterns.mostActiveTime) {
      insights.push({
        id: `pattern-time-${Date.now()}`,
        type: 'pattern',
        title: '最佳记录时间',
        description: `你通常在 ${patterns.mostActiveTime} 记录。这个时间段你最有创造力。`,
        priority: 'low',
        category: 'activity',
        data: { time: patterns.mostActiveTime },
        createdAt: new Date()
      });
    }
    
    if (patterns.moodTrend === 'improving') {
      insights.push({
        id: `trend-improving-${Date.now()}`,
        type: 'trend',
        title: '心情持续改善 🌟',
        description: '最近一周你的心情指数在持续上升！继续保持这种积极的状态。',
        priority: 'medium',
        category: 'mood',
        createdAt: new Date()
      });
    } else if (patterns.moodTrend === 'declining') {
      insights.push({
        id: `trend-declining-${Date.now()}`,
        type: 'warning',
        title: '需要关注心情变化',
        description: '最近一周心情指数有所下降。建议多做一些让自己开心的事情，或者找朋友聊聊。',
        priority: 'high',
        category: 'mood',
        createdAt: new Date()
      });
    }
    
    if (patterns.consistencyScore < 50) {
      insights.push({
        id: `consistency-low-${Date.now()}`,
        type: 'recommendation',
        title: '提升记录一致性',
        description: `当前一致性得分为 ${patterns.consistencyScore}%。建议设定每日固定时间来记录你的成长。`,
        priority: 'medium',
        category: 'habit',
        data: { score: patterns.consistencyScore },
        createdAt: new Date()
      });
    } else if (patterns.consistencyScore >= 80) {
      insights.push({
        id: `consistency-high-${Date.now()}`,
        type: 'achievement',
        title: '优秀的记录习惯 🎉',
        description: `一致性得分达到 ${patterns.consistencyScore}%！你有一个非常棒的习惯。`,
        priority: 'low',
        category: 'habit',
        data: { score: patterns.consistencyScore },
        createdAt: new Date()
      });
    }
    
    const weekGoalCount = goals.filter(g => {
      const start = new Date(g.startDate);
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && g.status === 'active';
    }).length;
    
    if (weekGoalCount > 3) {
      insights.push({
        id: `goals-many-${Date.now()}`,
        type: 'recommendation',
        title: '目标过多提醒',
        description: `你本周有 ${weekGoalCount} 个活跃目标。建议专注于 2-3 个最重要的目标以提高成功率。`,
        priority: 'medium',
        category: 'goal',
        data: { count: weekGoalCount },
        createdAt: new Date()
      });
    }
    
    const incompleteGoals = goals.filter(g => {
      if (g.status !== 'active') return false;
      const daysTotal = Math.ceil(
        (new Date(g.endDate).getTime() - new Date(g.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysElapsed = Math.ceil(
        (Date.now() - new Date(g.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const expectedProgress = (daysElapsed / daysTotal) * 100;
      const actualProgress = (g.currentValue / g.targetValue) * 100;
      return actualProgress < expectedProgress * 0.8;
    });
    
    if (incompleteGoals.length > 0) {
      insights.push({
        id: `goals-behind-${Date.now()}`,
        type: 'warning',
        title: '目标进度落后',
        description: `有 ${incompleteGoals.length} 个目标进度落后。建议优先关注这些目标，或者调整计划。`,
        priority: 'high',
        category: 'goal',
        data: { goals: incompleteGoals.map(g => g.title) },
        createdAt: new Date()
      });
    }
    
    const tagCounts: Record<string, number> = {};
    records.forEach(record => {
      record.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const unusedTags = Object.keys(tagCounts).filter(
      tag => tagCounts[tag] === 1
    );
    
    if (unusedTags.length > 0 && unusedTags.length < 5) {
      insights.push({
        id: `tags-unused-${Date.now()}`,
        type: 'recommendation',
        title: '探索新领域',
        description: `你有 ${unusedTags.length} 个标签只用过一次。这些领域值得你更深入地探索。`,
        priority: 'low',
        category: 'learning',
        data: { tags: unusedTags },
        createdAt: new Date()
      });
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  static getStreakInfo(records: GrowthRecord[]): { current: number, longest: number } {
    if (records.length === 0) return { current: 0, longest: 0 };
    
    const sortedDates = [...new Set(
      records.map(r => new Date(r.createdAt).toISOString().split('T')[0])
    )].sort();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (sortedDates[sortedDates.length - 1] === today || 
        sortedDates[sortedDates.length - 1] === yesterday) {
      currentStreak = 1;
      for (let i = sortedDates.length - 2; i >= 0; i--) {
        const current = new Date(sortedDates[i + 1]);
        const previous = new Date(sortedDates[i]);
        const diff = Math.abs(current.getTime() - previous.getTime());
        
        if (diff === 86400000) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i]);
      const previous = new Date(sortedDates[i - 1]);
      const diff = Math.abs(current.getTime() - previous.getTime());
      
      if (diff === 86400000) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { current: currentStreak, longest: longestStreak };
  }
}
