import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GoalState, Goal } from '../../types';
import { goalService } from '../../common/services/goalService';

const initialState: GoalState = {
  goals: [],
  isLoading: false,
  error: null,
};

export const fetchGoals = createAsyncThunk(
  'goals/fetchGoals',
  async (_, { rejectWithValue }) => {
    try {
      const goals = await goalService.getGoals();
      return goals;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const addGoal = createAsyncThunk(
  'goals/addGoal',
  async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const newGoal = await goalService.createGoal(goal);
      return newGoal;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateGoal = createAsyncThunk(
  'goals/updateGoal',
  async ({ id, updates }: { id: string; updates: Partial<Goal> }, { rejectWithValue }) => {
    try {
      const updatedGoal = await goalService.updateGoal(id, updates);
      return updatedGoal;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deleteGoal = createAsyncThunk(
  'goals/deleteGoal',
  async (id: string, { rejectWithValue }) => {
    try {
      await goalService.deleteGoal(id);
      return id;
    } catch (error) {
      return rejectWithValue(error);
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
