// Servicio HTTP para pagos unicos con Stripe.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api.config';

interface CheckoutResponse {
  url: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  constructor(private readonly http: HttpClient) {}

  /** Crea sesion de Stripe Checkout para un curso o kit */
  checkout(type: 'course' | 'kit', itemId: number, quantity: number = 1) {
    return this.http.post<CheckoutResponse>(`${API_BASE_URL}/payments/checkout`, {
      type, itemId, quantity
    });
  }
}
