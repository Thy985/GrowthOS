// treeSlice - PR2 阶段 B 空壳,实际 reducer 在阶段 E 注入
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface TreeState {
  trees: never[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TreeState = {
  trees: [],
  isLoading: false,
  error: null,
};

const treeSlice = createSlice({
  name: 'tree',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setLoading } = treeSlice.actions;
export default treeSlice.reducer;
