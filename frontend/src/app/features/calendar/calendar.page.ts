import { Component, OnInit, inject, effect, Injector, runInInjectionContext, computed } from '@angular/core';
import { Router } from '@angular/router';
import { IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, chevronBack, chevronForward } from 'ionicons/icons';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import { TopAppBarComponent, NavAction, TaskCardComponent, FilterChipComponent, PageContentComponent } from '../../shared';
import { NotificationService, AppNotification } from '../../core/notifications/notification.service';
import { NotificationCentreComponent } from '../home/components/notification-centre/notification-centre.component';
import { BottomSheetService } from '../../shared/services/bottom-sheet.service';
import { TasksActions } from '../tasks/store/tasks.actions';
import { selectAllTasks, selectTasksLoading } from '../tasks/store/tasks.selectors';
import { Task, TaskCreate } from '../tasks/store/tasks.state';
import { TaskCreateComponent } from './task-create.component';

const DAYS_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LETTER  = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const SEASONS: Record<number, string> = {
  12: 'WINTER', 1: 'WINTER', 2: 'WINTER',
  3: 'SPRING', 4: 'SPRING', 5: 'SPRING',
  6: 'SUMMER', 7: 'SUMMER', 8: 'SUMMER',
  9: 'AUTUMN', 10: 'AUTUMN', 11: 'AUTUMN',
};
const EQUINOX: Record<number, string> = {
  3: 'VERNAL EQUINOX', 6: 'SUMMER SOLSTICE',
  9: 'AUTUMNAL EQUINOX', 12: 'WINTER SOLSTICE',
};

