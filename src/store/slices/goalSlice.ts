import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type GoalState, type Goal } from '../../types';
import goalServiceV2 from '../../common/services/goalServiceV2';

const initialState: GoalState = {
  goals: [],
  isLoading: false,
  error: null,
};

export const fetchGoals = createAsyncThunk(
  'goals/fetchGoals',
  async (_, { rejectWithValue }) => {
    try {
      const goals = await goalServiceV2.getGoals();
      return goals;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '获取目标失败');
    }
  }
);

export const addGoal = createAsyncThunk(
  'goals/addGoal',
  async (goal: Partial<Goal>, { rejectWithValue }) => {
    try {
      const newGoal = await goalServiceV2.createGoal(goal as any);
      return newGoal;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '创建目标失败');
    }
  }
);

export const updateGoal = createAsyncThunk(
  'goals/updateGoal',
  async ({ id, updates }: { id: string, updates: Partial<Goal> }, { rejectWithValue }) => {
    try {
      const updatedGoal = await goalServiceV2.updateGoal(id, updates);
      return updatedGoal;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '更新目标失败');
    }
  }
);

export const deleteGoal = createAsyncThunk(
  'goals/deleteGoal',
  async (id: string, { rejectWithValue }) => {
    try {
      await goalServiceV2.deleteGoal(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '删除目标失败');
    }
  }
);

const goalSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.goals = action.payload;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addGoal.fulfilled, (state, action) => {
        state.goals.push(action.payload);
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        const index = state.goals.findIndex((g) => g.id === action.payload.id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.goals = state.goals.filter((g) => g.id !== action.payload);
      });
  },
});

export const { clearError } = goalSlice.actions;

export default goalSlice.reducer;
