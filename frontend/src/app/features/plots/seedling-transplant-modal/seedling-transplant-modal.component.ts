import { Component, inject, signal, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';

import { selectNonSeedlingPlots, selectPlotsState } from '../store/plots.selectors';
import { PlotsActions } from '../store/plots.actions';
import { Plot, PlotSlot } from '../store/plots.state';
import { BottomSheetService } from '../../../shared/services/bottom-sheet.service';

interface EmptyCell { row: number; col: number }

@Component({
  selector: 'app-seedling-transplant-modal',
  standalone: true,
  imports: [IonContent],
  styles: [`
    .transplant { padding: 16px; }
    .transplant__title { font-weight: 600; margin-bottom: 12px; }
    .transplant__list { list-style: none; padding: 0; margin: 0; }
    .transplant__item { padding: 12px; border: 1px solid var(--ion-color-light); border-radius: 8px; margin-bottom: 8px; cursor: pointer; }
    .transplant__item:hover { background: var(--ion-color-light); }
    .transplant__grid { display: grid; gap: 6px; margin-top: 8px; }
    .transplant__cell { aspect-ratio: 1; background: var(--ion-color-light); border-radius: 6px; cursor: pointer; border: 2px solid transparent; }
    .transplant__cell:hover { border-color: var(--ion-color-primary); }
    .transplant__back { background: none; border: none; color: var(--ion-color-primary); padding: 0; margin-bottom: 12px; cursor: pointer; }
  `],
  template: `
    <ion-content>
      <div class="transplant">
        @if (!selectedPlot()) {
          <p class="transplant__title">Choose target plot</p>
          <ul class="transplant__list">
            @for (plot of availablePlots(); track plot.id) {
              <li class="transplant__item" (click)="selectTargetPlot(plot)">
                <strong>{{ plot.name }}</strong>
                <span> — {{ plot.rows }}×{{ plot.cols }}</span>
              </li>
            }
          </ul>
        } @else {
          <button class="transplant__back" (click)="selectedPlot.set(null)">← Back</button>
          <p class="transplant__title">Pick an empty cell in {{ selectedPlot()!.name }}</p>
          <div class="transplant__grid" [style.grid-template-columns]="'repeat(' + selectedPlot()!.cols + ', 1fr)'">
            @for (cell of emptyCells(); track cell.row + '-' + cell.col) {
              <div class="transplant__cell" (click)="confirmTransplant(cell)" [title]="'Row ' + (cell.row + 1) + ', Col ' + (cell.col + 1)"></div>
            }
          </div>
          @if (emptyCells().length === 0) {
            <p>No empty cells in this plot.</p>
          }
        }
      </div>
    </ion-content>
  `,
})
export class SeedlingTransplantModalComponent {
  private readonly store = inject(Store);
  private readonly sheet = inject(BottomSheetService);

  private readonly plotsState = toSignal(this.store.select(selectPlotsState));
  readonly availablePlots = toSignal(this.store.select(selectNonSeedlingPlots), { initialValue: [] });
  readonly selectedPlot = signal<Plot | null>(null);

  readonly emptyCells = computed<EmptyCell[]>(() => {
    const plot = this.selectedPlot();
    if (!plot) return [];
    const state = this.plotsState();
    const takenSlots: PlotSlot[] = state?.slotsById[plot.id] ?? [];
    const occupied = new Set(takenSlots.map(s => `${s.row}-${s.col}`));
    const cells: EmptyCell[] = [];
    for (let r = 0; r < plot.rows; r++) {
      for (let c = 0; c < plot.cols; c++) {
        if (!occupied.has(`${r}-${c}`)) cells.push({ row: r, col: c });
      }
    }
    return cells;
  });

  selectTargetPlot(plot: Plot): void {
    this.store.dispatch(PlotsActions.loadSlots({ plotId: plot.id }));
    this.selectedPlot.set(plot);
  }

  confirmTransplant(cell: EmptyCell): void {
    const plot = this.selectedPlot();
    if (!plot) return;
    this.sheet.dismiss({ targetPlotId: plot.id, targetRow: cell.row, targetCol: cell.col });
  }
}
