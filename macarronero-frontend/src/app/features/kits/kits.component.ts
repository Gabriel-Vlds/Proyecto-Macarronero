// Vista para explorar y comprar MacarroKits.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { KitsService } from '../../core/services/kits.service';
import { PaymentsService } from '../../core/services/payments.service';
import { AuthService } from '../../core/auth/auth.service';
import { Kit } from '../../core/models/kit.model';

@Component({
  selector: 'app-kits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kits.component.html',
  styleUrl: './kits.component.css'
})
export class KitsComponent implements OnInit {
  kits: Kit[] = [];
  loading = true;
  buyingId: number | null = null;
  error = '';
  quantities: Record<number, number> = {};

  constructor(
    private readonly kitsService: KitsService,
    private readonly paymentsService: PaymentsService,
    public readonly auth: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.kitsService.list().subscribe({
      next: (kits) => {
        this.kits = kits;
        kits.forEach(k => this.quantities[k.id] = 1);
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los kits.';
        this.loading = false;
      }
    });
  }

  setQty(kitId: number, delta: number) {
    const current = this.quantities[kitId] || 1;
    this.quantities[kitId] = Math.max(1, current + delta);
  }

  buy(kit: Kit) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.error = '';
    this.buyingId = kit.id;
    const qty = this.quantities[kit.id] || 1;
    this.paymentsService.checkout('kit', kit.id, qty).pipe(
      catchError((err) => {
        this.error = err?.error?.message || 'No se pudo iniciar el pago.';
        return of(null);
      })
    ).subscribe((res) => {
      this.buyingId = null;
      if (res?.url) window.location.href = res.url;
    });
  }
}

