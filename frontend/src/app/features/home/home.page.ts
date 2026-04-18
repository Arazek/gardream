import { Component, OnInit, inject, effect, computed } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { IonRippleEffect } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { NotificationCentreComponent } from './components/notification-centre/notification-centre.component';
import {
  TopAppBarComponent, NavAction,
  HeroSectionComponent,
  TaskListItemComponent,
  InsightCardComponent,
  StatChipComponent,
  WeatherWidgetComponent,
  InlineAlertComponent,
  PageContentComponent,
  PageBodyWrapperComponent,
  GardenKpiRowComponent,
  NextHarvest,
  StageDistributionBarComponent,
} from '../../shared';
import { CurrentWeather as WidgetCurrentWeather, DayForecast as WidgetDayForecast } from '../../shared/components/weather-widget/weather-widget.component';
import { PlotsActions } from '../plots/store/plots.actions';
import { TasksActions } from '../tasks/store/tasks.actions';
import { WeatherActions } from '../../store/weather/weather.actions';
import { selectAllPlots, selectPlotsLoading, selectCropsNearHarvest, selectNextHarvest, selectStageDistribution, selectAvgProgress } from '../plots/store/plots.selectors';
import { selectTodayTasksHardcoded, selectTasksLoading, selectOverdueTasks } from '../tasks/store/tasks.selectors';
import { selectCurrentWeather, selectForecast, selectTomorrowRainExpected, selectTomorrowPrecipitation } from '../../store/weather/weather.selectors';
import { PlotType } from '../plots/store/plots.state';
import { Task } from '../tasks/store/tasks.state';
import { DayForecast } from '../../store/weather/weather.state';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PLOT_TYPE_ICON: Record<PlotType, string> = {
  ground_bed: 'yard',
  raised_bed: 'crop_square',
  container: 'local_florist',
  vertical: 'view_week',
  seedling_tray: 'grass',
};

const PLOT_TYPE_LABEL: Record<PlotType, string> = {
  ground_bed: 'Ground bed',
  raised_bed: 'Raised bed',
  container: 'Container',
  vertical: 'Vertical',
  seedling_tray: 'Seedling Tray',
};

const TODAY = new Date().toISOString().slice(0, 10);

const TASK_ICON: Record<string, string> = {
  water: 'water_drop',
  fertilise: 'science',
  prune: 'content_cut',
  harvest: 'agriculture',
  check: 'search',
  custom: 'edit',
};

