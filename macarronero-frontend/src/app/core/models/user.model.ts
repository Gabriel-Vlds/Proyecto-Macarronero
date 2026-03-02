// Modelo de datos para usuarios.
export type UserRole = 'admin' | 'customer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}
