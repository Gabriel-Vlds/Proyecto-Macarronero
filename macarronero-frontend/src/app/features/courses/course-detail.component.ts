// Detalle de curso: lecciones protegidas con bloqueo anti-grabacion.
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, of, timeout } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { CoursesService } from '../../core/services/courses.service';
import { PaymentsService } from '../../core/services/payments.service';
import { AuthService } from '../../core/auth/auth.service';
import { Course, Lesson } from '../../core/models/course.model';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.css'
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  course: Course | null = null;
  lessons: Lesson[] = [];
  loading = true;
  error = '';
  notEnrolled = false;
  screenBlocked = false;
  expandedId: number | null = null;
  buying = false;
  private readonly cleanup: Array<() => void> = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly coursesService: CoursesService,
    private readonly paymentsService: PaymentsService,
    public readonly auth: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const courseId = Number(this.route.snapshot.paramMap.get('id'));
    if (!courseId) { this.error = 'Curso invalido.'; this.loading = false; return; }

    this.coursesService
      .getById(courseId)
      .pipe(
        timeout(12000),
        catchError(() => {
          this.error = 'No se pudo cargar el curso.';
          return of(null);
        })
      )
      .subscribe((course) => {
        if (!course) {
          this.loading = false;
          this.render();
          return;
        }

        this.course = course;
        if (this.auth.isLoggedIn()) {
          this.loadLessons(courseId);
        } else {
          this.notEnrolled = true;
          this.loading = false;
          this.render();
        }
      });

    this.attachGuards();
  }

  ngOnDestroy() {
    this.cleanup.forEach(fn => fn());
  }

  private loadLessons(courseId: number) {
    this.coursesService
      .getLessons(courseId)
      .pipe(
        timeout(15000),
        catchError((err) => {
          if (err?.status === 403 || err?.status === 401) {
            this.notEnrolled = true;
            this.render();
            return of([] as Lesson[]);
          }

          this.error = err?.status === 0
            ? 'No se pudo conectar para cargar las lecciones.'
            : 'No se pudieron cargar las lecciones.';
          this.render();
          return of([] as Lesson[]);
        }),
        finalize(() => {
          this.loading = false;
          this.render();
        })
      )
      .subscribe((lessons) => {
        this.lessons = lessons;
        this.render();
      });
  }

  toggle(id: number) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  getLevelLabel(level: string) {
    const map: Record<string, string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };
    return map[level] ?? level;
  }

  getMuxPlaybackId(lesson: Lesson): string | null {
    if (lesson.mux_playback_id) {
      return lesson.mux_playback_id;
    }

    if (!lesson.video_url) return null;
    const match = lesson.video_url.match(/stream\.mux\.com\/([^.?/]+)/i);
    return match?.[1] ?? null;
  }

  buyNow() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.course) {
      return;
    }

    this.error = '';
    this.buying = true;

    this.paymentsService.checkout('course', this.course.id).pipe(
      catchError((err) => {
        if (err?.status === 409) {
          this.notEnrolled = false;
          this.loading = true;
          this.render();
          this.loadLessons(this.course!.id);
        } else {
          this.error = err?.error?.message || 'No se pudo iniciar el pago.';
          this.render();
        }

        return of(null);
      })
    ).subscribe((res) => {
      this.buying = false;
      this.render();
      if (res?.url) {
        window.location.href = res.url;
      }
    });
  }

  private render() {
    this.cdr.detectChanges();
  }

  private attachGuards() {
    const block = () => { this.screenBlocked = true; };
    const unblock = () => { this.screenBlocked = !document.hidden && document.hasFocus(); };

    const onKey = (e: KeyboardEvent) => {
      const blocked =
        e.key === 'F12' ||
        e.key === 'PrintScreen' ||
        (e.ctrlKey && ['u','U','s','S','p','P'].includes(e.key)) ||
        (e.ctrlKey && e.shiftKey && ['i','I','c','C','j','J'].includes(e.key)) ||
        (e.metaKey && ['u','U','s','S','p','P'].includes(e.key));
      if (blocked) { e.preventDefault(); e.stopPropagation(); }
    };

    const onCtxMenu = (e: MouseEvent) => { e.preventDefault(); };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); };
    const onVisibility = () => { this.screenBlocked = document.hidden; };

    window.addEventListener('blur', block);
    window.addEventListener('focus', unblock);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('contextmenu', onCtxMenu, true);
    document.addEventListener('copy', onCopy, true);

    this.cleanup.push(
      () => window.removeEventListener('blur', block),
      () => window.removeEventListener('focus', unblock),
      () => document.removeEventListener('visibilitychange', onVisibility),
      () => document.removeEventListener('keydown', onKey, true),
      () => document.removeEventListener('contextmenu', onCtxMenu, true),
      () => document.removeEventListener('copy', onCopy, true)
    );
  }
}
