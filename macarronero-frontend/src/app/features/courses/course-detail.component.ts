// Detalle de curso: lecciones protegidas con bloqueo anti-grabacion.
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CoursesService } from '../../core/services/courses.service';
import { AuthService } from '../../core/auth/auth.service';
import { Course, Lesson } from '../../core/models/course.model';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
  private readonly cleanup: Array<() => void> = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly coursesService: CoursesService,
    public readonly auth: AuthService
  ) {}

  ngOnInit() {
    const courseId = Number(this.route.snapshot.paramMap.get('id'));
    if (!courseId) { this.error = 'Curso invalido.'; this.loading = false; return; }

    this.coursesService.getById(courseId).subscribe({
      next: (course) => {
        this.course = course;
        if (this.auth.isLoggedIn()) {
          this.loadLessons(courseId);
        } else {
          this.notEnrolled = true;
          this.loading = false;
        }
      },
      error: () => { this.error = 'No se pudo cargar el curso.'; this.loading = false; }
    });

    this.attachGuards();
  }

  ngOnDestroy() {
    this.cleanup.forEach(fn => fn());
  }

  private loadLessons(courseId: number) {
    this.coursesService.getLessons(courseId).subscribe({
      next: (lessons) => { this.lessons = lessons; this.loading = false; },
      error: (err) => {
        if (err?.status === 403 || err?.status === 401) { this.notEnrolled = true; }
        else { this.error = 'No se pudieron cargar las lecciones.'; }
        this.loading = false;
      }
    });
  }

  toggle(id: number) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  getLevelLabel(level: string) {
    const map: Record<string, string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };
    return map[level] ?? level;
  }

  buyNow() {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    this.router.navigate(['/courses']);
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
