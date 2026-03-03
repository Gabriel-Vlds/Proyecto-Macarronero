import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Course, Lesson } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http
      .get<unknown>(`${environment.apiBaseUrl}/courses`)
      .pipe(map((response) => this.toArray(response).map((item, index) => this.toCourse(item, index))));
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

  private toArray(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const container = response as Record<string, unknown>;
    const candidates = ['data', 'courses', 'items', 'rows', 'result', 'value'] as const;

    for (const key of candidates) {
      const value = container[key];
      if (Array.isArray(value)) {
        return value;
      }
    }

    return [];
  }

  private toCourse(item: unknown, index: number): Course {
    const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const fallbackId = index + 1;

    const idValue = source['id'] ?? source['course_id'] ?? fallbackId;
    const id = Number(idValue) || fallbackId;

    const levelValue = typeof source['level'] === 'string' ? source['level'] : 'beginner';
    const level =
      levelValue === 'beginner' || levelValue === 'intermediate' || levelValue === 'advanced'
        ? levelValue
        : 'beginner';

    return {
      id,
      title: String(source['title'] ?? source['course_title'] ?? `Curso ${id}`),
      description: String(source['description'] ?? ''),
      price: Number(source['price'] ?? source['amount'] ?? 0),
      tier: source['tier'] === 'premium' ? 'premium' : 'basic',
      level,
      cover_url: (source['cover_url'] ?? source['coverUrl'] ?? null) as string | null
    };
  }
}
