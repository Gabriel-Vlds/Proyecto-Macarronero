// Formulario de inicio de sesion.
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  submit() {
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigateByUrl('/account');
      },
      error: () => {
        this.error = 'Credenciales invalidas.';
      }
    });
  }
}
