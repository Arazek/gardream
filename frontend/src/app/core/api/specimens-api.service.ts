import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Specimen, SpecimenUpdate } from '../../features/plots/store/specimens.state';

@Injectable({ providedIn: 'root' })
export class SpecimensApiService {
  private readonly url = `${environment.apiUrl}/specimens`;

  constructor(private http: HttpClient) {}

  getBySlot(plotId: string, slotId: string): Observable<Specimen> {
    return this.http.get<Specimen>(`${environment.apiUrl}/plots/${plotId}/slots/${slotId}/specimen`);
  }

  getById(specimenId: string): Observable<Specimen> {
    return this.http.get<Specimen>(`${this.url}/${specimenId}`);
  }

  update(plotId: string, slotId: string, payload: SpecimenUpdate): Observable<Specimen> {
    return this.http.patch<Specimen>(
      `${environment.apiUrl}/plots/${plotId}/slots/${slotId}/specimen`,
      payload
    );
  }

  uploadPhoto(
    plotId: string,
    slotId: string,
    file: File,
    takenAt?: string,
    note?: string
  ): Observable<Specimen> {
    const formData = new FormData();
    formData.append('file', file);
    if (takenAt) {
      formData.append('taken_at', takenAt);
    }
    if (note) {
      formData.append('note', note);
    }
    return this.http.post<Specimen>(
      `${environment.apiUrl}/plots/${plotId}/slots/${slotId}/specimen/photos`,
      formData
    );
  }
}
