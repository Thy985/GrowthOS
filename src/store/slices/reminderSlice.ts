import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ReminderState, Reminder } from '../../types';
import { reminderService } from '../../common/services/reminderService';

const initialState: ReminderState = {
  reminders: [],
  isLoading: false,
  error: null,
};

export const fetchReminders = createAsyncThunk(
  'reminders/fetchReminders',
  async (_, { rejectWithValue }) => {
    try {
      const reminders = await reminderService.getReminders();
      return reminders;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const addReminder = createAsyncThunk(
  'reminders/addReminder',
  async (reminder: Omit<Reminder, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const newReminder = await reminderService.createReminder(reminder);
      return newReminder;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateReminder = createAsyncThunk(
  'reminders/updateReminder',
  async ({ id, updates }: { id: string; updates: Partial<Reminder> }, { rejectWithValue }) => {
    try {
      const updatedReminder = await reminderService.updateReminder(id, updates);
      return updatedReminder;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deleteReminder = createAsyncThunk(
  'reminders/deleteReminder',
  async (id: string, { rejectWithValue }) => {
    try {
      await reminderService.deleteReminder(id);
      return id;
    } catch (error) {
      return rejectWithValue(error);
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
export default reminderSlice.reducer;
