// Vista para explorar y comprar cursos individuales.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, of, tap, timeout } from 'rxjs';
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
  private readonly coursesCacheKey = 'mr_courses_cache';
  private loadingWatchdogId: ReturnType<typeof setTimeout> | null = null;
  courses: Course[] = [];
  enrolledIds = new Set<number>();
  loading = true;
  buyingId: number | null = null;
  error = '';
  checkoutMessage = '';

  get debugState() {
    return {
      loading: this.loading,
      count: this.courses.length,
      firstTitle: this.courses[0]?.title || 'N/A',
      error: this.error || 'none'
    };
  }

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
      this.checkoutMessage = 'Pago cancelado. Puedes intentarlo nuevamente cuando quieras.';
    } else if (checkout === 'success') {
      this.checkoutMessage = 'Pago confirmado. Estamos actualizando tu acceso.';
    }

    this.startLoadingWatchdog();

    this.coursesService
      .list()
      .pipe(
        timeout(25000),
        tap((courses) => {
          localStorage.setItem(this.coursesCacheKey, JSON.stringify(courses));
        }),
        catchError((err) => {
          const cachedCourses = this.loadCachedCourses();
          if (cachedCourses.length > 0) {
            this.error = 'Mostrando cursos guardados por conexión lenta. Recarga en unos segundos para actualizar.';
            return of(cachedCourses);
          }

          this.error = err?.status === 0
            ? 'No se pudo conectar con el servidor. Intenta de nuevo en unos segundos.'
            : 'No se pudieron cargar los cursos.';
          return of([] as Course[]);
        }),
        finalize(() => {
          this.clearLoadingWatchdog();
          this.loading = false;
        })
      )
      .subscribe((courses) => {
        this.courses = courses;
      });

    if (this.auth.isLoggedIn()) {
      this.enrollmentsService.list().subscribe({
        next: (enrollments: Enrollment[]) => {
          const safeEnrollments = Array.isArray(enrollments) ? enrollments : [];
          this.enrolledIds = new Set(safeEnrollments.map((enrollment) => Number(enrollment.course_id)));
        },
        error: () => {}
      });
    }
  }

  isEnrolled(courseId: number): boolean {
    return this.enrolledIds.has(courseId);
  }

  buy(course: Course) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.error = '';
    this.buyingId = course.id;
    this.paymentsService.checkout('course', course.id).pipe(
      catchError((err) => {
        if (err?.status === 409) {
          this.enrolledIds.add(course.id);
        } else {
          this.error = err?.error?.message || 'No se pudo iniciar el pago.';
        }
        return of(null);
      })
    ).subscribe((res) => {
      this.buyingId = null;
      if (res?.url) window.location.href = res.url;
    });
  }

  private loadCachedCourses(): Course[] {
    const raw = localStorage.getItem(this.coursesCacheKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed as Course[] : [];
    } catch {
      return [];
    }
  }

  private startLoadingWatchdog() {
    this.clearLoadingWatchdog();
    this.loadingWatchdogId = setTimeout(() => {
      if (!this.loading) {
        return;
      }

      const cachedCourses = this.loadCachedCourses();
      if (cachedCourses.length > 0) {
        this.courses = cachedCourses;
        this.error = 'Conexión lenta detectada. Mostrando cursos guardados temporalmente.';
      } else {
        this.error = 'La carga está tardando demasiado. Recarga la página en unos segundos.';
      }

      this.loading = false;
    }, 12000);
  }

  private clearLoadingWatchdog() {
    if (this.loadingWatchdogId) {
      clearTimeout(this.loadingWatchdogId);
      this.loadingWatchdogId = null;
    }
  }
}


