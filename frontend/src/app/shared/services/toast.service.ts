import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

const VARIANT_COLOR: Record<ToastVariant, string> = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'primary',
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private toastCtrl: ToastController) {}

  async show(message: string, variant: ToastVariant = 'info', duration = 3000): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color: VARIANT_COLOR[variant],
      position: 'bottom',
      positionAnchor: 'footer',
    });
    await toast.present();
  }

  success(message: string, duration?: number) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    return this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number) {
    return this.show(message, 'warning', duration);
  }
}
