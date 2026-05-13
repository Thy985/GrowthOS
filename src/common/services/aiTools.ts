import type { Tree, Record, Goal, Reminder, BadgeStats } from '../../types';
import { getRecords } from '../../common/services/recordServiceV2';
import { getGrowthTrees } from '../../common/services/growthTreeServiceV2';
import { getGoals } from '../../common/services/goalServiceV2';
import { getReminders } from '../../common/services/reminderServiceV2';
import { BADGES } from '../../constants';

// 统计计算函数
const calculateStreak = (records: Record[]): number => {
  if (!records || records.length === 0) return 0;
  
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - i);
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    const hasRecord = sortedRecords.some(record => {
      const recordDate = new Date(record.createdAt).toISOString().split('T')[0];
      return recordDate === checkDateStr;
    });
    
    if (hasRecord) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  return streak;
};

const calculateBadgeStats = (records: Record[], goals: Goal[]): BadgeStats => {
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
  const weekChange = thisWeekRecords.length - lastWeekRecords.length;
  const weekChangePercent = lastWeekRecords.length > 0 
    ? Math.round((weekChange / lastWeekRecords.length) * 100) 
    : (thisWeekRecords.length > 0 ? 100 : 0);
  
  return {
    totalRecords: records.length,
    streak,
    weeklyRecords: thisWeekRecords.length,
    weekChangePercent
  };
};

// 工具执行器接口
interface ToolExecutor {
  execute(params: Record<string, any>): Promise<any>;
}

// 获取技能树
const getGrowthTreesTool: ToolExecutor = {
  async execute() {
    const trees = await getGrowthTrees();
    return { success: true, data: trees };
  }
};

// 获取记录
const getRecordsTool: ToolExecutor = {
  async execute(params: { limit?: number; startDate?: string; endDate?: string }) {
    const allRecords = await getRecords();
    let filtered = [...allRecords];
    
    if (params.startDate) {
      filtered = filtered.filter(r => (r.date || r.createdAt.split('T')[0]) >= params.startDate!);
    }
    if (params.endDate) {
      filtered = filtered.filter(r => (r.date || r.createdAt.split('T')[0]) <= params.endDate!);
    }
    
    const limit = params.limit || 10;
    return { success: true, data: filtered.slice(0, limit) };
  }
};

// 获取目标
const getGoalsTool: ToolExecutor = {
  async execute(params: { status?: string }) {
    const allGoals = await getGoals();
    let filtered = [...allGoals];
    
    if (params.status) {
      filtered = filtered.filter(g => g.status === params.status);
    }
    
    return { success: true, data: filtered };
  }
};

// 获取提醒
const getRemindersTool: ToolExecutor = {
  async execute() {
    const reminders = await getReminders();
    return { success: true, data: reminders };
  }
};

// 获取徽章
const getBadgesTool: ToolExecutor = {
  async execute() {
    const records = await getRecords();
    const goals = await getGoals();
    const stats = calculateBadgeStats(records, goals);
    
    const unlockedBadges = BADGES
      .filter(badge => badge.condition(stats))
      .map(badge => ({ id: badge.id, name: badge.name, icon: badge.icon, description: badge.description }));
    
    const allBadges = BADGES.map(badge => ({
      id: badge.id,
      name: badge.name,
      icon: badge.icon,
      description: badge.description,
      unlocked: unlockedBadges.some(ub => ub.id === badge.id)
    }));
    
    return { success: true, data: { badges: allBadges, stats } };
  }
};

// 分析情绪趋势
const analyzeMoodTrendTool: ToolExecutor = {
  async execute() {
    const records = await getRecords();
    const last30Days = records.slice(0, 30);
    
    const moodCounts: Record<string, number> = { '很好': 0, '一般': 0, '不太好': 0 };
    last30Days.forEach(r => {
      moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
    });
    
    // 计算趋势
    const last10 = last30Days.slice(0, 10);
    const prev10 = last30Days.slice(10, 20);
    
    const avgMood = (moods: string[]) => {
      const score = moods.map(m => m === '很好' ? 2 : m === '一般' ? 1 : 0).reduce((a, b) => a + b, 0);
      return moods.length ? score / moods.length : 0;
    };
    
    return {
      success: true,
      data: {
        moodCounts,
        last30Days: last30Days.map(r => ({ date: r.date || r.createdAt, mood: r.mood })),
        last10Avg: avgMood(last10.map(r => r.mood)),
        prev10Avg: avgMood(prev10.map(r => r.mood))
      }
    };
  }
};

// 分析进度
const analyzeProgressTool: ToolExecutor = {
  async execute() {
    const records = await getRecords();
    const goals = await getGoals();
    const trees = await getGrowthTrees();
    const stats = calculateDashboardStats(records, goals);
    
    const completedGoals = goals.filter(g => g.status === 'completed');
    const activeGoals = goals.filter(g => g.status === 'active');
    
    return {
      success: true,
      data: {
        stats,
        goalSummary: {
          total: goals.length,
          completed: completedGoals.length,
          active: activeGoals.length,
          completionRate: goals.length ? Math.round((completedGoals.length / goals.length) * 100) : 0
        },
        treeSummary: {
          total: trees.length,
          totalNodes: trees.reduce((sum, t) => sum + (t.children?.length || 0), 0)
        }
      }
    };
  }
};

// 建议下一步
const suggestNextStepTool: ToolExecutor = {
  async execute() {
    const records = await getRecords();
    const goals = await getGoals();
    const trees = await getGrowthTrees();
    
    const suggestions = [];
    
    // 检查记录连续性
    if (records.length > 0) {
      const lastRecord = records[0];
      const lastDate = new Date(lastRecord.date || lastRecord.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (lastDate < today) {
        suggestions.push({
          type: 'record',
          title: '记录今日成长',
          description: '你已经一段时间没记录了，今天记得写点什么！',
          priority: 1
        });
      }
    }
    
    // 检查目标进度
    const activeGoals = goals.filter(g => g.status === 'active');
    for (const goal of activeGoals) {
      const progress = goal.currentValue / goal.targetValue;
      if (progress < 0.3) {
        suggestions.push({
          type: 'goal',
          title: '推进目标',
          description: `目标“${goal.title}”进度较慢，赶紧行动起来！`,
          goalId: goal.id,
          priority: 2
        });
        break;
      }
    }
    
    // 检查技能树
    for (const tree of trees) {
      const nodes = tree.children || [];
      const notStarted = nodes.filter(n => n.status === 'not_started');
      if (notStarted.length > 0) {
        suggestions.push({
          type: 'tree',
          title: '开始新技能',
          description: `技能树“${tree.name}”还有未开始的节点，试试学习“${notStarted[0].name}”？`,
          treeId: tree.id,
          priority: 3
        });
        break;
      }
    }
    
    return {
      success: true,
      data: suggestions.sort((a, b) => a.priority - b.priority)
    };
  }
};

// 工具注册表
export const TOOLS = {
  getGrowthTrees: getGrowthTreesTool,
  getRecords: getRecordsTool,
  getGoals: getGoalsTool,
  getReminders: getRemindersTool,
  getBadges: getBadgesTool,
  analyzeMoodTrend: analyzeMoodTrendTool,
  analyzeProgress: analyzeProgressTool,
  suggestNextStep: suggestNextStepTool
} as const;

export type ToolName = keyof typeof TOOLS;

// 执行工具
export const executeTool = async (toolName: string, params: Record<string, any> = {}) => {
  const tool = TOOLS[toolName as ToolName];
  if (!tool) {
    throw new Error(`工具不存在: ${toolName}`);
  }
  
  try {
    return await tool.execute(params);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
};
