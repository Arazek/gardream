import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import type { Plot, PlotSlot } from '../../features/plots/store/plots.state';
import type { Crop } from '../../features/crops/store/crops.state';
import type { Task } from '../../features/tasks/store/tasks.state';

// Day convention: stored as Python weekday (0=Mon, 1=Tue, ..., 6=Sun)
// JS Date.getDay(): 0=Sun, 1=Mon, ..., 6=Sat
// Conversion: jsDay = (pythonDay + 1) % 7
function pythonDowToJs(dow: number): number {
  return (dow + 1) % 7;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000
  );
}

const WINDOW_DAYS = 90;

@Injectable({ providedIn: 'root' })
export class TaskGeneratorService {
  generate(
    slot: PlotSlot,
    plot: Plot,
    crop: Crop,
    userId: string,
    startDate?: string,
    taskTypes: string[] = ['water', 'fertilise'],
  ): Omit<Task, 'updated_at'>[] {
    const sowDate = slot.sow_date;
    const tasks: Omit<Task, 'updated_at'>[] = [];
    const now = new Date().toISOString();

    // Seedling trays only get a germination check task
    if (plot.plot_type === 'seedling_tray') {
      const daysToGermination = (crop as any).days_to_germination ?? 14;
      const germinationDate = addDays(sowDate, daysToGermination);
      tasks.push({
        id: `tmp_${uuidv4()}`,
        user_id: userId,
        plot_slot_id: slot.id,
        type: 'check',
        title: `Check germination – ${crop.name}`,
        note: null,
        due_date: germinationDate,
        completed: false,
        completed_at: null,
        created_at: now,
      });
      return tasks;
    }

    const windowStart = startDate ?? sowDate;
    const endDate = addDays(sowDate, WINDOW_DAYS);

    const makeTask = (type: Task['type'], dueDate: string, title: string | null = null): Omit<Task, 'updated_at'> => ({
      id: `tmp_${uuidv4()}`,
      user_id: userId,
      plot_slot_id: slot.id,
      type,
      title,
      note: null,
      due_date: dueDate,
      completed: false,
      completed_at: null,
      created_at: now,
    });

    // ── Watering ────────────────────────────────────────────────────────
    if (taskTypes.includes('water')) {
      const effectiveDays = slot.watering_days_override ?? plot.watering_days;
      const interval = slot.watering_interval_weeks;
      const effectiveJsDows = effectiveDays.map(pythonDowToJs);

      if (effectiveDays.length > 0) {
        let current = windowStart < sowDate ? sowDate : windowStart;
        while (current <= endDate) {
          const jsDay = new Date(current + 'T12:00:00').getDay();
          const weeksSinceSow = Math.floor(daysBetween(sowDate, current) / 7);
          if (effectiveJsDows.includes(jsDay) && (interval <= 1 || weeksSinceSow % interval === 0)) {
            tasks.push(makeTask('water', current));
          }
          current = addDays(current, 1);
        }
      }
    }

    // ── Fertilise ───────────────────────────────────────────────────────
    if (taskTypes.includes('fertilise')) {
      const effectiveDays = slot.fertilise_days_override ?? plot.fertilise_days;
      const interval = slot.fertilise_interval_weeks;
      const effectiveJsDows = effectiveDays.map(pythonDowToJs);

      if (effectiveDays.length > 0) {
        let current = windowStart < sowDate ? sowDate : windowStart;
        while (current <= endDate) {
          const jsDay = new Date(current + 'T12:00:00').getDay();
          const weeksSinceSow = Math.floor(daysBetween(sowDate, current) / 7);
          if (effectiveJsDows.includes(jsDay) && (interval <= 1 || weeksSinceSow % interval === 0)) {
            tasks.push(makeTask('fertilise', current));
          }
          current = addDays(current, 1);
        }
      }
    }

    // ── Prune ───────────────────────────────────────────────────────────
    if (crop.prune_frequency_days && crop.prune_start_day) {
      let dayOffset = crop.prune_start_day;
      while (true) {
        const pruneDate = addDays(sowDate, dayOffset);
        if (pruneDate > endDate) break;
        tasks.push(makeTask('prune', pruneDate));
        dayOffset += crop.prune_frequency_days;
      }
    }

    // ── Harvest ─────────────────────────────────────────────────────────
    tasks.push(makeTask('harvest', addDays(sowDate, crop.days_to_harvest), `Harvest ${crop.name}`));

    return tasks;
  }
}
