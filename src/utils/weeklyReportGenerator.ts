import type { GrowthRecord, Goal } from '../types';

export interface WeeklyReport {
  weekNumber: number,
  year: number,
  startDate: string,
  endDate: string,
  summary: {
    totalRecords: number,
    totalActivities: number,
    totalLearnings: number,
    avgMoodScore: number,
    moodDistribution: Record<string, number>,
    tagsUsed: string[],
  },
  dailyBreakdown: DailyRecord[],
  achievements: Achievement[],
  insights: Insight[],
  goalsProgress: GoalProgress[],
  recommendations: Recommendation[],
}

export interface DailyRecord {
  date: string,
  dayOfWeek: string,
  records: GrowthRecord[],
  mood: string,
  activities: string[],
  tags: string[],
}

export interface Achievement {
  type: 'streak' | 'milestone' | 'consistency' | 'mood',
  title: string,
  description: string,
  icon: string,
}

export interface Insight {
  type: 'pattern' | 'trend' | 'recommendation' | 'achievement',
  title: string,
  description: string,
  priority: 'high' | 'medium' | 'low',
}

export interface GoalProgress {
  goal: Goal,
  progress: number,
  weeklyProgress: number,
  isOnTrack: boolean,
  daysRemaining: number,
}

export interface Recommendation {
  category: 'activity' | 'learning' | 'habit' | 'social',
  title: string,
  description: string,
  action: string,
  priority: 'high' | 'medium' | 'low',
}

