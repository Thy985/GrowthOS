import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type GoalState, type CreateGoalDTO, type UpdateGoalDTO } from '../../types';
import goalServiceV2 from '../../common/services/goalServiceV2';

const initialState: GoalState = {
  goals: [],
  isLoading: false,
  error: null,
};

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export const fetchGoals = createAsyncThunk(
  'goals/fetchGoals',
  async (_, { rejectWithValue }) => {
    try {
      return await goalServiceV2.getGoals();
    } catch (error) {
      return rejectWithValue(toMessage(error, '获取目标失败'));
    }
  }
);

export const addGoal = createAsyncThunk(
  'goals/addGoal',
  async (goal: CreateGoalDTO, { rejectWithValue }) => {
    try {
      return await goalServiceV2.createGoal(goal);
    } catch (error) {
      return rejectWithValue(toMessage(error, '创建目标失败'));
    }
  }
);

export const updateGoal = createAsyncThunk(
  'goals/updateGoal',
  async ({ id, updates }: { id: string, updates: UpdateGoalDTO }, { rejectWithValue }) => {
    try {
      return await goalServiceV2.updateGoal(id, updates);
    } catch (error) {
      return rejectWithValue(toMessage(error, '更新目标失败'));
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
      return rejectWithValue(toMessage(error, '删除目标失败'));
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
        state.error = (action.payload as string) ?? '获取目标失败';
      })
      .addCase(addGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addGoal.fulfilled, (state, action) => {
        state.isLoading = false;
        // fulfilled 时清掉任何 __optimistic__ 占位
        state.goals = state.goals.filter((g) => !g.id.startsWith('__optimistic__'));
        state.goals.push(action.payload);
      })
      .addCase(addGoal.rejected, (state) => {
        state.isLoading = false;
        // optimistic 回滚由调用方负责
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        const index = state.goals.findIndex((g) => g.id === action.payload.id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
      })
      .addCase(updateGoal.rejected, (_state, _action) => {
        // optimistic 回滚由调用方负责
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.goals = state.goals.filter((g) => g.id !== action.payload);
      })
      .addCase(deleteGoal.rejected, (_state, _action) => {
        // optimistic 回滚由调用方负责
      });
  },
});

export const { clearError } = goalSlice.actions;
export default goalSlice.reducer;
