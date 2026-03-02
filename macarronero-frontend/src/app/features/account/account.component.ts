// Vista de cuenta: cursos comprados, kits comprados y cierre de sesion.
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of, Subscription as RxSub, timeout } from 'rxjs';
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
  loadingEnrollments = true;
  loadingPurchases = true;
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
      this.loadingEnrollments = false;
      this.loadingPurchases = false;
      this.router.navigateByUrl('/login');
      return;
    }

    const enrollmentsSub = this.enrollmentsService
      .list()
      .pipe(
        timeout(8000),
        catchError((err) => {
          this.enrollmentsError = err?.status === 0
            ? 'No se pudo conectar para cargar tus cursos.'
            : 'No se pudieron cargar tus cursos.';
          return of([] as Enrollment[]);
        })
      )
      .subscribe((enrollments) => {
        this.enrollments = enrollments;
        this.loadingEnrollments = false;
      });

    const purchasesSub = this.purchasesService
      .list()
      .pipe(
        timeout(8000),
        catchError((err) => {
          this.purchasesError = err?.status === 0
            ? 'No se pudo conectar para cargar tus kits.'
            : 'No se pudieron cargar tus kits.';
          return of([] as Purchase[]);
        })
      )
      .subscribe((purchases) => {
        this.purchases = purchases;
        this.loadingPurchases = false;
      });

    this.subs.push(enrollmentsSub, purchasesSub);
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
