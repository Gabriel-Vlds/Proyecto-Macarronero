// Servicio HTTP para consultar kits.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Kit } from '../models/kit.model';
import { Purchase } from '../models/purchase.model';

type KitsListResponse = Kit[] | { data?: Kit[]; kits?: Kit[]; items?: Kit[] };

@Injectable({ providedIn: 'root' })
export class KitsService {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http
      .get<KitsListResponse>(`${environment.apiBaseUrl}/kits`)
      .pipe(map((response) => this.extractList(response)));
  }

  create(payload: Partial<Kit>) {
    return this.http.post<Kit>(`${environment.apiBaseUrl}/kits`, payload);
  }

  update(id: number, payload: Partial<Kit>) {
    return this.http.patch<Kit>(`${environment.apiBaseUrl}/kits/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/kits/${id}`);
  }

  purchase(kitId: number, quantity: number) {
    return this.http.post<Purchase>(`${environment.apiBaseUrl}/purchases`, { kitId, quantity });
  }

  private extractList(response: KitsListResponse): Kit[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.kits)) {
      return response.kits;
    }

    if (Array.isArray(response?.items)) {
      return response.items;
    }

    throw new Error('Unexpected kits response shape');
  }
}
