import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular/standalone';

@Injectable({ providedIn: 'root' })
export class LoadingOverlayService {
  private loading: HTMLIonLoadingElement | null = null;

  constructor(private loadingCtrl: LoadingController) {}

  async show(message = 'Loading...'): Promise<void> {
    if (this.loading) return;
    this.loading = await this.loadingCtrl.create({ message });
    await this.loading.present();
  }

  async hide(): Promise<void> {
    if (!this.loading) return;
    await this.loading.dismiss();
    this.loading = null;
  }

  async wrap<T>(fn: () => Promise<T>, message?: string): Promise<T> {
    await this.show(message);
    try {
      return await fn();
    } finally {
      await this.hide();
    }
  }
}
