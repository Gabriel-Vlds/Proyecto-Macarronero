// Servicio HTTP para consultar cursos.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Course, Lesson } from '../models/course.model';

type CoursesListResponse = Course[] | { data?: Course[]; courses?: Course[]; items?: Course[] };

@Injectable({ providedIn: 'root' })
export class CoursesService {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http
      .get<CoursesListResponse>(`${environment.apiBaseUrl}/courses`)
      .pipe(map((response) => this.extractList(response)));
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

  private extractList(response: CoursesListResponse): Course[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.courses)) {
      return response.courses;
    }

    if (Array.isArray(response?.items)) {
      return response.items;
    }

    throw new Error('Unexpected courses response shape');
  }
}
