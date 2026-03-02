// Servicio HTTP para consultar cursos.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Course, Lesson } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<Course[]>(`${environment.apiBaseUrl}/courses`);
  }

  getById(id: number) {
    return this.http.get<Course>(`${environment.apiBaseUrl}/courses/${id}`);
  }

  getLessons(id: number) {
    return this.http.get<Lesson[]>(`${environment.apiBaseUrl}/courses/${id}/lessons`);
  }

  create(payload: Partial<Course>) {
    return this.http.post<Course>(`${environment.apiBaseUrl}/courses`, payload);
  }

  update(id: number, payload: Partial<Course>) {
    return this.http.patch<Course>(`${environment.apiBaseUrl}/courses/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/courses/${id}`);
  }
}
