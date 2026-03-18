import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ExampleItem } from '../store/example.state';

@Injectable({ providedIn: 'root' })
export class ExampleApiService {
  private readonly url = `${environment.apiUrl}/example`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ExampleItem[]> {
    return this.http.get<ExampleItem[]>(this.url);
  }

  getOne(id: string): Observable<ExampleItem> {
    return this.http.get<ExampleItem>(`${this.url}/${id}`);
  }

  create(payload: { title: string; description?: string }): Observable<ExampleItem> {
    return this.http.post<ExampleItem>(this.url, payload);
  }

  update(id: string, payload: { title?: string; description?: string }): Observable<ExampleItem> {
    return this.http.put<ExampleItem>(`${this.url}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
