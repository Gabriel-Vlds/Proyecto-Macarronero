// Servicio HTTP para datos de usuarios.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<User[]>(`${environment.apiBaseUrl}/users`);
  }

  getById(id: number) {
    return this.http.get<User>(`${environment.apiBaseUrl}/users/${id}`);
  }

  update(id: number, payload: Partial<User> & { password?: string }) {
    return this.http.patch<User>(`${environment.apiBaseUrl}/users/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/users/${id}`);
  }
}
