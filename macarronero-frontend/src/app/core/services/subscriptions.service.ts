// Servicio HTTP para gestionar suscripciones.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api.config';
import { Subscription } from '../models/subscription.model';

interface SubscriptionResponse {
  subscription: Subscription | null;
}

interface CheckoutResponse {
  url: string;
}

interface SelectCourseResponse {
  message: string;
  course: { id: number; title: string; level: string; cover_url?: string | null };
  periodStart: string;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  constructor(private readonly http: HttpClient) {}

  /** Devuelve la suscripcion activa del usuario autenticado */
  getMySubscription() {
    return this.http.get<SubscriptionResponse>(`${API_BASE_URL}/subscriptions/me`);
  }

  /** Inicia el checkout de Stripe para suscribirse a un plan */
  checkout(plan: 'normal' | 'premium') {
    return this.http.post<CheckoutResponse>(`${API_BASE_URL}/subscriptions/checkout`, { plan });
  }

  /** Cancela la suscripcion activa al final del periodo */
  cancel() {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/subscriptions/cancel`, {});
  }

  /** Selecciona o cambia el curso premium del periodo actual */
  selectPremiumCourse(courseId: number) {
    return this.http.post<SelectCourseResponse>(`${API_BASE_URL}/subscriptions/select-course`, {
      courseId
    });
  }
}
