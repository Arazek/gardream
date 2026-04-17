import { TestBed } from '@angular/core/testing';
import { TaskGeneratorService } from './task-generator.service';
import type { Plot, PlotSlot } from '../../features/plots/store/plots.state';
import type { Crop } from '../../features/crops/store/crops.state';

const basePlot = {
  id: 'plot1', watering_days: [1, 3], fertilise_days: [5],
} as unknown as Plot;

const baseSlot = {
  id: 'slot1', plot_id: 'plot1', crop_id: 'crop1', sow_date: '2026-04-14',
  watering_days_override: null, watering_interval_weeks: 1,
  fertilise_days_override: null, fertilise_interval_weeks: 1,
} as unknown as PlotSlot;

const baseCrop = {
  id: 'crop1', name: 'Tomato', days_to_harvest: 90,
  prune_frequency_days: null, prune_start_day: null,
} as unknown as Crop;

describe('TaskGeneratorService', () => {
  let service: TaskGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskGeneratorService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should generate water tasks on plot watering_days (Mon=1, Wed=3 python convention)', () => {
    const tasks = service.generate(baseSlot, basePlot, baseCrop, 'user1');
    const waterTasks = tasks.filter(t => t.type === 'water');
    expect(waterTasks.length).toBeGreaterThan(0);
    // Mon=1 in python → jsDay = (1+1)%7 = 2; Wed=3 in python → jsDay = (3+1)%7 = 4
    waterTasks.forEach(t => {
      const jsDay = new Date(t.due_date + 'T12:00:00').getDay();
      expect([2, 4]).toContain(jsDay); // Mon and Wed
    });
  });

  it('should use slot watering_days_override when set', () => {
    const slot = { ...baseSlot, watering_days_override: [4] } as PlotSlot; // Fri in python (0=Mon)
    const tasks = service.generate(slot, basePlot, baseCrop, 'user1');
    const waterTasks = tasks.filter(t => t.type === 'water');
    expect(waterTasks.length).toBeGreaterThan(0);
    waterTasks.forEach(t => {
      const jsDay = new Date(t.due_date + 'T12:00:00').getDay();
      expect(jsDay).toBe(5); // Fri: (4+1)%7 = 5
    });
  });

  it('should generate fewer water tasks with interval=2 than interval=1', () => {
    const slotInterval1 = { ...baseSlot, watering_interval_weeks: 1 } as PlotSlot;
    const slotInterval2 = { ...baseSlot, watering_interval_weeks: 2 } as PlotSlot;
    const tasks1 = service.generate(slotInterval1, basePlot, baseCrop, 'user1').filter(t => t.type === 'water');
    const tasks2 = service.generate(slotInterval2, basePlot, baseCrop, 'user1').filter(t => t.type === 'water');
    expect(tasks2.length).toBeLessThan(tasks1.length);
  });

  it('should generate a harvest task at sow_date + days_to_harvest', () => {
    const tasks = service.generate(baseSlot, basePlot, baseCrop, 'user1');
    const harvest = tasks.find(t => t.type === 'harvest');
    expect(harvest).toBeTruthy();
    expect(harvest!.due_date).toBe('2026-07-13'); // 2026-04-14 + 90 days
  });

  it('should generate no water/fertilise tasks for empty days arrays', () => {
    const plot = { ...basePlot, watering_days: [], fertilise_days: [] } as unknown as Plot;
    const tasks = service.generate(baseSlot, plot, baseCrop, 'user1');
    expect(tasks.filter(t => t.type === 'water').length).toBe(0);
    expect(tasks.filter(t => t.type === 'fertilise').length).toBe(0);
  });
});
