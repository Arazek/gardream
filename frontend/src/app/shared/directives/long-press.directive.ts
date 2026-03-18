import { Directive, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';

@Directive({ selector: '[appLongPress]', standalone: true })
export class LongPressDirective implements OnDestroy {
  @Output() appLongPress = new EventEmitter<void>();

  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly duration = 600;

  @HostListener('touchstart', ['$event'])
  @HostListener('mousedown', ['$event'])
  onStart(event: Event): void {
    event.preventDefault();
    this.timer = setTimeout(() => this.appLongPress.emit(), this.duration);
  }

  @HostListener('touchend')
  @HostListener('touchcancel')
  @HostListener('mouseup')
  @HostListener('mouseleave')
  onEnd(): void {
    this.clear();
  }

  private clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.clear();
  }
}
