// Vista de cuenta: cursos comprados, kits comprados y cierre de sesion.
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of, Subscription as RxSub } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { EnrollmentsService } from '../../core/services/enrollments.service';
import { PurchasesService } from '../../core/services/purchases.service';
import { Enrollment } from '../../core/models/enrollment.model';
import { Purchase } from '../../core/models/purchase.model';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit, OnDestroy {
  enrollments: Enrollment[] = [];
  purchases: Purchase[] = [];
  loading = true;
  enrollmentsError = '';
  purchasesError = '';
  checkoutMessage = '';
  private subs: RxSub[] = [];

  constructor(
    public readonly auth: AuthService,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly purchasesService: PurchasesService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit() {
    const checkout = this.route.snapshot.queryParamMap.get('checkout');
    if (checkout === 'success') {
      this.checkoutMessage = 'Pago confirmado. Tu compra se verá reflejada en breve.';
    } else if (checkout === 'cancel') {
      this.checkoutMessage = 'Pago cancelado.';
    }

    const user = this.auth.user();
    if (!user) {
      this.loading = false;
      this.router.navigateByUrl('/login');
      return;
    }

    const s = forkJoin({
      enrollments: this.enrollmentsService.list().pipe(
        catchError((err) => {
          this.enrollmentsError = err?.status === 0
            ? 'No se pudo conectar para cargar tus cursos.'
            : 'No se pudieron cargar tus cursos.';
          return of([] as Enrollment[]);
        })
      ),
      purchases: this.purchasesService.list().pipe(
        catchError((err) => {
          this.purchasesError = err?.status === 0
            ? 'No se pudo conectar para cargar tus kits.'
            : 'No se pudieron cargar tus kits.';
          return of([] as Purchase[]);
        })
      )
    }).subscribe({
      next: ({ enrollments, purchases }) => {
        this.enrollments = enrollments;
        this.purchases = purchases;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.subs.push(s);
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
