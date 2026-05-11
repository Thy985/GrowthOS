import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import reminderServiceV2 from '../../common/services/reminderServiceV2';
import { Reminder, ReminderState, CreateReminderDTO, UpdateReminderDTO } from '../../types';
import logger from '../../utils/logger';

const initialState: ReminderState = {
  reminders: [],
  isLoading: false,
  error: null
};

export const loadReminders = createAsyncThunk('reminder/loadReminders', async () => {
  try {
    logger.info('加载提醒数据');
    const reminders = await reminderServiceV2.getReminders();
    logger.info('提醒数据加载完成', { remindersCount: reminders.length });
    return reminders;
  } catch (error) {
    logger.error('加载提醒数据异常', error);
    throw error;
  }
});

export const addReminder = createAsyncThunk('reminder/addReminder', async (reminder: CreateReminderDTO) => {
  try {
    logger.info('添加提醒', { title: reminder.title, date: reminder.date, time: reminder.time });
    
    const newReminder = await reminderServiceV2.createReminder({
      title: reminder.title,
      description: reminder.description || '',
      date: reminder.date,
      time: reminder.time,
      goalId: reminder.goalId
    });
    
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          const reminderDate = new Date(`${reminder.date}T${reminder.time}`);
          const now = new Date();
          const timeUntilReminder = reminderDate.getTime() - now.getTime();
          
          if (timeUntilReminder > 0) {
            setTimeout(() => {
              new Notification(reminder.title, {
                body: reminder.description,
                icon: '/favicon.ico'
              });
            }, timeUntilReminder);
          }
        }
      });
    }
    
    logger.info('提醒添加成功', { reminderId: newReminder.id });
    return newReminder;
  } catch (error) {
    logger.error('添加提醒异常', error, { title: reminder.title, date: reminder.date, time: reminder.time });
    throw error;
  }
});

export const updateReminder = createAsyncThunk('reminder/updateReminder', async (reminder: Reminder) => {
  try {
    logger.info('更新提醒', { reminderId: reminder.id, title: reminder.title });
    
    const updates: UpdateReminderDTO = {
      title: reminder.title,
      description: reminder.description,
      date: reminder.date,
      time: reminder.time,
      isCompleted: reminder.isCompleted
    };
    
    const updatedReminder = await reminderServiceV2.updateReminder(reminder.id, updates);
    
    logger.info('提醒更新成功', { reminderId: reminder.id });
    return updatedReminder;
  } catch (error) {
    logger.error('更新提醒异常', error, { reminderId: reminder.id });
    throw error;
  }
});

export const deleteReminder = createAsyncThunk('reminder/deleteReminder', async (reminderId: string) => {
  try {
    logger.info('删除提醒', { reminderId });
    await reminderServiceV2.deleteReminder(reminderId);
    logger.info('提醒删除成功', { reminderId });
    return reminderId;
  } catch (error) {
    logger.error('删除提醒异常', error, { reminderId });
    throw error;
  }
});

export const completeReminder = createAsyncThunk('reminder/completeReminder', async (reminderId: string) => {
  try {
    logger.info('标记提醒为已完成', { reminderId });
    const updatedReminder = await reminderServiceV2.completeReminder(reminderId);
    logger.info('提醒标记成功', { reminderId });
    return updatedReminder;
  } catch (error) {
    logger.error('标记提醒异常', error, { reminderId });
    throw error;
  }
});

const reminderSlice = createSlice({
  name: 'reminder',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadReminders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadReminders.fulfilled, (state, action: PayloadAction<Reminder[]>) => {
        state.isLoading = false;
        state.reminders = action.payload;
      })
      .addCase(loadReminders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '加载提醒失败';
      })
      .addCase(addReminder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addReminder.fulfilled, (state, action: PayloadAction<Reminder>) => {
        state.isLoading = false;
        state.reminders = [action.payload, ...state.reminders];
      })
      .addCase(addReminder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '添加提醒失败';
      })
      .addCase(updateReminder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateReminder.fulfilled, (state, action: PayloadAction<Reminder>) => {
        state.isLoading = false;
        state.reminders = state.reminders.map(r => 
          r.id === action.payload.id ? action.payload : r
        );
      })
      .addCase(updateReminder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '更新提醒失败';
      })
      .addCase(deleteReminder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteReminder.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.reminders = state.reminders.filter(r => r.id !== action.payload);
      })
      .addCase(deleteReminder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '删除提醒失败';
      })
      .addCase(completeReminder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeReminder.fulfilled, (state, action: PayloadAction<Reminder>) => {
        state.isLoading = false;
        state.reminders = state.reminders.map(r => 
          r.id === action.payload.id ? action.payload : r
        );
      })
      .addCase(completeReminder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '标记提醒失败';
      });
  }
});

export const { clearError } = reminderSlice.actions;
export default reminderSlice.reducer;
