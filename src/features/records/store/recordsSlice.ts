// recordsSlice - PR2 阶段 B 空壳,实际 reducer 在阶段 E 注入
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface RecordsState {
  records: never[];
  tags: never[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RecordsState = {
  records: [],
  tags: [],
  isLoading: false,
  error: null,
};

const recordsSlice = createSlice({
  name: 'records',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setLoading } = recordsSlice.actions;
export default recordsSlice.reducer;
