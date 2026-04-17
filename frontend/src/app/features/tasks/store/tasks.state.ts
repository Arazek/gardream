export type TaskType = 'water' | 'fertilise' | 'prune' | 'harvest' | 'check' | 'custom';

export interface Task {
  id: string;
  user_id: string;
  plot_slot_id: string | null;
  type: TaskType;
  title: string | null;
  note: string | null;
  due_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  type: TaskType;
  due_date: string;
  title?: string;
  note?: string;
  plot_slot_id?: string;
}

export interface TaskUpdate {
  title?: string;
  note?: string;
  due_date?: string;
  completed?: boolean;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  morning_reminder: boolean;
  evening_reminder: boolean;
  in_app_alerts: boolean;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettingsUpdate {
  morning_reminder?: boolean;
  evening_reminder?: boolean;
  in_app_alerts?: boolean;
  push_token?: string;
}

export interface TasksState {
  tasks: Task[];
  pendingTasks: Task[]; // all pending tasks for notifications — not overwritten by page loads
  loading: boolean;
  error: string | null;
  selectedDate: string | null; // ISO date string YYYY-MM-DD
}

export const initialTasksState: TasksState = {
  tasks: [],
  pendingTasks: [],
  loading: false,
  error: null,
  selectedDate: null,
};
