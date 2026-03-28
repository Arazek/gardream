import { Component, Input, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton } from '@ionic/angular/standalone';

import { BottomSheetService } from '../../shared/services/bottom-sheet.service';
import { TaskType } from '../tasks/store/tasks.state';

interface TypeOption {
  value: TaskType;
  label: string;
  icon: string;
}

const TASK_TYPES: TypeOption[] = [
  { value: 'water',     label: 'Water',     icon: 'water_drop' },
  { value: 'fertilise', label: 'Fertilise', icon: 'science' },
  { value: 'prune',     label: 'Prune',     icon: 'content_cut' },
  { value: 'harvest',   label: 'Harvest',   icon: 'agriculture' },
  { value: 'check',     label: 'Check',     icon: 'search' },
  { value: 'custom',    label: 'Custom',    icon: 'edit_note' },
];

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton],
  styleUrl: './task-create.component.scss',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Add Task</ion-title>
        <ion-button slot="end" fill="clear" (click)="dismiss()">Cancel</ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content class="task-create-content">
      <form [formGroup]="form" (ngSubmit)="submit()" class="task-create-form">

        <!-- Task type -->
        <section class="tc-section">
          <h2 class="tc-section__title">Task type</h2>
          <div class="tc-type-grid">
            @for (t of taskTypes; track t.value) {
              <button
                type="button"
                class="tc-type-btn"
                [class.tc-type-btn--active]="form.value.type === t.value"
                (click)="form.patchValue({ type: t.value })"
              >
                <span class="material-symbols-outlined tc-type-btn__icon">{{ t.icon }}</span>
                <span class="tc-type-btn__label">{{ t.label }}</span>
              </button>
            }
          </div>
        </section>

        <!-- Due date -->
        <section class="tc-section">
          <h2 class="tc-section__title">Due date</h2>
          <input
            type="date"
            class="tc-date-input"
            formControlName="due_date"
          />
        </section>

        <!-- Optional title (for custom) -->
        @if (form.value.type === 'custom') {
          <section class="tc-section">
            <h2 class="tc-section__title">Title</h2>
            <input
              type="text"
              class="tc-text-input"
              placeholder="e.g. Re-pot seedlings"
              formControlName="title"
            />
          </section>
        }

        <!-- Note -->
        <section class="tc-section">
          <h2 class="tc-section__title">Note <span class="tc-section__optional">(optional)</span></h2>
          <textarea
            class="tc-textarea"
            rows="3"
            placeholder="Any extra details…"
            formControlName="note"
          ></textarea>
        </section>

        <button type="submit" class="tc-submit" [disabled]="form.invalid">
          Add Task
        </button>

      </form>
    </ion-content>
  `,
})
export class TaskCreateComponent {
  @Input() initialDate = new Date().toISOString().slice(0, 10);

  private readonly sheet = inject(BottomSheetService);
  private readonly fb = inject(FormBuilder);

  readonly taskTypes = TASK_TYPES;

  form: FormGroup = this.fb.group({
    type:     ['water', Validators.required],
    due_date: [this.initialDate, Validators.required],
    title:    [''],
    note:     [''],
  });

  // Refresh initialBreakpoint default after @Input resolves
  ngOnInit(): void {
    this.form.patchValue({ due_date: this.initialDate });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.sheet.dismiss({
      type: v.type,
      due_date: v.due_date,
      title: v.title?.trim() || null,
      note: v.note?.trim() || null,
    });
  }

  dismiss(): void {
    this.sheet.dismiss(null);
  }
}
