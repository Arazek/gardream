import { signal, computed } from '@angular/core';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'pending' | 'error';

// Writable signals — only SyncService mutates these
export const _syncOnline = signal(true);
export const _syncPendingCount = signal(0);
export const _syncIsSyncing = signal(false);
export const _syncHasError = signal(false);

// Public computed status — consumed by the banner and any component
export const syncStatus = computed<SyncStatus>(() => {
  if (!_syncOnline()) return 'offline';
  if (_syncIsSyncing()) return 'syncing';
  if (_syncHasError()) return 'error';
  if (_syncPendingCount() > 0) return 'pending';
  return 'idle';
});

export const syncPendingCount = _syncPendingCount.asReadonly();
