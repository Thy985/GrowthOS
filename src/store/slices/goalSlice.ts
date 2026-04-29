import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import goalServiceV2 from '../../common/services/goalServiceV2';
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
    const goals = await goalServiceV2.getGoals();
    logger.info('目标数据加载完成', { goalsCount: goals.length });
    // 转换字段名
    return goals.map(goal => ({
      id: goal.id.toString(),
      title: goal.title,
      description: goal.description,
      targetValue: goal.target_value,
      currentValue: goal.current_value,
      startDate: goal.start_date,
      endDate: goal.end_date,
      status: goal.status,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at
    }));
  } catch (error) {
    logger.error('加载目标数据异常', error);
    throw error;
  }
});

// 添加目标
export const addGoal = createAsyncThunk('goal/addGoal', async (goal: Omit<Goal, 'id' | 'currentValue' | 'status' | 'createdAt' | 'updatedAt'>) => {
  try {
    logger.info('添加目标', { title: goal.title, targetValue: goal.targetValue });
    
    const newGoal = await goalServiceV2.createGoal({
      title: goal.title,
      description: goal.description,
      target_value: goal.targetValue,
      start_date: goal.startDate,
      end_date: goal.endDate
    });
    
    logger.info('目标添加成功', { goalId: newGoal.id });
    return {
      id: newGoal.id.toString(),
      title: newGoal.title,
      description: newGoal.description,
      targetValue: newGoal.target_value,
      currentValue: newGoal.current_value,
      startDate: newGoal.start_date,
      endDate: newGoal.end_date,
      status: newGoal.status,
      createdAt: newGoal.created_at,
      updatedAt: newGoal.updated_at
    };
  } catch (error) {
    logger.error('添加目标异常', error, { title: goal.title });
    throw error;
  }
});

// 更新目标
export const updateGoal = createAsyncThunk('goal/updateGoal', async (goal: Partial<Goal> & { id: string }) => {
  try {
    logger.info('更新目标', { goalId: goal.id });
    
    const updates: any = {};
    if (goal.title !== undefined) updates.title = goal.title;
    if (goal.description !== undefined) updates.description = goal.description;
    if (goal.targetValue !== undefined) updates.target_value = goal.targetValue;
    if (goal.currentValue !== undefined) updates.current_value = goal.currentValue;
    if (goal.status !== undefined) updates.status = goal.status;
    
    const updatedGoal = await goalServiceV2.updateGoal(parseInt(goal.id), updates);
    
    logger.info('目标更新成功', { goalId: goal.id });
    return {
      id: updatedGoal.id.toString(),
      title: updatedGoal.title,
      description: updatedGoal.description,
      targetValue: updatedGoal.target_value,
      currentValue: updatedGoal.current_value,
      startDate: updatedGoal.start_date,
      endDate: updatedGoal.end_date,
      status: updatedGoal.status,
      createdAt: updatedGoal.created_at,
      updatedAt: updatedGoal.updated_at
    };
  } catch (error) {
    logger.error('更新目标异常', error, { goalId: goal.id });
    throw error;
  }
});

// 删除目标
export const deleteGoal = createAsyncThunk('goal/deleteGoal', async (goalId: string) => {
  try {
    logger.info('删除目标', { goalId });
    await goalServiceV2.deleteGoal(parseInt(goalId));
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
    
    // 先获取目标当前状态
    const goals = await goalServiceV2.getGoals();
    const goal = goals.find(g => g.id === parseInt(goalId));
    
    if (!goal) {
      throw new Error('目标不存在');
    }
    
    const newCurrentValue = goal.current_value + value;
    let newStatus = goal.status;
    if (newCurrentValue >= goal.target_value) {
      newStatus = 'completed';
    }
    
    // 更新目标
    const updatedGoal = await goalServiceV2.updateGoal(parseInt(goalId), {
      current_value: newCurrentValue,
      status: newStatus
    });
    
    logger.info('目标进度更新成功', { goalId, newValue: updatedGoal.current_value });
    return {
      id: updatedGoal.id.toString(),
      title: updatedGoal.title,
      description: updatedGoal.description,
      targetValue: updatedGoal.target_value,
      currentValue: updatedGoal.current_value,
      startDate: updatedGoal.start_date,
      endDate: updatedGoal.end_date,
      status: updatedGoal.status,
      createdAt: updatedGoal.created_at,
      updatedAt: updatedGoal.updated_at
    };
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
