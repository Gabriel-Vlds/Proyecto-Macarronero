// Servicio HTTP para inscripciones de cursos.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Enrollment } from '../models/enrollment.model';

type EnrollmentsListResponse =
  | Enrollment[]
  | { data?: Enrollment[]; enrollments?: Enrollment[]; items?: Enrollment[]; rows?: Enrollment[]; value?: Enrollment[] };

@Injectable({ providedIn: 'root' })
export class EnrollmentsService {
  constructor(private readonly http: HttpClient) {}

  list(userId?: number) {
    const query = userId ? `?userId=${userId}` : '';
    return this.http
      .get<EnrollmentsListResponse>(`${environment.apiBaseUrl}/enrollments${query}`)
      .pipe(map((response) => this.extractList(response)));
  }

  create(courseId: number, userId?: number) {
    const payload = userId ? { userId, courseId } : { courseId };
    return this.http.post<Enrollment>(`${environment.apiBaseUrl}/enrollments`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/enrollments/${id}`);
  }

  private extractList(response: EnrollmentsListResponse): Enrollment[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.enrollments)) {
      return response.enrollments;
    }

    if (Array.isArray(response?.items)) {
      return response.items;
    }

    if (Array.isArray(response?.rows)) {
      return response.rows;
    }

    if (Array.isArray(response?.value)) {
      return response.value;
    }

    return [];
  }
}