interface CalDay { iso: string; date: number; inMonth: boolean; }

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildMonthGrid(year: number, month: number): CalDay[] {
  const cells: CalDay[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  // leading blanks (Sunday-start)
  for (let i = 0; i < firstDay.getDay(); i++) {
    const d = new Date(year, month, 1 - (firstDay.getDay() - i));
    cells.push({ iso: toISO(d), date: d.getDate(), inMonth: false });
  }
  // month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    cells.push({ iso: toISO(date), date: d, inMonth: true });
  }
  // trailing blanks to fill last row
  const trailing = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    const d = new Date(year, month + 1, i);
    cells.push({ iso: toISO(d), date: d.getDate(), inMonth: false });
  }
  return cells;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    IonFab, IonFabButton, IonIcon,
    TopAppBarComponent, TaskCardComponent, FilterChipComponent, PageContentComponent, NotificationCentreComponent,
  ],
  styleUrl: './calendar.page.scss',
  template: `
    <app-top-app-bar title="Calendar" [actions]="topBarActions" (actionClick)="onTopBarAction($event)" />

    <app-notification-centre
      [open]="notificationCentreOpen"
      [notifications]="notifications"
      (closed)="notificationCentreOpen = false"
      (markAllRead)="notificationService.markAllRead()"
      (dismiss)="notificationService.dismiss($event)"
    />

    <app-page-content class="calendar-content">
      <div class="cal-layout">

        <!-- LEFT: calendar picker -->
        <div class="cal-layout__calendar">
          <!-- Month header -->
          <div class="cal-month-header">
            <button class="cal-month-header__arrow" type="button" (click)="shiftMonth(-1)" aria-label="Previous month">
              <ion-icon name="chevron-back" />
            </button>
            <div class="cal-month-header__center">
              <h2 class="cal-month-header__month">{{ monthLabel }}</h2>
              <p class="cal-month-header__season">{{ seasonLabel }}</p>
            </div>
            <button class="cal-month-header__arrow" type="button" (click)="shiftMonth(1)" aria-label="Next month">
              <ion-icon name="chevron-forward" />
            </button>
          </div>

          <!-- Day-of-week headers -->
          <div class="cal-grid-header">
            @for (d of dayLetters; track d + $index) {
              <span class="cal-grid-header__cell">{{ d }}</span>
            }
          </div>

          <!-- Month grid -->
          <div class="cal-grid">
            @for (day of monthGrid; track day.iso) {
              <button
                type="button"
                class="cal-grid__cell"
                [class.cal-grid__cell--other]="!day.inMonth"
                [class.cal-grid__cell--today]="day.iso === today"
                [class.cal-grid__cell--selected]="day.iso === selectedDate"
                (click)="selectDate(day.iso)"
              >
                {{ day.date }}
              </button>
            }
          </div>
        </div>

        <!-- RIGHT: filters + tasks -->
        <div class="cal-layout__tasks">
          <!-- Filter chips -->
          <div class="cal-filters">
            <app-filter-chip label="All"     [active]="filter === 'all'"     (toggled)="setFilter('all')" />
            <app-filter-chip label="Pending" [active]="filter === 'pending'" (toggled)="setFilter('pending')" />
            <app-filter-chip label="Done"    [active]="filter === 'done'"    (toggled)="setFilter('done')" />
          </div>

          <!-- Selected date label -->
          <p class="cal-date-label">{{ selectedDateLabel }}</p>

          <!-- Task list -->
          <div class="cal-tasks">
            @if (tasksLoading()) {
              <div class="cal-skeleton">
                @for (i of [1, 2, 3]; track i) {
                  <div class="cal-skeleton__card"></div>
                }
              </div>
            } @else if (filteredTasks.length === 0) {
              <div class="cal-empty">
                <span class="material-symbols-outlined cal-empty__icon">event_available</span>
                <p class="cal-empty__text">No tasks for this day.</p>
              </div>
            } @else {
              @for (task of filteredTasks; track task.id) {
                <app-task-card
                  [icon]="taskIcon(task.type)"
                  [title]="task.title || task.type"
                  [description]="task.note ?? undefined"
                  [completed]="task.completed"
                  (completedChange)="onToggle(task, $event)"
                />
              }
            }
          </div>
        </div>

      </div>

      <!-- Add task FAB -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openAddTask()">
          <ion-icon name="add" />
        </ion-fab-button>
      </ion-fab>

    </app-page-content>
  `,
})
export class CalendarPage implements OnInit {
  private readonly store = inject(Store);
  private readonly sheet = inject(BottomSheetService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  readonly notificationService = inject(NotificationService);

  notificationCentreOpen = false;
  notifications: AppNotification[] = [];

  readonly topBarActions: NavAction[] = [
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
    { id: 'profile', icon: 'person', label: 'Profile' },
  ];

  readonly dayLetters = DAYS_LETTER;

  today = toISO(new Date());
  selectedDate = this.today;
  anchorYear  = new Date().getFullYear();
  anchorMonth = new Date().getMonth();
  monthGrid: CalDay[] = buildMonthGrid(this.anchorYear, this.anchorMonth);

  filter: 'all' | 'pending' | 'done' = 'all';
  filteredTasks: Task[] = [];

  // Signals
  readonly tasksLoading = toSignal(this.store.select(selectTasksLoading), { initialValue: true });
  readonly allTasksStore = toSignal(this.store.select(selectAllTasks), { initialValue: [] });

  // Computed filtered tasks based on selectedDate
  readonly allTasks = computed(() => {
    const tasks = this.allTasksStore();
    return tasks.filter(t => t.due_date === this.selectedDate);
  });

  constructor() {
    addIcons({ add, chevronBack, chevronForward });
    runInInjectionContext(this.injector, () => {
      effect(() => {
        this.notifications = this.notificationService.notifications();
        this.updateTopBarBadge();
      });
      // Update filteredTasks when allTasks or filter changes
      effect(() => {
        this.applyFilter();
      });
    });
  }

  get monthLabel(): string {
    return `${MONTHS_LONG[this.anchorMonth]} ${this.anchorYear}`;
  }

  get seasonLabel(): string {
    const m = this.anchorMonth + 1;
    const season = SEASONS[m] ?? '';
    const eq = EQUINOX[m];
    return eq ? `${season} · ${eq}` : season;
  }

  get selectedDateLabel(): string {
    const d = new Date(this.selectedDate + 'T00:00:00');
    return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
  }

  ngOnInit(): void {
    this.store.dispatch(TasksActions.setSelectedDate({ date: this.today }));
    this.store.dispatch(TasksActions.loadTasks({ due_date: this.today }));
  }

  onTopBarAction(id: string): void {
    if (id === 'notifications') {
      this.notificationCentreOpen = true;
    } else if (id === 'profile') {
      this.goToSettings();
    }
  }

  selectDate(iso: string): void {
    this.selectedDate = iso;
    this.store.dispatch(TasksActions.setSelectedDate({ date: iso }));
    this.store.dispatch(TasksActions.loadTasks({ due_date: iso }));
  }

  shiftMonth(direction: -1 | 1): void {
    this.anchorMonth += direction;
    if (this.anchorMonth > 11) { this.anchorMonth = 0;  this.anchorYear++; }
    if (this.anchorMonth < 0)  { this.anchorMonth = 11; this.anchorYear--; }
    this.monthGrid = buildMonthGrid(this.anchorYear, this.anchorMonth);
  }

  setFilter(f: 'all' | 'pending' | 'done'): void {
    this.filter = f;
    this.applyFilter();
  }

  onToggle(task: Task, completed: boolean): void {
    this.store.dispatch(TasksActions.updateTask({ id: task.id, payload: { completed } }));
  }

  async openAddTask(): Promise<void> {
    const result = await this.sheet.open({
      component: TaskCreateComponent,
      componentProps: { initialDate: this.selectedDate },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.9,
    });
    if (!result) return;
    this.store.dispatch(TasksActions.createTask({ payload: result as TaskCreate }));
  }

  taskIcon(type: string): string {
    const map: Record<string, string> = {
      water: 'water_drop', fertilise: 'science', prune: 'content_cut',
      harvest: 'agriculture', check: 'search', custom: 'edit',
    };
    return map[type] ?? 'task_alt';
  }

  applyFilter(): void {
    const allTasks = this.allTasks();
    switch (this.filter) {
      case 'pending': this.filteredTasks = allTasks.filter(t => !t.completed); break;
      case 'done':    this.filteredTasks = allTasks.filter(t => t.completed);  break;
      default:        this.filteredTasks = [...allTasks];
    }
  }

  private updateTopBarBadge(): void {
    const notifAction = this.topBarActions.find(a => a.id === 'notifications');
    if (notifAction) {
      notifAction.badge = this.notificationService.unreadCount();
    }
  }

  goToSettings(): void {
    this.router.navigate(['/tabs/settings']);
  }
}
