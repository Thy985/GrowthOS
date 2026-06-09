// experienceSlice - GrowthOS experience management
import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';

import type { Experience, ExperienceCapabilityLink } from '../../../shared/types';
import logger from '../../../shared/utils/logger';
import { secureStorage } from '../../../shared/utils/secureStorage';
import { generateId } from '../../../shared/utils/idGenerator';
import { loadData, importData } from '../../../store/slices/growthSlice';

// Local storage keys
const EXPERIENCES_KEY = 'growthos-experiences';
const LINKS_KEY = 'growthos-exp-cap-links';

export interface ExperiencesState {
  experiences: Experience[];
  links: ExperienceCapabilityLink[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ExperiencesState = {
  experiences: [],
  links: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const addExperience = createAsyncThunk(
  'experiences/addExperience',
  async (
    data: Omit<Experience, 'id' | 'createdAt' | 'updatedAt'> & {
      capabilityLinks?: { capabilityId: string; contribution: number; evidence?: string }[];
    },
  ) => {
    try {
      logger.info('添加经历', {
        event: data.event,
        capabilityLinksCount: data.capabilityLinks?.length ?? 0,
      });

      const experiences = (secureStorage.getItem<Experience[]>(EXPERIENCES_KEY) ||
        []) as Experience[];
      const now = new Date().toISOString();
      const newExperience: Experience = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      const updatedExperiences = [newExperience, ...experiences];
      secureStorage.setItem(EXPERIENCES_KEY, updatedExperiences);

      // Create links if provided
      let updatedLinks: ExperienceCapabilityLink[] = [];
      if (data.capabilityLinks && data.capabilityLinks.length > 0) {
        const existingLinks = (secureStorage.getItem<ExperienceCapabilityLink[]>(LINKS_KEY) ||
          []) as ExperienceCapabilityLink[];
        const newLinks: ExperienceCapabilityLink[] = data.capabilityLinks.map((link, index) => ({
          id: `${newExperience.id}-link-${index}`,
          experienceId: newExperience.id,
          capabilityId: link.capabilityId,
          contribution: link.contribution,
          evidence: link.evidence,
        }));
        updatedLinks = [...existingLinks, ...newLinks];
        secureStorage.setItem(LINKS_KEY, updatedLinks);
      } else {
        updatedLinks = (secureStorage.getItem<ExperienceCapabilityLink[]>(LINKS_KEY) ||
          []) as ExperienceCapabilityLink[];
      }

      logger.info('经历添加成功', { experienceId: newExperience.id });
      return { experience: newExperience, links: updatedLinks };
    } catch (error) {
      logger.error('添加经历异常', error, { event: data.event });
      throw error;
    }
  },
);

export const deleteExperience = createAsyncThunk(
  'experiences/deleteExperience',
  async (experienceId: string) => {
    try {
      logger.info('删除经历', { experienceId });

      const experiences = (secureStorage.getItem<Experience[]>(EXPERIENCES_KEY) ||
        []) as Experience[];
      const updatedExperiences = experiences.filter((exp) => exp.id !== experienceId);
      secureStorage.setItem(EXPERIENCES_KEY, updatedExperiences);

      // Remove associated links
      const links = (secureStorage.getItem<ExperienceCapabilityLink[]>(LINKS_KEY) ||
        []) as ExperienceCapabilityLink[];
      const updatedLinks = links.filter((link) => link.experienceId !== experienceId);
      secureStorage.setItem(LINKS_KEY, updatedLinks);

      logger.info('经历删除成功', { experienceId });
      return { experienceId, experiences: updatedExperiences, links: updatedLinks };
    } catch (error) {
      logger.error('删除经历异常', error, { experienceId });
      throw error;
    }
  },
);

export const updateExperience = createAsyncThunk(
  'experiences/updateExperience',
  async ({ id, ...rest }: Partial<Experience> & { id: string }) => {
    try {
      logger.info('更新经历', { experienceId: id });

      const experiences = (secureStorage.getItem<Experience[]>(EXPERIENCES_KEY) ||
        []) as Experience[];
      const index = experiences.findIndex((exp) => exp.id === id);
      if (index === -1) {
        throw new Error(`Experience ${id} not found`);
      }

      const updatedExperience: Experience = {
        ...experiences[index],
        ...rest,
        id,
        updatedAt: new Date().toISOString(),
      };
      experiences[index] = updatedExperience;
      secureStorage.setItem(EXPERIENCES_KEY, [...experiences]);

      logger.info('经历更新成功', { experienceId: id });
      return { experience: updatedExperience, experiences: [...experiences] };
    } catch (error) {
      logger.error('更新经历异常', error, { experienceId: id });
      throw error;
    }
  },
);

// Slice
const experienceSlice = createSlice({
  name: 'experiences',
  initialState,
  reducers: {
    setExperiences: (state, action: PayloadAction<Experience[]>) => {
      state.experiences = action.payload;
    },
    setLinks: (state, action: PayloadAction<ExperienceCapabilityLink[]>) => {
      state.links = action.payload;
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
        state.experiences = action.payload.experiences ?? state.experiences;
        state.links = action.payload.links ?? state.links;
      })
      // addExperience
      .addCase(addExperience.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addExperience.fulfilled, (state, action) => {
        state.isLoading = false;
        state.experiences = [action.payload.experience, ...state.experiences];
        state.links = action.payload.links;
      })
      .addCase(addExperience.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // deleteExperience
      .addCase(deleteExperience.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteExperience.fulfilled, (state, action) => {
        state.isLoading = false;
        state.experiences = action.payload.experiences;
        state.links = action.payload.links;
      })
      .addCase(deleteExperience.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // updateExperience
      .addCase(updateExperience.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateExperience.fulfilled, (state, action) => {
        state.isLoading = false;
        state.experiences = action.payload.experiences;
      })
      .addCase(updateExperience.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // importData from growthSlice
      .addCase(importData.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.experiences) state.experiences = action.payload.experiences;
        if (action.payload.links) state.links = action.payload.links;
      });
  },
});

export const { setExperiences, setLinks, clearError } = experienceSlice.actions;
export default experienceSlice.reducer;

// Selectors
export const getExperiencesByDateRange = createSelector(
  [
    (state: { experiences: ExperiencesState }) => state.experiences.experiences,
    (_: unknown, startDate: Date) => startDate,
    (_: unknown, __: Date, endDate: Date) => endDate,
  ],
  (experiences, startDate, endDate) => {
    return experiences.filter((exp) => {
      const expDate = new Date(exp.createdAt);
      return expDate >= startDate && expDate <= endDate;
    });
  },
);

export const getExperiencesByCapability = createSelector(
  [
    (state: { experiences: ExperiencesState }) => ({
      experiences: state.experiences.experiences,
      links: state.experiences.links,
    }),
    (_: unknown, capabilityId: string) => capabilityId,
  ],
  ({ experiences, links }, capabilityId) => {
    const experienceIds = new Set(
      links.filter((link) => link.capabilityId === capabilityId).map((link) => link.experienceId),
    );
    return experiences.filter((exp) => experienceIds.has(exp.id));
  },
);
