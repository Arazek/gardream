import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline, syncOutline, alertCircleOutline, closeOutline } from 'ionicons/icons';

import { syncStatus, syncPendingCount } from '../../../core/sync/sync-status.signal';
import { SyncService } from '../../../core/sync/sync.service';
import type { OutboxEntry } from '../../../core/db/local-db.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './offline-banner.component.html',
  styleUrls: ['./offline-banner.component.scss'],
})
export class OfflineBannerComponent {
  private sync = inject(SyncService);

  readonly status = syncStatus;
  readonly pendingCount = syncPendingCount;
  readonly dismissed = signal(false);
  readonly showFailedModal = signal(false);
  readonly failedEntries = signal<OutboxEntry[]>([]);

  readonly visible = computed(() => {
    if (this.dismissed()) return false;
    const s = this.status();
    return s === 'offline' || s === 'pending' || s === 'error' || s === 'syncing';
  });

  readonly message = computed(() => {
    switch (this.status()) {
      case 'offline': return "You're offline — changes will sync when you reconnect";
      case 'syncing': return 'Syncing changes…';
      case 'pending': return `${this.pendingCount()} change${this.pendingCount() === 1 ? '' : 's'} pending sync`;
      case 'error': return '1 change could not be saved — tap to review';
      default: return '';
    }
  });

  readonly bannerClass = computed(() => {
    switch (this.status()) {
      case 'syncing': return 'banner--blue';
      case 'error': return 'banner--red';
      default: return 'banner--amber';
    }
  });

  constructor() {
    addIcons({ cloudOfflineOutline, syncOutline, alertCircleOutline, closeOutline });
  }

  dismiss(): void {
    this.dismissed.set(true);
  }

  async openFailedModal(): Promise<void> {
    if (this.status() !== 'error') return;
    const entries = await this.sync.getFailedEntries();
    this.failedEntries.set(entries);
    this.showFailedModal.set(true);
  }

  async discard(id: number): Promise<void> {
    await this.sync.discardFailedEntry(id);
    const entries = await this.sync.getFailedEntries();
    this.failedEntries.set(entries);
    if (entries.length === 0) this.showFailedModal.set(false);
  }

  async retry(id: number): Promise<void> {
    await this.sync.retryFailedEntry(id);
    this.showFailedModal.set(false);
  }
}
