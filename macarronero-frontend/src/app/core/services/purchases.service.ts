// Servicio HTTP para compras de kits.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Purchase } from '../models/purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  constructor(private readonly http: HttpClient) {}

  list(userId?: number) {
    const query = userId ? `?userId=${userId}` : '';
    return this.http.get<Purchase[]>(`${environment.apiBaseUrl}/purchases${query}`);
  }

  create(kitId: number, quantity: number, userId?: number) {
    return this.http.post<Purchase>(`${environment.apiBaseUrl}/purchases`, { kitId, quantity, userId });
  }
}
