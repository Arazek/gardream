import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TasksState } from './tasks.state';
import { selectAllSlots, selectAllPlots } from '../../plots/store/plots.selectors';

export const selectTasksState = createFeatureSelector<TasksState>('tasks');

export const selectAllTasks = createSelector(selectTasksState, s => s.tasks);
export const selectAllPendingTasks = createSelector(selectTasksState, s => s.pendingTasks);
export const selectTasksLoading = createSelector(selectTasksState, s => s.loading);
export const selectTasksError = createSelector(selectTasksState, s => s.error);
export const selectSelectedDate = createSelector(selectTasksState, s => s.selectedDate);

export const selectTasksForDate = (date: string) => createSelector(
  selectAllTasks,
  tasks => tasks.filter(t => t.due_date === date),
);

export const selectPendingTasks = createSelector(
  selectAllTasks,
  tasks => tasks.filter(t => !t.completed),
);

export const selectCompletedTasks = createSelector(
  selectAllTasks,
  tasks => tasks.filter(t => t.completed),
);

export const selectTodayTasks = createSelector(
  selectAllTasks, selectSelectedDate,
  (tasks, date) => date ? tasks.filter(t => t.due_date === date) : [],
);

export const selectTodayTasksHardcoded = createSelector(
  selectAllTasks,
  tasks => {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter(t => t.due_date === today);
  },
);

export const selectOverdueTasks = createSelector(
  selectAllPendingTasks,
  tasks => {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter(t => !t.completed && t.due_date < today);
  },
);

// All tasks enriched with a display label derived from slot/crop/plot
export const selectTasksWithLabels = createSelector(
  selectAllTasks,
  selectAllSlots,
  selectAllPlots,
  (tasks, slots, plots) => {
    const slotMap = new Map(slots.map(s => [s.id, s]));
    const plotMap = new Map(plots.map(p => [p.id, p]));
    return tasks.map(t => {
      if (t.plot_slot_id) {
        const slot = slotMap.get(t.plot_slot_id);
        const plot = slot ? plotMap.get(slot.plot_id) : undefined;
        const cropName = slot?.crop?.name ?? null;
        const plotName = plot?.name ?? null;
        const label = cropName && plotName ? `${cropName} in ${plotName}` : (cropName ?? t.title ?? t.type);
        return { ...t, label };
      }
      return { ...t, label: t.title ?? t.type };
    });
  },
);

// Overdue watering tasks joined with crop + plot label: "Carrot in Jordi Boix"
export const selectOverdueWaterTasksWithLabels = createSelector(
  selectOverdueTasks,
  selectAllSlots,
  selectAllPlots,
  (tasks, slots, plots) => {
    const slotMap = new Map(slots.map(s => [s.id, s]));
    const plotMap = new Map(plots.map(p => [p.id, p]));
    return tasks
      .filter(t => t.type === 'water' && t.plot_slot_id)
      .map(t => {
        const slot = slotMap.get(t.plot_slot_id!);
        const plot = slot ? plotMap.get(slot.plot_id) : undefined;
        const cropName = slot?.crop?.name ?? 'crop';
        const plotName = plot?.name ?? 'garden';
        return { task: t, label: `${cropName} in ${plotName}` };
      });
  },
);
