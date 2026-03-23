export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'Critical';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
}

export type ViewMode = 'kanban' | 'list' | 'timeline';

export interface FilterState {
  status: TaskStatus[];
  priority: TaskPriority[];
  assignees: string[];
  dateStart: string;
  dateEnd: string;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  activeTaskId: string | null;
}
