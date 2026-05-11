import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import goalServiceV2 from '../../common/services/goalServiceV2';
import { Goal, GoalState, CreateGoalDTO, UpdateGoalDTO } from '../../types';
import logger from '../../utils/logger';
import { STORAGE_KEYS } from '../../constants';

const initialState: GoalState = {
  goals: [],
  isLoading: false,
  error: null
};

export const loadGoals = createAsyncThunk('goal/loadGoals', async () => {
  try {
    logger.info('加载目标数据');
    const goals = await goalServiceV2.getGoals();
    logger.info('目标数据加载完成', { goalsCount: goals.length });
    return goals;
  } catch (error) {
    logger.error('加载目标数据异常', error);
    throw error;
  }
});

export const addGoal = createAsyncThunk('goal/addGoal', async (goal: CreateGoalDTO) => {
  try {
    logger.info('添加目标', { title: goal.title, targetValue: goal.targetValue });
    
    const newGoal = await goalServiceV2.createGoal({
      title: goal.title,
      description: goal.description || '',
      target_value: goal.targetValue,
      start_date: goal.startDate,
      end_date: goal.endDate
    });
    
    logger.info('目标添加成功', { goalId: newGoal.id });
    return newGoal;
  } catch (error) {
    logger.error('添加目标异常', error, { title: goal.title });
    throw error;
  }
});

export const updateGoal = createAsyncThunk('goal/updateGoal', async (goal: Partial<Goal> & { id: string }) => {
  try {
    logger.info('更新目标', { goalId: goal.id });
    
    const updates: UpdateGoalDTO = {};
    if (goal.title !== undefined) updates.title = goal.title;
    if (goal.description !== undefined) updates.description = goal.description;
    if (goal.targetValue !== undefined) updates.targetValue = goal.targetValue;
    if (goal.currentValue !== undefined) updates.currentValue = goal.currentValue;
    if (goal.status !== undefined) updates.status = goal.status;
    
    const updatedGoal = await goalServiceV2.updateGoal(goal.id, updates);
    
    logger.info('目标更新成功', { goalId: goal.id });
    return updatedGoal;
  } catch (error) {
    logger.error('更新目标异常', error, { goalId: goal.id });
    throw error;
  }
});

export const deleteGoal = createAsyncThunk('goal/deleteGoal', async (goalId: string) => {
  try {
    logger.info('删除目标', { goalId });
    await goalServiceV2.deleteGoal(goalId);
    logger.info('目标删除成功', { goalId });
    return goalId;
  } catch (error) {
    logger.error('删除目标异常', error, { goalId });
    throw error;
  }
});

export const incrementGoalProgress = createAsyncThunk(
  'goal/incrementGoalProgress', 
  async ({ goalId, value }: { goalId: string; value: number }, { getState }) => {
    try {
      logger.info('增加目标进度', { goalId, value });
      
      const state = getState() as { goal: GoalState };
      const goal = state.goal.goals.find(g => g.id === goalId);
      
      if (!goal) {
        throw new Error('目标不存在');
      }
      
      const newCurrentValue = goal.currentValue + value;
      let newStatus = goal.status;
      if (newCurrentValue >= goal.targetValue) {
        newStatus = 'completed';
      }
      
      const updatedGoal = await goalServiceV2.updateGoal(goalId, {
        currentValue: newCurrentValue,
        status: newStatus
      });
      
      logger.info('目标进度更新成功', { goalId, newValue: updatedGoal.currentValue });
      return updatedGoal;
    } catch (error) {
      logger.error('更新目标进度异常', error, { goalId, value });
      throw error;
    }
  }
);

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
      .addCase(updateGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGoal.fulfilled, (state, action: PayloadAction<Goal>) => {
        state.isLoading = false;
        const index = state.goals.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
      })
      .addCase(updateGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || null;
      })
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
      .addCase(incrementGoalProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(incrementGoalProgress.fulfilled, (state, action: PayloadAction<Goal>) => {
        state.isLoading = false;
        const index = state.goals.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.goals[index] = action.payload;
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
