// Servicio HTTP para compras de kits.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api.config';
import { Purchase } from '../models/purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  constructor(private readonly http: HttpClient) {}

  list(userId?: number) {
    const query = userId ? `?userId=${userId}` : '';
    return this.http.get<Purchase[]>(`${API_BASE_URL}/purchases${query}`);
  }

  create(kitId: number, quantity: number, userId?: number) {
    return this.http.post<Purchase>(`${API_BASE_URL}/purchases`, { kitId, quantity, userId });
  }
}
