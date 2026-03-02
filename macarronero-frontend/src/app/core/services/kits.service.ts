// Servicio HTTP para consultar kits.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Kit } from '../models/kit.model';
import { Purchase } from '../models/purchase.model';

@Injectable({ providedIn: 'root' })
export class KitsService {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<Kit[]>(`${environment.apiBaseUrl}/kits`);
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
}