const GARDEN_STATEMENTS = [
  'Your garden is breathing beautifully today.',
  'Every seed sown is a promise to yourself.',
  'The soil remembers everything you give it.',
  'Growth is patient.\u00a0So is a good gardener.',
  'This week\'s labour becomes next season\'s harvest.',
  'Plants don\'t rush.\u00a0Neither should you.',
  'Your garden is a living journal.',
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    AsyncPipe,
    IonRippleEffect,
    TopAppBarComponent,
    HeroSectionComponent,
    TaskListItemComponent,
    InsightCardComponent,
    StatChipComponent,
    WeatherWidgetComponent,
    InlineAlertComponent,
    PageContentComponent,
    PageBodyWrapperComponent,
    GardenKpiRowComponent,
    StageDistributionBarComponent,
    NotificationCentreComponent,
  ],
  styleUrl: './home.page.scss',
  template: `
    <app-top-app-bar title="My Garden" [actions]="topBarActions()" (actionClick)="onTopBarAction($event)" />

    <app-notification-centre
      [open]="notificationCentreOpen"
      [notifications]="notificationService.notifications()"
      (closed)="notificationCentreOpen = false"
      (markAllRead)="notificationService.markAllRead()"
      (dismiss)="notificationService.dismiss($event)"
    />

    <app-page-content class="home-content">

      <!-- Hero (full-width) -->
      <app-hero-section [greeting]="greeting" [subtitle]="heroSubtitle" [statement]="statement">
        <div class="home-stats">
          <app-stat-chip icon="task_alt"    label="Today"   [value]="todayCount() + ' tasks'" />
          <app-stat-chip icon="grass"        label="Crops"   [value]="totalCrops() + ' in ground'" />
          <app-stat-chip icon="warning"     label="Overdue" [value]="overdueCount() + ' tasks'" />
        </div>
      </app-hero-section>

      <!-- Main content with horizontal padding -->
      <app-page-body-wrapper class="home-body">

        <!-- Weather widget -->
        @if (widgetCurrent()) {
          <section class="home-section home-section--weather">
            <app-weather-widget [current]="widgetCurrent()" [forecast]="widgetForecast()" />
            @if (tomorrowRainExpected$ | async; as rainExpected) {
              @if (rainExpected && (tomorrowPrecipitation$ | async); as precip) {
                <app-inline-alert
                  variant="info"
                  title="Rain expected tomorrow"
                  [message]="'Consider watering your outdoor plots today — rain is forecast for tomorrow (' + (precip?.mm ?? 0) + 'mm, ' + (precip?.probability ?? 0) + '% chance).'"
                />
              } @else if (rainExpected) {
                <app-inline-alert
                  variant="info"
                  title="Rain expected tomorrow"
                  message="Consider watering your outdoor plots today — rain is forecast for tomorrow."
                />
              }
            }
          </section>
        }

        <!-- KPI cards -->
        <section class="home-section home-section--kpi">
          <div class="home-section__header">
            <h2 class="home-section__title">Garden Overview</h2>
          </div>
          <app-garden-kpi-row
            [loading]="(plotsLoading$ | async) ?? true"
            [nearHarvestCount]="nearHarvestCount()"
            [avgProgress]="avgProgress()"
            [overdueCount]="overdueCount()"
            [nextHarvest]="nextHarvest()"
          />
        </section>

        <!-- Stage distribution -->
        @if (totalCrops() > 0) {
          <section class="home-section home-section--stages">
            <div class="home-section__header">
              <h2 class="home-section__title">Crop Stages</h2>
            </div>
            <app-stage-distribution-bar [distribution]="stageDistribution()" />
          </section>
        }

        <!-- My Plots -->
        <section class="home-section">
          <div class="home-section__header">
            <h2 class="home-section__title">Your Plots & Beds</h2>
            <button class="home-section__action" (click)="goToPlots()">View all</button>
          </div>

          @if (plotsLoading$ | async) {
            <div class="home-skeleton-row">
              @for (i of [1, 2]; track i) {
                <div class="home-plot-card home-plot-card--skeleton"></div>
              }
            </div>
          } @else if ((plots$ | async)?.length === 0) {
            <div class="home-empty">
              <span class="material-symbols-outlined home-empty__icon">yard</span>
              <p class="home-empty__text">No plots yet. Add your first garden bed!</p>
              <button class="home-empty__cta" (click)="goToNewPlot()">Add plot</button>
            </div>
          } @else {
            <div class="home-plot-list">
              @for (plot of plots$ | async; track plot.id) {
                <button
                  type="button"
                  class="home-plot-card ion-activatable"
                  [attr.data-plot-type]="plot.plot_type"
                  (click)="goToPlot(plot.id)"
                >
                  <ion-ripple-effect />
                  <div class="home-plot-card__thumb">
                    <span class="material-symbols-outlined home-plot-card__thumb-icon">{{ plotIcon(plot.plot_type) }}</span>
                  </div>
                  <div class="home-plot-card__body">
                    <p class="home-plot-card__name">{{ plot.name }}</p>
                    <p class="home-plot-card__meta">{{ plotLabel(plot.plot_type) }} · {{ plot.rows }}×{{ plot.cols }} · {{ plot.crop_count }} crop{{ plot.crop_count !== 1 ? 's' : '' }}</p>
                  </div>
                  <span class="material-symbols-outlined home-plot-card__chevron">chevron_right</span>
                </button>
              }
            </div>
          }
        </section>

        <!-- Today's Tasks -->
        <section class="home-section">
          <div class="home-section__header">
            <h2 class="home-section__title">Today's Tasks</h2>
            <button class="home-section__action" (click)="goToCalendar()">View all</button>
          </div>

          @if (tasksLoading$ | async) {
            <div class="home-task-skeleton">
              @for (i of [1, 2, 3]; track i) {
                <div class="home-task-skeleton__row"></div>
              }
            </div>
          } @else if ((todayTasks$ | async)?.length === 0) {
            <div class="home-empty home-empty--inline">
              <span class="material-symbols-outlined home-empty__check-icon">check_circle</span>
              <p class="home-empty__text">All clear — no tasks scheduled for today.</p>
            </div>
          } @else {
            <div class="home-task-list">
              @for (task of todayTasks$ | async; track task.id) {
                <app-task-list-item
                  [icon]="taskIcon(task.type)"
                  [title]="task.title || task.type"
                  [completed]="task.completed"
                  [overdue]="task.due_date < today"
                  (completedChange)="onTaskToggle(task, $event)"
                />
              }
            </div>
          }
        </section>

        <!-- Garden Insight -->
        <section class="home-section">
          <app-insight-card
            [insight]="insight()"
            cta="View plots"
            (ctaClicked)="goToPlots()"
          />
        </section>

      </app-page-body-wrapper>
    </app-page-content>
  `,
})
export class HomePage implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly notificationService = inject(NotificationService);

  notificationCentreOpen = false;

  readonly topBarActions = computed<NavAction[]>(() => [
    { id: 'notifications', icon: 'notifications', label: 'Notifications', badge: this.notificationService.unreadCount() },
    { id: 'profile', icon: 'person', label: 'Profile' },
  ]);

  onTopBarAction(id: string): void {
    if (id === 'notifications') {
      this.notificationCentreOpen = true;
    } else if (id === 'profile') {
      this.goToSettings();
    }
  }

  readonly plots$ = this.store.select(selectAllPlots);
  readonly plotsLoading$ = this.store.select(selectPlotsLoading);
  readonly todayTasks$ = this.store.select(selectTodayTasksHardcoded);
  readonly tasksLoading$ = this.store.select(selectTasksLoading);
  readonly overdueTasks$ = this.store.select(selectOverdueTasks);
  readonly tomorrowRainExpected$ = this.store.select(selectTomorrowRainExpected);
  readonly tomorrowPrecipitation$ = this.store.select(selectTomorrowPrecipitation);
  readonly nearHarvest$ = this.store.select(selectCropsNearHarvest);
  readonly nextHarvest$ = this.store.select(selectNextHarvest);
  readonly stageDistribution$ = this.store.select(selectStageDistribution);
  readonly avgProgress$ = this.store.select(selectAvgProgress);

  greeting = 'Good morning';
  heroSubtitle = '';
  statement = GARDEN_STATEMENTS[new Date().getDay() % GARDEN_STATEMENTS.length];
  readonly today = TODAY;

  // Signals from observables
  readonly plots = toSignal(this.plots$, { initialValue: [] });
  readonly todayTasks = toSignal(this.todayTasks$, { initialValue: [] });
  readonly overdueTasks = toSignal(this.overdueTasks$, { initialValue: [] });
  readonly nearHarvest = toSignal(this.nearHarvest$, { initialValue: [] });
  readonly nextHarvest = toSignal(this.nextHarvest$, { initialValue: null });
  readonly avgProgress = toSignal(this.avgProgress$, { initialValue: 0 });
  readonly stageDistribution = toSignal(this.stageDistribution$, { initialValue: {} });
  readonly currentWeather = toSignal(this.store.select(selectCurrentWeather), { initialValue: null });
  readonly forecast = toSignal(this.store.select(selectForecast), { initialValue: [] });

  // Computed properties derived from signals
  readonly todayCount = computed(() => this.todayTasks().length);
  readonly totalCrops = computed(() => this.plots().reduce((a, p) => a + p.crop_count, 0));
  readonly overdueCount = computed(() => this.overdueTasks().length);
  readonly nearHarvestCount = computed(() => this.nearHarvest().length);

  readonly widgetCurrent = computed(() => {
    const c = this.currentWeather();
    if (!c) return null;
    return { temperature: c.temperature, condition: c.condition, icon: c.icon, humidity: c.humidity, windSpeed: c.wind_speed } as any;
  });

  readonly widgetForecast = computed(() => {
    return this.forecast().map(d => this.mapForecastDay(d));
  });

  readonly insight = computed(() => {
    const nearCount = this.nearHarvest().length;
    const overdueCount = this.overdueTasks().length;
    const avgProg = this.avgProgress();

    if (nearCount > 0) {
      return `${nearCount} crop${nearCount > 1 ? 's are' : ' is'} approaching harvest — check them soon.`;
    } else if (overdueCount > 0) {
      return `You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} — check your calendar.`;
    } else if (avgProg > 75) {
      return `Your garden is thriving — ${avgProg}% average lifecycle progress.`;
    } else {
      return GARDEN_STATEMENTS[new Date().getDay() % GARDEN_STATEMENTS.length];
    }
  });

  // Effects moved from ngOnInit to proper injection context
  private readonly _slotsEffect = effect(() => {
    const plots = this.plots();
    plots.forEach(p => this.store.dispatch(PlotsActions.loadSlots({ plotId: p.id })));
  });

  async ngOnInit(): Promise<void> {
    this.greeting = this.getTimeGreeting();
    this.heroSubtitle = this.formatDate(new Date());

    this.store.dispatch(PlotsActions.loadPlots());
    // Load all pending tasks — covers today's tasks + overdue calculation
    this.store.dispatch(TasksActions.loadTasks({ completed: false }));
    this.loadWeather();

    const profile = await this.auth.getProfile();
    if (profile?.firstName) {
      this.greeting = `${this.getTimeGreeting()}, ${profile.firstName}`;
    }
  }

  plotIcon(type: PlotType): string { return PLOT_TYPE_ICON[type] ?? 'yard'; }
  plotLabel(type: PlotType): string { return PLOT_TYPE_LABEL[type] ?? type; }
  taskIcon(type: string): string { return TASK_ICON[type] ?? 'task_alt'; }

  goToPlots(): void { this.router.navigate(['/tabs/plots']); }
  goToNewPlot(): void { this.router.navigate(['/tabs/plots/new']); }
  goToPlot(id: string): void { this.router.navigate(['/tabs/plots', id]); }
  goToCalendar(): void { this.router.navigate(['/tabs/calendar']); }
  goToSettings(): void { this.router.navigate(['/tabs/settings']); }

  onTaskToggle(task: Task, completed: boolean): void {
    this.store.dispatch(TasksActions.updateTask({ id: task.id, payload: { completed } }));
  }

  private loadWeather(): void {
    if (!navigator.geolocation) {
      this.store.dispatch(WeatherActions.loadWeather({ lat: 48.8566, lon: 2.3522 }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => this.store.dispatch(WeatherActions.loadWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude })),
      () => this.store.dispatch(WeatherActions.loadWeather({ lat: 48.8566, lon: 2.3522 })),
    );
  }

  private mapForecastDay(d: DayForecast): WidgetDayForecast {
    const date = new Date(d.date + 'T00:00:00');
    return { day: DAYS_SHORT[date.getDay()], icon: d.icon, high: d.temp_max, low: d.temp_min, rainMm: d.precipitation_mm };
  }

  private formatDate(d: Date): string {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  }

  private getTimeGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }
}
