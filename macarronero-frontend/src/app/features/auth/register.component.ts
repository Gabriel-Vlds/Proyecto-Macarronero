// Formulario de registro de nuevos usuarios.
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  error = '';

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  submit() {
    this.error = '';
    this.auth.register(this.name, this.email, this.password).subscribe({
      next: () => {
        this.router.navigateByUrl('/account');
      },
      error: () => {
        this.error = 'No se pudo crear la cuenta.';
      }
    });
  }
}
