import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GrowthState, GrowthRecord, MoodType } from '../../types';
import { growthService } from '../../common/services/growthService';

const initialState: GrowthState = {
  records: [],
  isLoading: false,
  error: null,
  currentFilter: 'all',
  searchQuery: '',
};

export const fetchRecords = createAsyncThunk(
  'growth/fetchRecords',
  async (_, { rejectWithValue }) => {
    try {
      const records = await growthService.getRecords();
      return records;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const addRecord = createAsyncThunk(
  'growth/addRecord',
  async (record: Omit<GrowthRecord, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const newRecord = await growthService.createRecord(record);
      return newRecord;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateRecord = createAsyncThunk(
  'growth/updateRecord',
  async ({ id, updates }: { id: string; updates: Partial<GrowthRecord> }, { rejectWithValue }) => {
    try {
      const updatedRecord = await growthService.updateRecord(id, updates);
      return updatedRecord;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const deleteRecord = createAsyncThunk(
  'growth/deleteRecord',
  async (id: string, { rejectWithValue }) => {
    try {
      await growthService.deleteRecord(id);
      return id;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const growthSlice = createSlice({
  name: 'growth',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<string>) => {
      state.currentFilter = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
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
  setFilter,
  setSearchQuery,
  clearError,
  optimisticAddRecord,
  optimisticUpdateRecord,
  optimisticDeleteRecord,
} = growthSlice.actions;

export const selectGrowthRecords = (state: { growth: GrowthState }) => state.growth.records;
export const selectGrowthLoading = (state: { growth: GrowthState }) => state.growth.isLoading;
export const selectGrowthError = (state: { growth: GrowthState }) => state.growth.error;
export const selectCurrentFilter = (state: { growth: GrowthState }) => state.growth.currentFilter;
export const selectSearchQuery = (state: { growth: GrowthState }) => state.growth.searchQuery;

export const useGrowth = () => {
  const records = useSelector(selectGrowthRecords);
  const isLoading = useGrowthLoading();
  const error = useGrowthError();
  const currentFilter = useCurrentFilter();
  const searchQuery = useSearchQuery();

  const filteredRecords = records.filter((record) => {
    const matchesFilter = currentFilter === 'all' || record.category === currentFilter;
    const matchesSearch = record.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const moodStats = records.reduce((acc, record) => {
    if (record.mood) {
      acc[record.mood] = (acc[record.mood] || 0) + 1;
    }
    return acc;
  }, {} as Record<MoodType, number>);

  const categoryStats = records.reduce((acc, record) => {
    acc[record.category] = (acc[record.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    records: filteredRecords,
    allRecords: records,
    isLoading,
    error,
    currentFilter,
    searchQuery,
    moodStats,
    categoryStats,
    fetchRecords: () => dispatch(fetchRecords()),
    addRecord: (record: Omit<GrowthRecord, 'id' | 'createdAt' | 'updatedAt'>) =>
      dispatch(addRecord(record)),
    updateRecord: (id: string, updates: Partial<GrowthRecord>) =>
      dispatch(updateRecord({ id, updates })),
    deleteRecord: (id: string) => dispatch(deleteRecord(id)),
    setFilter: (filter: string) => dispatch(setFilter(filter)),
    setSearchQuery: (query: string) => dispatch(setSearchQuery(query)),
  };
};
