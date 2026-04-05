import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { IonRippleEffect } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';

import { AuthService } from '../../core/auth/auth.service';
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
} from '../../shared';
import { CurrentWeather as WidgetCurrentWeather, DayForecast as WidgetDayForecast } from '../../shared/components/weather-widget/weather-widget.component';
import { PlotsActions } from '../plots/store/plots.actions';
import { TasksActions } from '../tasks/store/tasks.actions';
import { WeatherActions } from '../../store/weather/weather.actions';
import { selectAllPlots, selectPlotsLoading } from '../plots/store/plots.selectors';
import { selectTodayTasks, selectPendingTasks, selectTasksLoading } from '../tasks/store/tasks.selectors';
import { selectCurrentWeather, selectForecast, selectTodayRainExpected, selectWeatherLoading } from '../../store/weather/weather.selectors';
import { Plot, PlotType } from '../plots/store/plots.state';
import { Task } from '../tasks/store/tasks.state';
import { DayForecast } from '../../store/weather/weather.state';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PLOT_TYPE_ICON: Record<PlotType, string> = {
  ground_bed: 'yard',
  raised_bed: 'crop_square',
  container: 'local_florist',
  vertical: 'view_week',
};

const PLOT_TYPE_LABEL: Record<PlotType, string> = {
  ground_bed: 'Ground bed',
  raised_bed: 'Raised bed',
  container: 'Container',
  vertical: 'Vertical',
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

const INSIGHTS = [
  'You have 3 crops approaching harvest window this week.',
  'Basil thrives when kept above 15°C — bring it indoors tonight.',
  'Rotate your brassicas next season to prevent soil depletion.',
  'Your tomatoes are on track. Keep up the weekly feed.',
  'Water in the early morning to reduce evaporation and fungal risk.',
  'Companion planting calendula near tomatoes deters aphids naturally.',
  'A well-fed soil means a well-fed garden — top up compost this week.',
  'Pinching out side shoots on tomatoes focuses energy on fruit.',
  'Harvest courgettes young (10–15 cm) for best flavour and plant health.',
  'Check undersides of leaves weekly — pests hide where you least look.',
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
  ],
  styleUrl: './home.page.scss',
  template: `
    <app-top-app-bar title="My Garden" [actions]="topBarActions" (actionClick)="onTopBarAction($event)" />

    <app-page-content class="home-content">

      <!-- Hero (full-width) -->
      <app-hero-section [greeting]="greeting" [subtitle]="heroSubtitle" [statement]="statement">
        <div class="home-stats">
          <app-stat-chip icon="task_alt" label="Today" [value]="todayCount + ' tasks'" />
          <app-stat-chip icon="yard" label="Plots" [value]="plotCount + ' active'" />
          <app-stat-chip icon="pending" label="Pending" [value]="pendingCount + ' open'" />
        </div>
      </app-hero-section>

      <!-- Main content with horizontal padding -->
      <app-page-body-wrapper class="home-body">

        <!-- Weather widget -->
        @if (widgetCurrent) {
          <section class="home-section home-section--weather">
            <app-weather-widget [current]="widgetCurrent" [forecast]="widgetForecast" />
            @if (todayRainExpected$ | async) {
              <app-inline-alert
                variant="info"
                title="Rain expected today"
                message="You may want to skip watering your outdoor plots today."
              />
            }
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
            [insight]="insight"
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

  readonly topBarActions: NavAction[] = [
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
    { id: 'profile',       icon: 'person',        label: 'Profile' },
  ];

  onTopBarAction(id: string): void {
    if (id === 'profile') this.goToSettings();
  }

  readonly plots$ = this.store.select(selectAllPlots);
  readonly plotsLoading$ = this.store.select(selectPlotsLoading);
  readonly todayTasks$ = this.store.select(selectTodayTasks);
  readonly tasksLoading$ = this.store.select(selectTasksLoading);
  readonly pendingTasks$ = this.store.select(selectPendingTasks);
  readonly todayRainExpected$ = this.store.select(selectTodayRainExpected);

  greeting = 'Good morning';
  heroSubtitle = '';
  statement = GARDEN_STATEMENTS[new Date().getDay() % GARDEN_STATEMENTS.length];
  readonly today = TODAY;
  todayCount = 0;
  plotCount = 0;
  pendingCount = 0;
  widgetCurrent: WidgetCurrentWeather | null = null;
  widgetForecast: WidgetDayForecast[] = [];
  insight = INSIGHTS[new Date().getDay() % INSIGHTS.length];

  async ngOnInit(): Promise<void> {
    this.greeting = this.getTimeGreeting();
    this.heroSubtitle = this.formatDate(new Date());

    this.store.dispatch(PlotsActions.loadPlots());
    this.store.dispatch(TasksActions.loadTasks({ due_date: TODAY }));
    this.loadWeather();

    this.plots$.subscribe(plots => (this.plotCount = plots.length));
    this.todayTasks$.subscribe(tasks => (this.todayCount = tasks.length));
    this.pendingTasks$.subscribe(tasks => (this.pendingCount = tasks.length));

    this.store.select(selectCurrentWeather).subscribe(c => {
      if (!c) return;
      this.widgetCurrent = { temperature: c.temperature, condition: c.condition, icon: c.icon, humidity: c.humidity, windSpeed: c.wind_speed };
    });
    this.store.select(selectForecast).subscribe(fc => {
      this.widgetForecast = fc.map(d => this.mapForecastDay(d));
    });

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
