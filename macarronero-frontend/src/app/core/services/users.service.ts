// Servicio HTTP para datos de usuarios.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api.config';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<User[]>(`${API_BASE_URL}/users`);
  }

  getById(id: number) {
    return this.http.get<User>(`${API_BASE_URL}/users/${id}`);
  }

  update(id: number, payload: Partial<User> & { password?: string }) {
    return this.http.patch<User>(`${API_BASE_URL}/users/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${API_BASE_URL}/users/${id}`);
  }
}
