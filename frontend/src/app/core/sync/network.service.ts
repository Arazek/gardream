import { Injectable, OnDestroy } from '@angular/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkService implements OnDestroy {
  private onlineSubject = new BehaviorSubject<boolean>(true);

  readonly online$: Observable<boolean> = this.onlineSubject.asObservable();

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    const status = await Network.getStatus();
    this.onlineSubject.next(status.connected);

    await Network.addListener('networkStatusChange', (status) => {
      this.onlineSubject.next(status.connected);
    });
  }

  get isOnline(): boolean {
    return this.onlineSubject.value;
  }

  ngOnDestroy(): void {
    Network.removeAllListeners();
  }
}
