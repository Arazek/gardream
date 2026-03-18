import { Injectable } from '@angular/core';
import { ActionSheetController, ActionSheetButton } from '@ionic/angular/standalone';

export interface ActionSheetOptions {
  header?: string;
  buttons: ActionSheetButton[];
}

@Injectable({ providedIn: 'root' })
export class ActionSheetService {
  constructor(private actionSheetCtrl: ActionSheetController) {}

  async show(options: ActionSheetOptions): Promise<string | undefined> {
    const sheet = await this.actionSheetCtrl.create({
      header: options.header,
      buttons: [
        ...options.buttons,
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { role, data } = await sheet.onWillDismiss();
    return role === 'cancel' ? undefined : (data as string);
  }
}
