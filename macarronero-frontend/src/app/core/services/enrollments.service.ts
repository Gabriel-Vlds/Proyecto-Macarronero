// Servicio HTTP para inscripciones de cursos.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api.config';
import { Enrollment } from '../models/enrollment.model';

@Injectable({ providedIn: 'root' })
export class EnrollmentsService {
  constructor(private readonly http: HttpClient) {}

  list(userId?: number) {
    const query = userId ? `?userId=${userId}` : '';
    return this.http.get<Enrollment[]>(`${API_BASE_URL}/enrollments${query}`);
  }

  create(courseId: number, userId?: number) {
    const payload = userId ? { userId, courseId } : { courseId };
    return this.http.post<Enrollment>(`${API_BASE_URL}/enrollments`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/enrollments/${id}`);
  }
}
