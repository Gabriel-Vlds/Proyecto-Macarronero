// Servicio HTTP para consultar cursos.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Course, Lesson } from '../models/course.model';

type CoursesListResponse =
  | Course[]
  | { data?: unknown[]; courses?: unknown[]; items?: unknown[]; rows?: unknown[]; result?: unknown[]; value?: unknown[] };

@Injectable({ providedIn: 'root' })
export class CoursesService {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http
      .get<CoursesListResponse>(`${environment.apiBaseUrl}/courses`)
      .pipe(map((response) => this.extractList(response).map((item, index) => this.normalizeCourse(item, index))));
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

  private extractList(response: CoursesListResponse): unknown[] {
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

    if (Array.isArray(response?.rows)) {
      return response.rows;
    }

    if (Array.isArray(response?.result)) {
      return response.result;
    }

    if (Array.isArray(response?.value)) {
      return response.value;
    }

    throw new Error('Unexpected courses response shape');
  }

  private normalizeCourse(item: unknown, index: number): Course {
    const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const fallbackId = index + 1;
    const rawId = source['id'] ?? source['course_id'] ?? fallbackId;
    const normalizedId = Number(rawId) || fallbackId;

    const normalizedTier = source['tier'] === 'premium' ? 'premium' : 'basic';
    const rawLevel = typeof source['level'] === 'string' ? source['level'] : '';
    const normalizedLevel =
      rawLevel === 'beginner' || rawLevel === 'intermediate' || rawLevel === 'advanced'
        ? rawLevel
        : 'beginner';

    return {
      id: normalizedId,
      title: String(source['title'] ?? source['course_title'] ?? source['name'] ?? `Curso ${normalizedId}`),
      description: String(source['description'] ?? source['summary'] ?? ''),
      price: Number(source['price'] ?? source['amount'] ?? 0),
      tier: normalizedTier,
      level: normalizedLevel,
      cover_url: (source['cover_url'] ?? source['coverUrl'] ?? null) as string | null
    };
  }
}
