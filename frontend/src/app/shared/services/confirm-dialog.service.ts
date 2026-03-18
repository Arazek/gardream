import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  constructor(private alertCtrl: AlertController) {}

  async confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: options.title,
        message: options.message,
        buttons: [
          {
            text: options.cancelLabel ?? 'Cancel',
            role: 'cancel',
            handler: () => resolve(false),
          },
          {
            text: options.confirmLabel ?? 'Confirm',
            role: options.destructive ? 'destructive' : 'confirm',
            handler: () => resolve(true),
          },
        ],
      });
      await alert.present();
    });
  }
}
