import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { IonSearchbar } from '@ionic/angular/standalone';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [IonSearchbar],
  styleUrl: './search-bar.component.scss',
  template: `
    <ion-searchbar
      class="search-bar"
      [placeholder]="placeholder"
      [debounce]="0"
      (ionInput)="onInput($event)"
      (ionClear)="search.emit('')"
    />
  `,
})
export class SearchBarComponent implements OnDestroy {
  @Input() placeholder = 'Search...';
  @Input() debounceMs = 300;
  @Output() search = new EventEmitter<string>();

  private input$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.input$
      .pipe(debounceTime(this.debounceMs), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => this.search.emit(value));
  }

  onInput(event: CustomEvent): void {
    this.input$.next((event.detail.value ?? '').trim());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
