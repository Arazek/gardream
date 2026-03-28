import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationSettings, NotificationSettingsUpdate } from '../../features/tasks/store/tasks.state';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly url = `${environment.apiUrl}/notifications/settings`;

  constructor(private http: HttpClient) {}

  get(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(this.url);
  }

  update(payload: NotificationSettingsUpdate): Observable<NotificationSettings> {
    return this.http.patch<NotificationSettings>(this.url, payload);
  }
}
