// Servicio HTTP para inscripciones de cursos.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Enrollment } from '../models/enrollment.model';

@Injectable({ providedIn: 'root' })
export class EnrollmentsService {
  constructor(private readonly http: HttpClient) {}

  list(userId?: number) {
    const query = userId ? `?userId=${userId}` : '';
    return this.http.get<Enrollment[]>(`${environment.apiBaseUrl}/enrollments${query}`);
  }

  create(courseId: number, userId?: number) {
    const payload = userId ? { userId, courseId } : { courseId };
    return this.http.post<Enrollment>(`${environment.apiBaseUrl}/enrollments`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/enrollments/${id}`);
  }
}
