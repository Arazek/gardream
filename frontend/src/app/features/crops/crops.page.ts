import { Component, OnInit, inject, effect, Injector, runInInjectionContext, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import { TopAppBarComponent, NavAction, SearchBarComponent, FilterChipComponent, SpecimenCardComponent, PageContentComponent, PageBodyWrapperComponent } from '../../shared';
import { NotificationService, AppNotification } from '../../core/notifications/notification.service';
import { NotificationCentreComponent } from '../home/components/notification-centre/notification-centre.component';
import { CropsActions } from './store/crops.actions';
import { selectFilteredCrops, selectCropsLoading, selectCategoryFilter } from './store/crops.selectors';
import { Crop, CropCategory } from './store/crops.state';

interface CategoryOption { value: CropCategory | null; label: string; }

const CATEGORIES: CategoryOption[] = [
  { value: null,        label: 'All' },
  { value: 'vegetable', label: 'Vegetables' },
  { value: 'herb',      label: 'Herbs' },
  { value: 'fruit',     label: 'Fruit' },
  { value: 'flower',    label: 'Flowers' },
];

@Component({
  selector: 'app-crops',
  standalone: true,
  imports: [TopAppBarComponent, SearchBarComponent, FilterChipComponent, SpecimenCardComponent, PageContentComponent, PageBodyWrapperComponent, NotificationCentreComponent],
  styleUrl: './crops.page.scss',
  template: `
    <app-top-app-bar title="Crop Library" [actions]="topBarActions()" (actionClick)="onTopBarAction($event)" />

    <app-notification-centre
      [open]="notificationCentreOpen"
      [notifications]="notificationService.notifications()"
      (closed)="notificationCentreOpen = false"
      (markAllRead)="notificationService.markAllRead()"
      (dismiss)="notificationService.dismiss($event)"
    />

    <app-page-content class="crops-content">
      <app-page-body-wrapper>

        <div class="crops-search-wrap">
        <app-search-bar placeholder="Search crops…" (search)="onSearch($event)" />
      </div>

      <!-- Category filters -->
      <div class="crops-filters">
        @for (cat of categories; track cat.label) {
          <app-filter-chip
            [label]="cat.label"
            [active]="categoryFilter() === cat.value"
            (toggled)="setCategory(cat.value)"
          />
        }
      </div>

      <!-- Results -->
      <div class="crops-grid">
        @if (loading()) {
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="crops-skeleton"></div>
          }
        } @else if (displayCrops.length === 0) {
          <div class="crops-empty">
            <span class="material-symbols-outlined crops-empty__icon">search_off</span>
            <p class="crops-empty__text">No crops match your search.</p>
          </div>
        } @else {
          @for (crop of displayCrops; track crop.id) {
            <app-specimen-card [crop]="crop" size="compact" (click)="openCrop(crop.id)" />
          }
        }
      </div>

      </app-page-body-wrapper>
    </app-page-content>
  `,
})
export class CropsPage implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  readonly notificationService = inject(NotificationService);

  notificationCentreOpen = false;

  readonly topBarActions = computed<NavAction[]>(() => [
    { id: 'notifications', icon: 'notifications', label: 'Notifications',
      badge: this.notificationService.unreadCount() },
    { id: 'profile', icon: 'person', label: 'Profile' },
  ]);

  readonly categories = CATEGORIES;
  searchQuery = '';
  displayCrops: Crop[] = [];

  // Signals
  readonly loading = toSignal(this.store.select(selectCropsLoading), { initialValue: true });
  readonly categoryFilter = toSignal(this.store.select(selectCategoryFilter), { initialValue: null });
  readonly allFiltered = toSignal(this.store.select(selectFilteredCrops), { initialValue: [] });

  constructor() {
    runInInjectionContext(this.injector, () => {
      // Update displayCrops when allFiltered changes or searchQuery changes
      effect(() => {
        this.applySearch();
      });
    });
  }

  ngOnInit(): void {
    this.store.dispatch(CropsActions.loadCrops({}));
  }

  onTopBarAction(id: string): void {
    if (id === 'notifications') {
      this.notificationCentreOpen = true;
    } else if (id === 'profile') {
      this.goToSettings();
    }
  }

  onSearch(q: string): void {
    this.searchQuery = q.toLowerCase();
    this.applySearch();
  }

  setCategory(category: CropCategory | null): void {
    this.store.dispatch(CropsActions.setCategoryFilter({ category }));
  }

  openCrop(id: string): void {
    this.store.dispatch(CropsActions.selectCrop({ id }));
    this.router.navigate(['/tabs/library', id]);
  }

  private applySearch(): void {
    const allFiltered = this.allFiltered();
    if (!this.searchQuery) {
      this.displayCrops = allFiltered;
      return;
    }
    this.displayCrops = allFiltered.filter(c =>
      c.name.toLowerCase().includes(this.searchQuery) ||
      c.latin_name.toLowerCase().includes(this.searchQuery),
    );
  }

  goToSettings(): void {
    this.router.navigate(['/tabs/settings']);
  }
}
