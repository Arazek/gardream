import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskCreate, TaskUpdate } from '../../features/tasks/store/tasks.state';

@Injectable({ providedIn: 'root' })
export class TasksApiService {
  private readonly url = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getAll(filters?: { due_date?: string; completed?: boolean }): Observable<Task[]> {
    let params = new HttpParams();
    if (filters?.due_date) params = params.set('due_date', filters.due_date);
    if (filters?.completed !== undefined) params = params.set('completed', String(filters.completed));
    return this.http.get<Task[]>(this.url, { params });
  }

  getOne(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.url}/${id}`);
  }

  create(payload: TaskCreate): Observable<Task> {
    return this.http.post<Task>(this.url, payload);
  }

  update(id: string, payload: TaskUpdate): Observable<Task> {
    return this.http.patch<Task>(`${this.url}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
