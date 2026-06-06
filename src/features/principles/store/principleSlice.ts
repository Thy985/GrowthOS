// principleSlice - GrowthOS principle management
import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';

import type { Principle } from '../../../shared/types';
import logger from '../../../shared/utils/logger';
import { secureStorage } from '../../../shared/utils/secureStorage';
import { loadData, importData } from '../../../store/slices/growthSlice';

// Local storage keys
const PRINCIPLES_KEY = 'growthos-principles';

export interface PrinciplesState {
  principles: Principle[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PrinciplesState = {
  principles: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const addPrinciple = createAsyncThunk(
  'principles/addPrinciple',
  async (data: Omit<Principle, 'id' | 'createdAt'>) => {
    try {
      logger.info('添加原则', {
        content: data.content,
        category: data.category,
      });

      const principles = (secureStorage.getItem<Principle[]>(PRINCIPLES_KEY) || []) as Principle[];
      const newPrinciple: Principle = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      const updatedPrinciples = [newPrinciple, ...principles];
      secureStorage.setItem(PRINCIPLES_KEY, updatedPrinciples);

      logger.info('原则添加成功', { principleId: newPrinciple.id });
      return { principle: newPrinciple, principles: updatedPrinciples };
    } catch (error) {
      logger.error('添加原则异常', error, { content: data.content });
      throw error;
    }
  },
);

export const deletePrinciple = createAsyncThunk(
  'principles/deletePrinciple',
  async (principleId: string) => {
    try {
      logger.info('删除原则', { principleId });

      const principles = (secureStorage.getItem<Principle[]>(PRINCIPLES_KEY) || []) as Principle[];
      const updatedPrinciples = principles.filter((p) => p.id !== principleId);
      secureStorage.setItem(PRINCIPLES_KEY, updatedPrinciples);

      logger.info('原则删除成功', { principleId });
      return { principleId, principles: updatedPrinciples };
    } catch (error) {
      logger.error('删除原则异常', error, { principleId });
      throw error;
    }
  },
);

export const updatePrinciple = createAsyncThunk(
  'principles/updatePrinciple',
  async ({ id, ...rest }: Partial<Principle> & { id: string }) => {
    try {
      logger.info('更新原则', { principleId: id });

      const principles = (secureStorage.getItem<Principle[]>(PRINCIPLES_KEY) || []) as Principle[];
      const index = principles.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new Error(`Principle ${id} not found`);
      }

      const updatedPrinciple: Principle = {
        ...principles[index],
        ...rest,
        id,
      };
      principles[index] = updatedPrinciple;
      secureStorage.setItem(PRINCIPLES_KEY, [...principles]);

      logger.info('原则更新成功', { principleId: id });
      return { principle: updatedPrinciple, principles: [...principles] };
    } catch (error) {
      logger.error('更新原则异常', error, { principleId: id });
      throw error;
    }
  },
);

// Slice
const principleSlice = createSlice({
  name: 'principles',
  initialState,
  reducers: {
    setPrinciples: (state, action: PayloadAction<Principle[]>) => {
      state.principles = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // loadData from growthSlice
      .addCase(loadData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.principles = action.payload.principles ?? state.principles;
      })
      // addPrinciple
      .addCase(addPrinciple.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addPrinciple.fulfilled, (state, action) => {
        state.isLoading = false;
        state.principles = action.payload.principles;
      })
      .addCase(addPrinciple.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // deletePrinciple
      .addCase(deletePrinciple.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletePrinciple.fulfilled, (state, action) => {
        state.isLoading = false;
        state.principles = action.payload.principles;
      })
      .addCase(deletePrinciple.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // updatePrinciple
      .addCase(updatePrinciple.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePrinciple.fulfilled, (state, action) => {
        state.isLoading = false;
        state.principles = action.payload.principles;
      })
      .addCase(updatePrinciple.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // importData from growthSlice
      .addCase(importData.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.principles) state.principles = action.payload.principles;
      });
  },
});

export const { setPrinciples, clearError } = principleSlice.actions;
export default principleSlice.reducer;

// Selectors
export const getPrinciplesByCategory = createSelector(
  [
    (state: { principles: PrinciplesState }) => state.principles.principles,
    (_: unknown, category: string) => category,
  ],
  (principles, category) => {
    return principles.filter((p) => p.category === category);
  },
);

export const getTopPrinciples = createSelector(
  [
    (state: { principles: PrinciplesState }) => state.principles.principles,
    (_: unknown, limit: number = 10) => limit,
  ],
  (principles, limit) => {
    return [...principles]
      .sort((a, b) => b.confidence * b.usageCount - a.confidence * a.usageCount)
      .slice(0, limit);
  },
);
