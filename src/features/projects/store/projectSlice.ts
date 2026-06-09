// projectSlice - GrowthOS project management
import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';

import type { Project } from '../../../shared/types';
import logger from '../../../shared/utils/logger';
import { secureStorage } from '../../../shared/utils/secureStorage';
import { generateId } from '../../../shared/utils/idGenerator';
import { loadData, importData } from '../../../store/slices/growthSlice';

// Local storage keys
const PROJECTS_KEY = 'growthos-projects';

export interface ProjectsState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const addProject = createAsyncThunk(
  'projects/addProject',
  async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      logger.info('添加项目', {
        name: data.name,
        status: data.status,
      });

      const projects = (secureStorage.getItem<Project[]>(PROJECTS_KEY) || []) as Project[];
      const now = new Date().toISOString();
      const newProject: Project = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      const updatedProjects = [newProject, ...projects];
      secureStorage.setItem(PROJECTS_KEY, updatedProjects);

      logger.info('项目添加成功', { projectId: newProject.id });
      return { project: newProject, projects: updatedProjects };
    } catch (error) {
      logger.error('添加项目异常', error, { name: data.name });
      throw error;
    }
  },
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId: string) => {
    try {
      logger.info('删除项目', { projectId });

      const projects = (secureStorage.getItem<Project[]>(PROJECTS_KEY) || []) as Project[];
      const updatedProjects = projects.filter((p) => p.id !== projectId);
      secureStorage.setItem(PROJECTS_KEY, updatedProjects);

      logger.info('项目删除成功', { projectId });
      return { projectId, projects: updatedProjects };
    } catch (error) {
      logger.error('删除项目异常', error, { projectId });
      throw error;
    }
  },
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, ...rest }: Partial<Project> & { id: string }) => {
    try {
      logger.info('更新项目', { projectId: id });

      const projects = (secureStorage.getItem<Project[]>(PROJECTS_KEY) || []) as Project[];
      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new Error(`Project ${id} not found`);
      }

      const updatedProject: Project = {
        ...projects[index],
        ...rest,
        id,
        updatedAt: new Date().toISOString(),
      };
      projects[index] = updatedProject;
      secureStorage.setItem(PROJECTS_KEY, [...projects]);

      logger.info('项目更新成功', { projectId: id });
      return { project: updatedProject, projects: [...projects] };
    } catch (error) {
      logger.error('更新项目异常', error, { projectId: id });
      throw error;
    }
  },
);

// Slice
const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
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
        state.projects = action.payload.projects ?? state.projects;
      })
      // addProject
      .addCase(addProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.projects;
      })
      .addCase(addProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // deleteProject
      .addCase(deleteProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.projects;
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // updateProject
      .addCase(updateProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.projects;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? null;
      })
      // importData from growthSlice
      .addCase(importData.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.projects) state.projects = action.payload.projects;
      });
  },
});

export const { setProjects, clearError } = projectSlice.actions;
export default projectSlice.reducer;

// Selectors
export const getActiveProjects = createSelector(
  [(state: { projects: ProjectsState }) => state.projects.projects],
  (projects) => {
    return projects.filter((p) => p.status === 'active');
  },
);

export const getCompletedProjects = createSelector(
  [(state: { projects: ProjectsState }) => state.projects.projects],
  (projects) => {
    return projects.filter((p) => p.status === 'completed');
  },
);
