import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, of, timeout } from 'rxjs';
import { CoursesService } from '../../core/services/courses.service';
import { EnrollmentsService } from '../../core/services/enrollments.service';
import { PaymentsService } from '../../core/services/payments.service';
import { AuthService } from '../../core/auth/auth.service';
import { Course } from '../../core/models/course.model';
import { Enrollment } from '../../core/models/enrollment.model';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css'
})
export class CoursesComponent implements OnInit {
  courses = signal<Course[]>([]);
  enrolledIds = signal<Set<number>>(new Set<number>());
  loading = signal(true);
  buyingId = signal<number | null>(null);
  error = signal('');
  checkoutMessage = signal('');

  constructor(
    private readonly coursesService: CoursesService,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly paymentsService: PaymentsService,
    public readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit() {
    const checkout = this.route.snapshot.queryParamMap.get('checkout');
    if (checkout === 'cancel') {
      this.checkoutMessage.set('Pago cancelado. Puedes intentarlo nuevamente cuando quieras.');
    } else if (checkout === 'success') {
      this.checkoutMessage.set('Pago confirmado. Estamos actualizando tu acceso.');
    }

    this.coursesService
      .list()
      .pipe(
        timeout(15000),
        catchError((err) => {
          this.error.set(
            err?.status === 0
              ? 'No se pudo conectar con el servidor. Intenta de nuevo en unos segundos.'
              : 'No se pudieron cargar los cursos.'
          );
          return of([] as Course[]);
        }),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe((courses) => {
        this.courses.set(courses);
      });

    if (this.auth.isLoggedIn()) {
      this.enrollmentsService
        .list()
        .pipe(catchError(() => of([] as Enrollment[])))
        .subscribe((enrollments) => {
          this.enrolledIds.set(new Set(enrollments.map((item) => Number(item.course_id))));
        });
    }
  }

  isEnrolled(courseId: number): boolean {
    return this.enrolledIds().has(courseId);
  }

  buy(course: Course) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.error.set('');
    this.buyingId.set(course.id);

    this.paymentsService
      .checkout('course', course.id)
      .pipe(
        catchError((err) => {
          if (err?.status === 409) {
            this.enrolledIds.update((current) => {
              const next = new Set(current);
              next.add(course.id);
              return next;
            });
          } else {
            this.error.set(err?.error?.message || 'No se pudo iniciar el pago.');
          }
          return of(null);
        }),
        finalize(() => {
          this.buyingId.set(null);
        })
      )
      .subscribe((result) => {
        if (result?.url) {
          window.location.href = result.url;
        }
      });
  }
}


