import { Component, OnInit, inject, effect } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { TopAppBarComponent, NavAction, SearchBarComponent, FilterChipComponent, SpecimenCardComponent, PageContentComponent, PageBodyWrapperComponent } from '../../shared';
import { NotificationService } from '../../core/notifications/notification.service';
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
  imports: [AsyncPipe, TopAppBarComponent, SearchBarComponent, FilterChipComponent, SpecimenCardComponent, PageContentComponent, PageBodyWrapperComponent, NotificationCentreComponent],
  styleUrl: './crops.page.scss',
  template: `
    <app-top-app-bar title="Crop Library" [actions]="topBarActions" (actionClick)="onTopBarAction($event)" />

    <app-notification-centre
      [open]="notificationCentreOpen"
      [notifications]="notifications"
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
            [active]="(categoryFilter$ | async) === cat.value"
            (toggled)="setCategory(cat.value)"
          />
        }
      </div>

      <!-- Results -->
      <div class="crops-grid">
        @if (loading$ | async) {
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
  readonly notificationService = inject(NotificationService);

  notificationCentreOpen = false;
  notifications: any[] = [];

  readonly topBarActions: NavAction[] = [
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
    { id: 'profile', icon: 'person', label: 'Profile' },
  ];

  onTopBarAction(id: string): void {
    if (id === 'notifications') {
      this.notificationCentreOpen = true;
    } else if (id === 'profile') {
      this.goToSettings();
    }
  }

  readonly loading$ = this.store.select(selectCropsLoading);
  readonly categoryFilter$ = this.store.select(selectCategoryFilter);

  readonly categories = CATEGORIES;
  searchQuery = '';
  allFiltered: Crop[] = [];
  displayCrops: Crop[] = [];

  ngOnInit(): void {
    this.store.dispatch(CropsActions.loadCrops({}));
    this.store.select(selectFilteredCrops).subscribe(crops => {
      this.allFiltered = crops;
      this.applySearch();
    });

    // Notifications - use effect to reactively update
    effect(() => {
      this.notifications = this.notificationService.notifications();
      this.updateTopBarBadge();
    });
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
    if (!this.searchQuery) {
      this.displayCrops = this.allFiltered;
      return;
    }
    this.displayCrops = this.allFiltered.filter(c =>
      c.name.toLowerCase().includes(this.searchQuery) ||
      c.latin_name.toLowerCase().includes(this.searchQuery),
    );
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
