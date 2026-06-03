import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { type GrowthState, type GrowthRecord } from '../../types';
import recordServiceV2 from '../../common/services/recordServiceV2';

const initialState: GrowthState = {
  records: [],
  tags: [],
  trees: [],
  isLoading: false,
  error: null,
};

export const fetchRecords = createAsyncThunk(
  'growth/fetchRecords',
  async (_, { rejectWithValue }) => {
    try {
      return await recordServiceV2.getRecords();
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取记录失败';
      return rejectWithValue(message);
    }
  }
);

export const addRecord = createAsyncThunk(
  'growth/addRecord',
  async (record: Parameters<typeof recordServiceV2.createRecord>[0], { rejectWithValue }) => {
    try {
      return await recordServiceV2.createRecord(record);
    } catch (error) {
      const message = error instanceof Error ? error.message : '添加记录失败';
      return rejectWithValue(message);
    }
  }
);

export const updateRecord = createAsyncThunk(
  'growth/updateRecord',
  async (
    { id, updates }: { id: string, updates: Partial<GrowthRecord> },
    { rejectWithValue },
  ) => {
    try {
      return await recordServiceV2.updateRecord(id, updates);
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新记录失败';
      return rejectWithValue(message);
    }
  }
);

export const deleteRecord = createAsyncThunk(
  'growth/deleteRecord',
  async (id: string, { rejectWithValue }) => {
    try {
      await recordServiceV2.deleteRecord(id);
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除记录失败';
      return rejectWithValue(message);
    }
  }
);

const growthSlice = createSlice({
  name: 'growth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    optimisticAddRecord: (state, action: PayloadAction<GrowthRecord>) => {
      state.records.unshift(action.payload);
    },
    optimisticUpdateRecord: (state, action: PayloadAction<GrowthRecord>) => {
      const index = state.records.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    },
    optimisticDeleteRecord: (state, action: PayloadAction<{ id: string, snapshot: GrowthRecord | null }>) => {
      // 用 snapshot 携带"被删掉的那条"，rejected 时能恢复
      state.records = state.records.filter((r) => r.id !== action.payload.id);
    },
    // 回滚 actions：用于 optimistic 失败时手动恢复
    rollbackAddRecord: (state, action: PayloadAction<{ id: string }>) => {
      state.records = state.records.filter((r) => r.id !== action.payload.id);
    },
    rollbackDeleteRecord: (state, action: PayloadAction<GrowthRecord>) => {
      // 把被删的记录插回原位（按 createdAt 排序）
      state.records.push(action.payload);
      state.records.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload;
      })
      .addCase(fetchRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? '获取记录失败';
      })
      .addCase(addRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        // fulfilled 时把"临时乐观记录"（带 __optimistic__ 前缀的）替换为真实记录
        state.records = [
          action.payload,
          ...state.records.filter((r) => !r.id.startsWith('__optimistic__')),
        ];
      })
      .addCase(addRecord.rejected, (state) => {
        state.isLoading = false;
        // 注意：rejected 时由调用方决定是否调用 rollbackAddRecord
        // 这里不清 records，由 dispatch rollback 的方式回滚
      })
      .addCase(updateRecord.fulfilled, (state, action) => {
        const index = state.records.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
      })
      .addCase(updateRecord.rejected, (_state, _action) => {
        // 乐观更新失败回滚应由调用方处理
      })
      .addCase(deleteRecord.fulfilled, (state, action) => {
        state.records = state.records.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteRecord.rejected, (_state, _action) => {
        // 乐观删除失败回滚应由调用方处理
      });
  },
});

export const {
  clearError,
  optimisticAddRecord,
  optimisticUpdateRecord,
  optimisticDeleteRecord,
  rollbackAddRecord,
  rollbackDeleteRecord,
} = growthSlice.actions;

export default growthSlice.reducer;
