// treeSlice - 阶段 E: 接收 growthSlice 中 trees 相关监听
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Tree } from '../../../shared/types';
import { importData, loadData } from '../../../store/slices/growthSlice';

export interface TreeState {
  trees: Tree[];
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
    setTrees: (state, action: PayloadAction<Tree[]>) => {
      state.trees = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trees = action.payload.trees;
      })
      .addCase(loadData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      .addCase(importData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(importData.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.trees) state.trees = action.payload.trees;
      })
      .addCase(importData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      });
  },
});

export const { setTrees, clearError } = treeSlice.actions;
export default treeSlice.reducer;