export class WeeklyReportGenerator {
  static generateWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  static getWeekDateRange(date: Date = new Date()): { start: Date, end: Date } {
    const dayOfWeek = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  static filterRecordsForWeek(records: GrowthRecord[], weekDate: Date = new Date()): GrowthRecord[] {
    const { start, end } = this.getWeekDateRange(weekDate);
    return records.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= start && recordDate <= end;
    });
  }

  static calculateMoodScore(records: GrowthRecord[]): number {
    if (records.length === 0) return 0;
    
    const moodScores: Record<string, number> = {
      'great': 100,
      'okay': 60,
      'not_good': 30
    };
    
    const totalScore = records.reduce((sum, record) => {
      return sum + (moodScores[record.mood] || 60);
    }, 0);
    
    return Math.round(totalScore / records.length);
  }

  static getMoodDistribution(records: GrowthRecord[]): Record<string, number> {
    return records.reduce((acc, record) => {
      acc[record.mood] = (acc[record.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  static getAllTags(records: GrowthRecord[]): string[] {
    const tagSet = new Set<string>();
    records.forEach(record => {
      record.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }

  static groupRecordsByDay(records: GrowthRecord[]): Map<string, GrowthRecord[]> {
    const grouped = new Map<string, GrowthRecord[]>();
    
    records.forEach(record => {
      const date = new Date(record.createdAt).toISOString().split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      const group = grouped.get(date);
      if (group) {
        group.push(record);
      }
    });
    
    return grouped;
  }

  static calculateStreak(records: GrowthRecord[]): number {
    if (records.length === 0) return 0;
    
    const sortedDates = [...new Set(
      records.map(r => new Date(r.createdAt).toISOString().split('T')[0])
    )].sort().reverse();
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
      return 0;
    }
    
    let currentDate = new Date(sortedDates[0]);
    
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const diff = Math.abs(currentDate.getTime() - date.getTime());
      
      if (diff <= 86400000) {
        streak++;
        currentDate = date;
      } else {
        break;
      }
    }
    
    return streak;
  }

  static detectPatterns(records: GrowthRecord[]): Insight[] {
    const insights: Insight[] = [];
    
    if (records.length === 0) return insights;
    
    const grouped = this.groupRecordsByDay(records);
    const dayOfWeekCounts = new Array(7).fill(0);
    
    grouped.forEach((dayRecords, date) => {
      const dayIndex = new Date(date).getDay();
      dayOfWeekCounts[dayIndex] = dayRecords.length;
    });
    
    const maxDayIndex = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
    if (dayOfWeekCounts[maxDayIndex] > 0) {
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      insights.push({
        type: 'pattern',
        title: '最活跃日',
        description: `你通常在 ${dayNames[maxDayIndex]} 记录最多，这可能是你最有动力的日子`,
        priority: 'medium'
      });
    }
    
    const recentMood = records.slice(0, 3);
    const avgMood = this.calculateMoodScore(recentMood);
    
    if (avgMood >= 80) {
      insights.push({
        type: 'trend',
        title: '积极趋势',
        description: '最近几天你的心情都很好！继续保持这种状态',
        priority: 'low'
      });
    } else if (avgMood < 50) {
      insights.push({
        type: 'recommendation',
        title: '需要关注',
        description: '最近几天心情较低落，建议多做一些让自己开心的事情',
        priority: 'high'
      });
    }
    
    return insights;
  }

  static generateWeeklyReport(
    records: GrowthRecord[],
    goals: Goal[],
    weekDate: Date = new Date()
  ): WeeklyReport {
    const { start, end } = this.getWeekDateRange(weekDate);
    const weekRecords = this.filterRecordsForWeek(records, weekDate);
    
    const dailyRecords: DailyRecord[] = [];
    const groupedByDay = this.groupRecordsByDay(weekRecords);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = groupedByDay.get(dateStr) || [];
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      
      dailyRecords.push({
        date: dateStr,
        dayOfWeek: dayNames[d.getDay()],
        records: dayRecords,
        mood: dayRecords.length > 0 ? dayRecords[0].mood : 'none',
        activities: dayRecords.map(r => r.activity).filter(Boolean),
        tags: [...new Set(dayRecords.flatMap(r => r.tags))]
      });
    }
    
    const achievements: Achievement[] = [];
    const streak = this.calculateStreak(weekRecords);
    
    if (streak >= 7) {
      achievements.push({
        type: 'streak',
        title: '连续一周 🎉',
        description: `你已连续记录 ${streak} 天！这是非常棒的坚持！`,
        icon: '🔥'
      });
    } else if (streak >= 3) {
      achievements.push({
        type: 'streak',
        title: '连续记录',
        description: `连续记录 ${streak} 天，继续保持！`,
        icon: '⭐'
      });
    }
    
    if (weekRecords.length >= 7) {
      achievements.push({
        type: 'consistency',
        title: '全勤周 🌟',
        description: '本周每天都记录了成长！完美的连续性！',
        icon: '🏆'
      });
    }
    
    const avgMood = this.calculateMoodScore(weekRecords);
    if (avgMood >= 80) {
      achievements.push({
        type: 'mood',
        title: '心情满分 💖',
        description: '本周平均心情指数达到优秀水平',
        icon: '😊'
      });
    }
    
    const insights = this.detectPatterns(weekRecords);
    
    const goalsProgress: GoalProgress[] = goals
      .filter(g => g.status === 'active')
      .map(goal => {
        const daysTotal = Math.ceil(
          (new Date(goal.endDate).getTime() - new Date(goal.startDate).getTime()) / 86400000
        );
        const daysElapsed = Math.ceil(
          (Date.now() - new Date(goal.startDate).getTime()) / 86400000
        );
        const daysRemaining = Math.max(0, daysTotal - daysElapsed);
        const expectedProgress = (daysElapsed / daysTotal) * 100;
        const actualProgress = goal.currentValue / goal.targetValue * 100;
        
        return {
          goal,
          progress: Math.round(actualProgress),
          weeklyProgress: Math.round(actualProgress - expectedProgress),
          isOnTrack: actualProgress >= expectedProgress * 0.9,
          daysRemaining
        };
      });
    
    const recommendations: Recommendation[] = [];
    
    if (weekRecords.length < 5) {
      recommendations.push({
        category: 'activity',
        title: '增加记录频率',
        description: '建议每天记录一次，这样能更好地追踪成长轨迹',
        action: '设置每日提醒',
        priority: 'high'
      });
    }
    
    if (goalsProgress.some(g => !g.isOnTrack)) {
      recommendations.push({
        category: 'habit',
        title: '关注目标进度',
        description: '有些目标进度落后，建议调整计划或增加投入',
        action: '查看落后目标',
        priority: 'high'
      });
    }
    
    const allTags = this.getAllTags(weekRecords);
    if (allTags.length < 3) {
      recommendations.push({
        category: 'learning',
        title: '丰富标签',
        description: '尝试使用更多标签来分类你的记录，便于回顾和分析',
        action: '添加标签',
        priority: 'medium'
      });
    }
    
    return {
      weekNumber: this.generateWeekNumber(weekDate),
      year: weekDate.getFullYear(),
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      summary: {
        totalRecords: weekRecords.length,
        totalActivities: weekRecords.filter(r => r.activity).length,
        totalLearnings: weekRecords.filter(r => r.learning).length,
        avgMoodScore: avgMood,
        moodDistribution: this.getMoodDistribution(weekRecords),
        tagsUsed: allTags
      },
      dailyBreakdown: dailyRecords,
      achievements,
      insights,
      goalsProgress,
      recommendations
    };
  }
}
