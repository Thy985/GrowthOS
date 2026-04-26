import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { secureStorage } from '../../utils/secureStorage';
import { Reminder, ReminderState } from '../../types';
import logger from '../../utils/logger';

// 初始状态
const initialState: ReminderState = {
  reminders: [],
  isLoading: false,
  error: null
};

// 加载提醒数据
export const loadReminders = createAsyncThunk('reminder/loadReminders', async () => {
  try {
    logger.info('加载提醒数据');
    const reminders = secureStorage.getItem('growth-reminders') || [];
    logger.info('提醒数据加载完成', { remindersCount: reminders.length });
    return reminders;
  } catch (error) {
    logger.error('加载提醒数据异常', error);
    throw error;
  }
});

// 添加提醒
export const addReminder = createAsyncThunk('reminder/addReminder', async (reminder: Omit<Reminder, 'id' | 'isCompleted' | 'createdAt' | 'updatedAt'>) => {
  try {
    logger.info('添加提醒', { title: reminder.title, date: reminder.date, time: reminder.time });
    const reminders = secureStorage.getItem('growth-reminders') || [];
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updatedReminders = [newReminder, ...reminders];
    secureStorage.setItem('growth-reminders', updatedReminders);
    
    // 设置浏览器通知
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

// 更新提醒
export const updateReminder = createAsyncThunk('reminder/updateReminder', async (reminder: Reminder) => {
  try {
    logger.info('更新提醒', { reminderId: reminder.id, title: reminder.title });
    const reminders = secureStorage.getItem('growth-reminders') || [];
    const updatedReminders = reminders.map(r => 
      r.id === reminder.id ? { ...reminder, updatedAt: new Date().toISOString() } : r
    );
    secureStorage.setItem('growth-reminders', updatedReminders);
    logger.info('提醒更新成功', { reminderId: reminder.id });
    return reminder;
  } catch (error) {
    logger.error('更新提醒异常', error, { reminderId: reminder.id });
    throw error;
  }
});

// 删除提醒
export const deleteReminder = createAsyncThunk('reminder/deleteReminder', async (reminderId: string) => {
  try {
    logger.info('删除提醒', { reminderId });
    const reminders = secureStorage.getItem('growth-reminders') || [];
    const updatedReminders = reminders.filter(r => r.id !== reminderId);
    secureStorage.setItem('growth-reminders', updatedReminders);
    logger.info('提醒删除成功', { reminderId });
    return reminderId;
  } catch (error) {
    logger.error('删除提醒异常', error, { reminderId });
    throw error;
  }
});

// 标记提醒为已完成
export const completeReminder = createAsyncThunk('reminder/completeReminder', async (reminderId: string) => {
  try {
    logger.info('标记提醒为已完成', { reminderId });
    const reminders = secureStorage.getItem('growth-reminders') || [];
    const updatedReminders = reminders.map(r => 
      r.id === reminderId ? { ...r, isCompleted: true, updatedAt: new Date().toISOString() } : r
    );
    secureStorage.setItem('growth-reminders', updatedReminders);
    logger.info('提醒标记成功', { reminderId });
    return reminderId;
  } catch (error) {
    logger.error('标记提醒异常', error, { reminderId });
    throw error;
  }
});

// 创建reminder slice
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
      // 加载提醒
      .addCase(loadReminders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadReminders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reminders = action.payload;
      })
      .addCase(loadReminders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '加载提醒失败';
      })
      // 添加提醒
      .addCase(addReminder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addReminder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reminders = [action.payload, ...state.reminders];
      })
      .addCase(addReminder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '添加提醒失败';
      })
      // 更新提醒
      .addCase(updateReminder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateReminder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reminders = state.reminders.map(r => 
          r.id === action.payload.id ? action.payload : r
        );
      })
      .addCase(updateReminder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '更新提醒失败';
      })
      // 删除提醒
      .addCase(deleteReminder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reminders = state.reminders.filter(r => r.id !== action.payload);
      })
      .addCase(deleteReminder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || '删除提醒失败';
      })
      // 标记提醒为已完成
      .addCase(completeReminder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeReminder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reminders = state.reminders.map(r => 
          r.id === action.payload ? { ...r, isCompleted: true } : r
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