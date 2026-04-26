import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { secureStorage } from '../../utils/secureStorage';
import { Goal, GoalState } from '../../types';
import logger from '../../utils/logger';

// 初始状态
const initialState: GoalState = {
  goals: [],
  isLoading: false,
  error: null
};

// 加载目标数据
export const loadGoals = createAsyncThunk('goal/loadGoals', async () => {
  try {
    logger.info('加载目标数据');
    const goals = secureStorage.getItem('growth-goals') || [];
    logger.info('目标数据加载完成', { goalsCount: goals.length });
    return goals;
  } catch (error) {
    logger.error('加载目标数据异常', error);
    throw error;
  }
});

// 添加目标
export const addGoal = createAsyncThunk('goal/addGoal', async (goal: Omit<Goal, 'id' | 'currentValue' | 'status' | 'createdAt' | 'updatedAt'>) => {
  try {
    logger.info('添加目标', { title: goal.title, targetValue: goal.targetValue });
    const goals = secureStorage.getItem('growth-goals') || [];
    
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      currentValue: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedGoals = [...goals, newGoal];
    secureStorage.setItem('growth-goals', updatedGoals);
    
    logger.info('目标添加成功', { goalId: newGoal.id });
    return newGoal;
  } catch (error) {
    logger.error('添加目标异常', error, { title: goal.title });
    throw error;
  }
});

// 更新目标
export const updateGoal = createAsyncThunk('goal/updateGoal', async (goal: Partial<Goal> & { id: string }) => {
  try {
    logger.info('更新目标', { goalId: goal.id });
    const goals = secureStorage.getItem('growth-goals') || [];
    
    const updatedGoals = goals.map(g => 
      g.id === goal.id 
        ? { ...g, ...goal, updatedAt: new Date().toISOString() }
        : g
    );
    
    secureStorage.setItem('growth-goals', updatedGoals);
    
    const updatedGoal = updatedGoals.find(g => g.id === goal.id);
    logger.info('目标更新成功', { goalId: goal.id });
    return updatedGoal;
  } catch (error) {
    logger.error('更新目标异常', error, { goalId: goal.id });
    throw error;
  }
});

// 删除目标
export const deleteGoal = createAsyncThunk('goal/deleteGoal', async (goalId: string) => {
  try {
    logger.info('删除目标', { goalId });
    const goals = secureStorage.getItem('growth-goals') || [];
    
    const updatedGoals = goals.filter(g => g.id !== goalId);
    secureStorage.setItem('growth-goals', updatedGoals);
    
    logger.info('目标删除成功', { goalId });
    return goalId;
  } catch (error) {
    logger.error('删除目标异常', error, { goalId });
    throw error;
  }
});

// 增加目标进度
export const incrementGoalProgress = createAsyncThunk('goal/incrementGoalProgress', async ({ goalId, value }: { goalId: string; value: number }) => {
  try {
    logger.info('增加目标进度', { goalId, value });
    const goals = secureStorage.getItem('growth-goals') || [];
    
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        const newCurrentValue = g.currentValue + value;
        let newStatus = g.status;
        if (newCurrentValue >= g.targetValue) {
          newStatus = 'completed';
        }
        return {
          ...g,
          currentValue: newCurrentValue,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return g;
    });
    
    secureStorage.setItem('growth-goals', updatedGoals);
    
    const updatedGoal = updatedGoals.find(g => g.id === goalId);
    logger.info('目标进度更新成功', { goalId, newValue: updatedGoal?.currentValue });
    return updatedGoal;
  } catch (error) {
    logger.error('更新目标进度异常', error, { goalId, value });
    throw error;
  }
});

// 创建goal slice
const goalSlice = createSlice({
  name: 'goal',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 加载目标
      .addCase(loadGoals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadGoals.fulfilled, (state, action: PayloadAction<Goal[]>) => {
        state.isLoading = false;
        state.goals = action.payload;
      })
      .addCase(loadGoals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || null;
      })
      // 添加目标
      .addCase(addGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addGoal.fulfilled, (state, action: PayloadAction<Goal>) => {
        state.isLoading = false;
        state.goals.push(action.payload);
      })
      .addCase(addGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || null;
      })
      // 更新目标
      .addCase(updateGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGoal.fulfilled, (state, action: PayloadAction<Goal | undefined>) => {
        state.isLoading = false;
        if (action.payload) {
          const index = state.goals.findIndex(g => g.id === action.payload?.id);
          if (index !== -1) {
            state.goals[index] = action.payload;
          }
        }
      })
      .addCase(updateGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || null;
      })
      // 删除目标
      .addCase(deleteGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteGoal.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.goals = state.goals.filter(g => g.id !== action.payload);
      })
      .addCase(deleteGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || null;
      })
      // 增加目标进度
      .addCase(incrementGoalProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(incrementGoalProgress.fulfilled, (state, action: PayloadAction<Goal | undefined>) => {
        state.isLoading = false;
        if (action.payload) {
          const index = state.goals.findIndex(g => g.id === action.payload?.id);
          if (index !== -1) {
            state.goals[index] = action.payload;
          }
        }
      })
      .addCase(incrementGoalProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || null;
      });
  }
});

export const { clearError } = goalSlice.actions;
export default goalSlice.reducer;
