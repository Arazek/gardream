import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonToggle } from '@ionic/angular/standalone';
import { DayPickerComponent } from '../day-picker/day-picker.component';

export interface ScheduleValue {
  days: number[] | null;
  intervalWeeks: number;
}

@Component({
  selector: 'app-schedule-section',
  standalone: true,
  imports: [CommonModule, IonToggle, DayPickerComponent],
  templateUrl: './schedule-section.component.html',
  styleUrl: './schedule-section.component.scss',
})
export class ScheduleSectionComponent implements OnInit {
  @Input() label = '';
  @Input() toggleLabel = 'Use plot default';
  @Input() defaultDays: number[] = [];
  @Input() days: number[] | null = null;
  @Input() intervalWeeks = 1;

  @Output() scheduleChange = new EventEmitter<ScheduleValue>();

  useDefault = true;
  localDays: number[] = [];
  localInterval = 1;

  readonly cadenceOptions = [
    { label: 'Every week', value: 1 },
    { label: '2 weeks', value: 2 },
    { label: '3 weeks', value: 3 },
    { label: '4 weeks', value: 4 },
  ];

  ngOnInit() {
    this.useDefault = this.days === null;
    this.localDays = this.days !== null ? [...this.days] : [...this.defaultDays];
    this.localInterval = this.intervalWeeks;
  }

  onToggle(checked: boolean) {
    this.useDefault = checked;
    if (checked) {
      this.scheduleChange.emit({ days: null, intervalWeeks: this.localInterval });
    } else {
      this.localDays = [...this.defaultDays];
      this.scheduleChange.emit({ days: this.localDays, intervalWeeks: this.localInterval });
    }
  }

  onDaysChange(days: number[]) {
    this.localDays = days;
    if (!this.useDefault) {
      this.scheduleChange.emit({ days: this.localDays, intervalWeeks: this.localInterval });
    }
  }

  onCadenceSelect(value: number) {
    this.localInterval = value;
    this.scheduleChange.emit({
      days: this.useDefault ? null : this.localDays,
      intervalWeeks: this.localInterval,
    });
  }
}
