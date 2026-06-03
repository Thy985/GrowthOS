import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type ReminderState, type CreateReminderDTO, type UpdateReminderDTO } from '../../types';
import reminderServiceV2 from '../../common/services/reminderServiceV2';

const initialState: ReminderState = {
  reminders: [],
  isLoading: false,
  error: null,
};

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export const fetchReminders = createAsyncThunk(
  'reminders/fetchReminders',
  async (_, { rejectWithValue }) => {
    try {
      return await reminderServiceV2.getReminders();
    } catch (error) {
      return rejectWithValue(toMessage(error, '获取提醒失败'));
    }
  }
);

export const addReminder = createAsyncThunk(
  'reminders/addReminder',
  async (reminder: CreateReminderDTO, { rejectWithValue }) => {
    try {
      return await reminderServiceV2.createReminder(reminder);
    } catch (error) {
      return rejectWithValue(toMessage(error, '创建提醒失败'));
    }
  }
);

export const updateReminder = createAsyncThunk(
  'reminders/updateReminder',
  async ({ id, updates }: { id: string, updates: UpdateReminderDTO }, { rejectWithValue }) => {
    try {
      return await reminderServiceV2.updateReminder(id, updates);
    } catch (error) {
      return rejectWithValue(toMessage(error, '更新提醒失败'));
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
      return rejectWithValue(toMessage(error, '删除提醒失败'));
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
        state.error = (action.payload as string) ?? '获取提醒失败';
      })
      .addCase(addReminder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addReminder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reminders = state.reminders.filter((r) => !r.id.startsWith('__optimistic__'));
        state.reminders.push(action.payload);
      })
      .addCase(addReminder.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(updateReminder.fulfilled, (state, action) => {
        const index = state.reminders.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reminders[index] = action.payload;
        }
      })
      .addCase(updateReminder.rejected, (_state, _action) => {
        // optimistic 回滚由调用方负责
      })
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.reminders = state.reminders.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteReminder.rejected, (_state, _action) => {
        // optimistic 回滚由调用方负责
      });
  },
});

export const { clearError } = reminderSlice.actions;
export default reminderSlice.reducer;
