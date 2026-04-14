import { TestBed } from '@angular/core/testing';
import { LocalNotificationsService } from './local-notifications.service';
import type { Task } from '../../features/tasks/store/tasks.state';

describe('LocalNotificationsService', () => {
  let service: LocalNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalNotificationsService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('buildNotificationTitle formats water task', () => {
    const task = { type: 'water', plot_slot_id: 'slot1' } as Task;
    expect(service.buildNotificationTitle(task, 'Tomato in Balcony Bed'))
      .toBe('Time to water your Tomato in Balcony Bed');
  });

  it('buildNotificationTitle formats fertilise task', () => {
    const task = { type: 'fertilise', plot_slot_id: 'slot1' } as Task;
    expect(service.buildNotificationTitle(task, 'Basil in Window Box'))
      .toBe('Time to fertilise your Basil in Window Box');
  });

  it('buildNotificationTitle formats harvest task', () => {
    const task = { type: 'harvest', plot_slot_id: 'slot1' } as Task;
    expect(service.buildNotificationTitle(task, 'Carrot in Raised Bed'))
      .toBe('Time to harvest your Carrot in Raised Bed');
  });
});
