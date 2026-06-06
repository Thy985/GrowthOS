// capabilitySlice - GrowthOS capability management
import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';

import type {
  Capability,
  CapabilityHistory,
  Experience,
  ExperienceCapabilityLink,
} from '../../../shared/types';
import logger from '../../../shared/utils/logger';
import { secureStorage } from '../../../shared/utils/secureStorage';
import { loadData, importData } from '../../../store/slices/growthSlice';

// Local storage keys
const CAPABILITIES_KEY = 'growthos-capabilities';
const CAPABILITY_HISTORY_KEY = 'growthos-cap-history';

export interface CapabilitiesState {
  capabilities: Capability[];
  history: CapabilityHistory[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CapabilitiesState = {
  capabilities: [],
  history: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const addCapability = createAsyncThunk(
  'capabilities/addCapability',
  async (data: Omit<Capability, 'id' | 'createdAt' | 'lastUpdated'>) => {
    try {
      logger.info('添加能力', {
        name: data.name,
        category: data.category,
      });

      const capabilities = (secureStorage.getItem<Capability[]>(CAPABILITIES_KEY) ||
        []) as Capability[];
      const now = new Date().toISOString();
      const newCapability: Capability = {
        ...data,
        id: Date.now().toString(),
        createdAt: now,
        lastUpdated: now,
      };
      const updatedCapabilities = [newCapability, ...capabilities];
      secureStorage.setItem(CAPABILITIES_KEY, updatedCapabilities);

      logger.info('能力添加成功', { capabilityId: newCapability.id });
      return { capability: newCapability, capabilities: updatedCapabilities };
    } catch (error) {
      logger.error('添加能力异常', error, { name: data.name });
      throw error;
    }
  },
);

export const deleteCapability = createAsyncThunk(
  'capabilities/deleteCapability',
  async (capabilityId: string) => {
    try {
      logger.info('删除能力', { capabilityId });

      const capabilities = (secureStorage.getItem<Capability[]>(CAPABILITIES_KEY) ||
        []) as Capability[];
      const updatedCapabilities = capabilities.filter((cap) => cap.id !== capabilityId);
      secureStorage.setItem(CAPABILITIES_KEY, updatedCapabilities);

      // Remove associated history
      const history = (secureStorage.getItem<CapabilityHistory[]>(CAPABILITY_HISTORY_KEY) ||
        []) as CapabilityHistory[];
      const updatedHistory = history.filter((h) => h.capabilityId !== capabilityId);
      secureStorage.setItem(CAPABILITY_HISTORY_KEY, updatedHistory);

      logger.info('能力删除成功', { capabilityId });
      return { capabilityId, capabilities: updatedCapabilities, history: updatedHistory };
    } catch (error) {
      logger.error('删除能力异常', error, { capabilityId });
      throw error;
    }
  },
);

export const updateCapability = createAsyncThunk(
  'capabilities/updateCapability',
  async ({ id, ...rest }: Partial<Capability> & { id: string }) => {
    try {
      logger.info('更新能力', { capabilityId: id });

      const capabilities = (secureStorage.getItem<Capability[]>(CAPABILITIES_KEY) ||
        []) as Capability[];
      const index = capabilities.findIndex((cap) => cap.id === id);
      if (index === -1) {
        throw new Error(`Capability ${id} not found`);
      }

      const updatedCapability: Capability = {
        ...capabilities[index],
        ...rest,
        id,
        lastUpdated: new Date().toISOString(),
      };
      capabilities[index] = updatedCapability;
      secureStorage.setItem(CAPABILITIES_KEY, [...capabilities]);

      logger.info('能力更新成功', { capabilityId: id });
      return { capability: updatedCapability, capabilities: [...capabilities] };
    } catch (error) {
      logger.error('更新能力异常', error, { capabilityId: id });
      throw error;
    }
  },
);

// Utility: calculate capability level 0-100
export function calculateCapabilityLevel(
  capabilityId: string,
  experiences: Experience[],
  links: ExperienceCapabilityLink[],
): number {
  const expLinks = links.filter((link) => link.capabilityId === capabilityId);
  let totalScore = 0;

  for (const link of expLinks) {
    const exp = experiences.find((e) => e.id === link.experienceId);
    if (!exp) continue;

    const now = new Date();
    const expDate = new Date(exp.createdAt);
    const daysAgo = Math.max(0, (now.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));
    const timeDecay = Math.exp(-daysAgo / 180);

    const reflectionMultiplier = exp.reflection ? 1.5 : 1.0;
    const principleMultiplier = exp.principle ? 2.0 : 1.0;
    const confidenceMultiplier = exp.confidence || 0.5;

    totalScore +=
      link.contribution *
      10 *
      reflectionMultiplier *
      principleMultiplier *
      confidenceMultiplier *
      timeDecay;
  }

  return Math.min(100, Math.round(totalScore));
}

// Slice
const capabilitySlice = createSlice({
  name: 'capabilities',
  initialState,
  reducers: {
    setCapabilities: (state, action: PayloadAction<Capability[]>) => {
      state.capabilities = action.payload;
    },
    setHistory: (state, action: PayloadAction<CapabilityHistory[]>) => {
      state.history = action.payload;
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
        state.capabilities = action.payload.capabilities ?? state.capabilities;
        state.history = action.payload.history ?? state.history;
      })
      // addCapability
      .addCase(addCapability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addCapability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.capabilities = action.payload.capabilities;
      })
      .addCase(addCapability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // deleteCapability
      .addCase(deleteCapability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCapability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.capabilities = action.payload.capabilities;
        state.history = action.payload.history;
      })
      .addCase(deleteCapability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // updateCapability
      .addCase(updateCapability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCapability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.capabilities = action.payload.capabilities;
      })
      .addCase(updateCapability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // importData from growthSlice
      .addCase(importData.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.capabilities) state.capabilities = action.payload.capabilities;
        if (action.payload.history) state.history = action.payload.history;
      });
  },
});

export const { setCapabilities, setHistory, clearError } = capabilitySlice.actions;
export default capabilitySlice.reducer;

// Selectors
export const getCapabilitiesByCategory = createSelector(
  [
    (state: { capabilities: CapabilitiesState }) => state.capabilities.capabilities,
    (_: unknown, category: string) => category,
  ],
  (capabilities, category) => {
    return capabilities.filter((cap) => cap.category === category);
  },
);

export const getCapabilityTree = createSelector(
  [(state: { capabilities: CapabilitiesState }) => state.capabilities.capabilities],
  (capabilities) => {
    const rootCapabilities = capabilities.filter((cap) => !cap.parentId);
    interface CapabilityNode extends Capability {
      children: CapabilityNode[];
    }
    const buildTree = (parentId: string | null): CapabilityNode[] => {
      return capabilities
        .filter((cap) => cap.parentId === parentId)
        .map(
          (cap): CapabilityNode => ({
            ...cap,
            children: buildTree(cap.id),
          }),
        );
    };
    return rootCapabilities.map((cap) => ({
      ...cap,
      children: buildTree(cap.id),
    }));
  },
);
