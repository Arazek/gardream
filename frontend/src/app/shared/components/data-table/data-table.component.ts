import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronUpOutline, chevronDownOutline, swapVerticalOutline } from 'ionicons/icons';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

export interface DataTableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableSortEvent {
  key: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgClass, NgTemplateOutlet, IonIcon, LoadingSkeletonComponent, EmptyStateComponent],
  styleUrl: './data-table.component.scss',
  template: `
    <div class="data-table">
      @if (loading) {
        <app-loading-skeleton [count]="5" [showAvatar]="false" />
      } @else if (rows.length === 0) {
        <app-empty-state [title]="emptyLabel" message="" />
      } @else {
        <div class="data-table__scroll">
          <table class="data-table__table">
            <thead>
              <tr>
                @for (col of columns; track col.key) {
                  <th
                    class="data-table__th"
                    [ngClass]="[
                      'data-table__th--' + (col.align ?? 'left'),
                      col.sortable ? 'data-table__th--sortable' : ''
                    ]"
                    [style.width]="col.width ?? 'auto'"
                    (click)="onSort(col)"
                  >
                    <span class="data-table__th-inner">
                      {{ col.label }}
                      @if (col.sortable) {
                        <ion-icon
                          class="data-table__sort-icon"
                          [ngClass]="{
                            'data-table__sort-icon--active': sortKey === asString(col.key)
                          }"
                          [name]="getSortIcon(col)"
                        />
                      }
                    </span>
                  </th>
                }
                @if (actionsTemplate) {
                  <th class="data-table__th data-table__th--actions"></th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of rows; track $index) {
                <tr class="data-table__row">
                  @for (col of columns; track col.key) {
                    <td
                      class="data-table__td"
                      [ngClass]="'data-table__td--' + (col.align ?? 'left')"
                      [attr.data-label]="col.label"
                    >
                      {{ getCellValue(row, col) }}
                    </td>
                  }
                  @if (actionsTemplate) {
                    <td class="data-table__td data-table__td--actions">
                      <ng-container
                        [ngTemplateOutlet]="actionsTemplate"
                        [ngTemplateOutletContext]="{ $implicit: row }"
                      />
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class DataTableComponent {
  @Input() columns: DataTableColumn[] = [];
  @Input() rows: any[] = [];
  @Input() loading = false;
  @Input() emptyLabel = 'No data found';
  @Output() sortChange = new EventEmitter<DataTableSortEvent>();

  @ContentChild('actionsTemplate') actionsTemplate?: TemplateRef<any>;

  sortKey: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor() {
    addIcons({ chevronUpOutline, chevronDownOutline, swapVerticalOutline });
  }

  asString(key: string | number | symbol): string {
    return String(key);
  }

  getCellValue(row: any, col: DataTableColumn): any {
    return row[col.key] ?? '—';
  }

  getSortIcon(col: DataTableColumn): string {
    const key = String(col.key);
    if (this.sortKey !== key) return 'swap-vertical-outline';
    return this.sortDirection === 'asc' ? 'chevron-up-outline' : 'chevron-down-outline';
  }

  onSort(col: DataTableColumn): void {
    if (!col.sortable) return;
    const key = String(col.key);
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
    this.sortChange.emit({ key: this.sortKey, direction: this.sortDirection });
  }
}
