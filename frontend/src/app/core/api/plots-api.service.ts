import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Plot, PlotCreate, PlotUpdate, PlotSlot, PlotSlotCreate, PlotSlotUpdate } from '../../features/plots/store/plots.state';

@Injectable({ providedIn: 'root' })
export class PlotsApiService {
  private readonly url = `${environment.apiUrl}/plots`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Plot[]> {
    return this.http.get<Plot[]>(this.url);
  }

  getOne(id: string): Observable<Plot> {
    return this.http.get<Plot>(`${this.url}/${id}`);
  }

  create(payload: PlotCreate): Observable<Plot> {
    return this.http.post<Plot>(this.url, payload);
  }

  update(id: string, payload: PlotUpdate): Observable<Plot> {
    return this.http.patch<Plot>(`${this.url}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  getSlots(plotId: string): Observable<PlotSlot[]> {
    return this.http.get<PlotSlot[]>(`${this.url}/${plotId}/slots`);
  }

  createSlot(plotId: string, payload: PlotSlotCreate): Observable<PlotSlot> {
    return this.http.post<PlotSlot>(`${this.url}/${plotId}/slots`, payload);
  }

  updateSlot(plotId: string, slotId: string, payload: PlotSlotUpdate): Observable<PlotSlot> {
    return this.http.patch<PlotSlot>(`${this.url}/${plotId}/slots/${slotId}`, payload);
  }

  deleteSlot(plotId: string, slotId: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${plotId}/slots/${slotId}`);
  }
}
