import { Injectable, Type } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';

export interface BottomSheetOptions<T = unknown> {
  component: Type<T>;
  componentProps?: Record<string, unknown>;
  breakpoints?: number[];
  initialBreakpoint?: number;
}

@Injectable({ providedIn: 'root' })
export class BottomSheetService {
  constructor(private modalCtrl: ModalController) {}

  async open<T = unknown>(options: BottomSheetOptions<T>): Promise<unknown> {
    const modal = await this.modalCtrl.create({
      component: options.component,
      componentProps: options.componentProps,
      breakpoints: options.breakpoints ?? [0, 0.5, 1],
      initialBreakpoint: options.initialBreakpoint ?? 0.5,
      handle: true,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    return data;
  }

  async dismiss(data?: unknown): Promise<void> {
    await this.modalCtrl.dismiss(data);
  }
}
