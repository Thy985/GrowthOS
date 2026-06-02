import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { type ReminderState, type Reminder } from '../../types';
import reminderServiceV2 from '../../common/services/reminderServiceV2';

const initialState: ReminderState = {
  reminders: [],
  isLoading: false,
  error: null,
};

export const fetchReminders = createAsyncThunk(
  'reminders/fetchReminders',
  async (_, { rejectWithValue }) => {
    try {
      const reminders = await reminderServiceV2.getReminders();
      return reminders;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '获取提醒失败');
    }
  }
);

export const addReminder = createAsyncThunk(
  'reminders/addReminder',
  async (reminder: Omit<Reminder, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const newReminder = await reminderServiceV2.createReminder(reminder);
      return newReminder;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '创建提醒失败');
    }
  }
);

export const updateReminder = createAsyncThunk(
  'reminders/updateReminder',
  async ({ id, updates }: { id: string, updates: Partial<Reminder> }, { rejectWithValue }) => {
    try {
      const updatedReminder = await reminderServiceV2.updateReminder(id, updates);
      return updatedReminder;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '更新提醒失败');
    }
  }
);

export const deleteReminder = createAsyncThunk(
  'reminders/deleteReminder',
  async (id: string, { rejectWithValue }) => {
    try {
      await reminderServiceV2.deleteReminder(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '删除提醒失败');
    }
  }
);

const reminderSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reminders = action.payload;
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addReminder.fulfilled, (state, action) => {
        state.reminders.push(action.payload);
      })
      .addCase(updateReminder.fulfilled, (state, action) => {
        const index = state.reminders.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reminders[index] = action.payload;
        }
      })
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.reminders = state.reminders.filter((r) => r.id !== action.payload);
      });
  },
});

export const { clearError } = reminderSlice.actions;

export const useReminders = () => {
  const dispatch = useDispatch();
  const { reminders, isLoading, error } = useSelector((state: { reminders: ReminderState }) => state.reminders);

  return {
    reminders,
    isLoading,
    error,
    fetchReminders: () => dispatch(fetchReminders()),
    addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => dispatch(addReminder(reminder)),
    updateReminder: (id: string, updates: Partial<Reminder>) => dispatch(updateReminder({ id, updates })),
    deleteReminder: (id: string) => dispatch(deleteReminder(id)),
  };
};

export default reminderSlice.reducer;
