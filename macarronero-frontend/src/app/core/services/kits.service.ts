// Servicio HTTP para consultar kits.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api.config';
import { Kit } from '../models/kit.model';
import { Purchase } from '../models/purchase.model';

@Injectable({ providedIn: 'root' })
export class KitsService {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<Kit[]>(`${API_BASE_URL}/kits`);
  }

  create(payload: Partial<Kit>) {
    return this.http.post<Kit>(`${API_BASE_URL}/kits`, payload);
  }

  update(id: number, payload: Partial<Kit>) {
    return this.http.patch<Kit>(`${API_BASE_URL}/kits/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/kits/${id}`);
  }

  purchase(kitId: number, quantity: number) {
    return this.http.post<Purchase>(`${API_BASE_URL}/purchases`, { kitId, quantity });
  }
}
