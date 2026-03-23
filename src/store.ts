import { create } from 'zustand';
import type { Task, ViewMode, TaskStatus, FilterState, Collaborator } from './types';
import { generateDummyTasks } from './utils';

interface TaskStore {
  tasks: Task[];
  viewMode: ViewMode;
  searchQuery: string;
  filters: FilterState;
  collaborators: Collaborator[];
  setTasks: (tasks: Task[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  setCollaborators: (collaborators: Collaborator[]) => void;
}

const initialTasks = generateDummyTasks(500);

const FAKE_USERS: Collaborator[] = [
  { id: 'u1', name: 'Alex Rivera', color: 'bg-emerald-500 text-white', activeTaskId: null },
  { id: 'u2', name: 'Sam Chen', color: 'bg-fuchsia-500 text-white', activeTaskId: null },
  { id: 'u3', name: 'Jordan Lee', color: 'bg-cyan-500 text-white', activeTaskId: null },
  { id: 'u4', name: 'Casey Smith', color: 'bg-amber-500 text-white', activeTaskId: null },
];

const defaultFilters: FilterState = {
  status: [],
  priority: [],
  assignees: [],
  dateStart: '',
  dateEnd: '',
};

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: initialTasks,
  viewMode: 'kanban',
  searchQuery: '',
  filters: defaultFilters,
  collaborators: FAKE_USERS,
  setTasks: (tasks) => set({ tasks }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: defaultFilters, searchQuery: '' }),
  updateTaskStatus: (taskId, status) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, status } : t)
  })),
  setCollaborators: (collaborators) => set({ collaborators }),
}));
