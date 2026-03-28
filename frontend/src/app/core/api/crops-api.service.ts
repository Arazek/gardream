import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Crop, CropCategory } from '../../features/crops/store/crops.state';

@Injectable({ providedIn: 'root' })
export class CropsApiService {
  private readonly url = `${environment.apiUrl}/crops`;

  constructor(private http: HttpClient) {}

  getAll(category?: CropCategory): Observable<Crop[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<Crop[]>(this.url, { params });
  }

  getOne(id: string): Observable<Crop> {
    return this.http.get<Crop>(`${this.url}/${id}`);
  }
}
