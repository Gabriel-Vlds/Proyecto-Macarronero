// Servicio de autenticacion: login, registro y manejo de sesion local.
import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { User } from '../models/user.model';

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'mr_token';
  private readonly userKey = 'mr_user';
  private readonly userSignal = signal<User | null>(this.loadUser());
  readonly user = computed(() => this.userSignal());

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/login`, { email, password })
      .pipe(tap((response) => this.setSession(response)));
  }

  register(name: string, email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/register`, { name, email, password })
      .pipe(tap((response) => this.setSession(response)));
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.userSignal.set(null);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn() {
    return !!this.userSignal();
  }

  isAdmin() {
    return this.userSignal()?.role === 'admin';
  }

  private setSession(response: AuthResponse) {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.userSignal.set(response.user);
  }

  private loadUser() {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
