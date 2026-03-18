import { Directive, ElementRef, AfterViewInit, Input } from '@angular/core';

@Directive({ selector: '[appAutofocus]', standalone: true })
export class AutofocusDirective implements AfterViewInit {
  @Input() appAutofocus = true;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (!this.appAutofocus) return;
    // Delay one tick to ensure the element is in the DOM
    setTimeout(() => {
      const input = this.el.nativeElement.querySelector('input') ?? this.el.nativeElement;
      (input as HTMLInputElement).focus?.();
    }, 50);
  }
}
