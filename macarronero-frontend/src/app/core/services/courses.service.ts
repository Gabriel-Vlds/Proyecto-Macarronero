// Servicio HTTP para consultar cursos.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api.config';
import { Course, Lesson } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<Course[]>(`${API_BASE_URL}/courses`);
  }

  getById(id: number) {
    return this.http.get<Course>(`${API_BASE_URL}/courses/${id}`);
  }

  getLessons(id: number) {
    return this.http.get<Lesson[]>(`${API_BASE_URL}/courses/${id}/lessons`);
  }

  create(payload: Partial<Course>) {
    return this.http.post<Course>(`${API_BASE_URL}/courses`, payload);
  }

  update(id: number, payload: Partial<Course>) {
    return this.http.patch<Course>(`${API_BASE_URL}/courses/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/courses/${id}`);
  }
}
