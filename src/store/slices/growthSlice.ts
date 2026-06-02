import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
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
      const records = await recordServiceV2.getRecords();
      return records;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '获取记录失败');
    }
  }
);

export const addRecord = createAsyncThunk(
  'growth/addRecord',
  async (record: Omit<GrowthRecord, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const newRecord = await recordServiceV2.createRecord(record);
      return newRecord;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '添加记录失败');
    }
  }
);

export const updateRecord = createAsyncThunk(
  'growth/updateRecord',
  async ({ id, updates }: { id: string, updates: Partial<GrowthRecord> }, { rejectWithValue }) => {
    try {
      const updatedRecord = await recordServiceV2.updateRecord(id, updates);
      return updatedRecord;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '更新记录失败');
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
      return rejectWithValue(error instanceof Error ? error.message : '删除记录失败');
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
    optimisticDeleteRecord: (state, action: PayloadAction<string>) => {
      state.records = state.records.filter((r) => r.id !== action.payload);
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
        state.error = action.payload as string;
      })
      .addCase(addRecord.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = state.records.filter((r) => r.id !== action.payload.id);
        state.records.unshift(action.payload);
      })
      .addCase(addRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateRecord.fulfilled, (state, action) => {
        const index = state.records.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
      })
      .addCase(deleteRecord.fulfilled, (state, action) => {
        state.records = state.records.filter((r) => r.id !== action.payload);
      });
  },
});

export const {
  clearError,
  optimisticAddRecord,
  optimisticUpdateRecord,
  optimisticDeleteRecord,
} = growthSlice.actions;

export const selectGrowthRecords = (state: { growth: GrowthState }) => state.growth.records;
export const selectGrowthLoading = (state: { growth: GrowthState }) => state.growth.isLoading;
export const selectGrowthError = (state: { growth: GrowthState }) => state.growth.error;

export const useGrowth = () => {
  const dispatch = useDispatch();
  const { records, tags, trees, isLoading, error } = useSelector((state: { growth: GrowthState }) => state.growth);

  return {
    records,
    tags,
    trees,
    isLoading,
    error,
    fetchRecords: () => dispatch(fetchRecords()),
    addRecord: (record: Omit<GrowthRecord, 'id' | 'createdAt' | 'updatedAt'>) =>
      dispatch(addRecord(record)),
    updateRecord: (id: string, updates: Partial<GrowthRecord>) =>
      dispatch(updateRecord({ id, updates })),
    deleteRecord: (id: string) => dispatch(deleteRecord(id)),
  };
};

export default growthSlice.reducer;
