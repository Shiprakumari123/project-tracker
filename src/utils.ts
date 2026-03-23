import type { Task, TaskPriority, TaskStatus } from './types';
import { addDays, format } from 'date-fns';

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'Critical'];
const STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
const ASSIGNEES = ['John Doe', 'Jane Smith', 'Alex Johnson', 'Emily Davis', 'Chris Wilson', 'Sarah Lee', 'Michael Brown'];
const VERBS = ['Design', 'Implement', 'Test', 'Review', 'Fix', 'Update', 'Refactor', 'Deploy', 'Optimize', 'Document'];
const NOUNS = ['API', 'Database', 'Frontend', 'Backend', 'Component', 'Auth', 'UI/UX', 'Module', 'Settings', 'Dashboard'];

export function generateDummyTasks(count: number): Task[] {
  const tasks: Task[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const verb = VERBS[Math.floor(Math.random() * VERBS.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    
    // Generate dates: start date is randomly -15 to +15 days from today
    const startOffset = Math.floor(Math.random() * 30) - 15;
    // Duration is randomly 1 to 14 days
    const duration = Math.floor(Math.random() * 14) + 1;
    
    const startDate = addDays(today, startOffset);
    const dueDate = addDays(startDate, duration);

    tasks.push({
      id: `task-${i + 1}`,
      title: `${verb} ${noun} features`,
      status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
      priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
      assignee: ASSIGNEES[Math.floor(Math.random() * ASSIGNEES.length)],
      startDate: format(startDate, 'yyyy-MM-dd'),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
    });
  }
  return tasks;
}

export function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
}

export function applyFilters(tasks: Task[], searchQuery: string, filters: import('./types').FilterState): Task[] {
  return tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters?.status?.length > 0 && !filters.status.includes(task.status)) return false;
    if (filters?.priority?.length > 0 && !filters.priority.includes(task.priority)) return false;
    if (filters?.assignees?.length > 0 && !filters.assignees.includes(task.assignee)) return false;
    if (filters?.dateStart && task.dueDate < filters.dateStart) return false;
    if (filters?.dateEnd && task.dueDate > filters.dateEnd) return false;
    return true;
  });
}
