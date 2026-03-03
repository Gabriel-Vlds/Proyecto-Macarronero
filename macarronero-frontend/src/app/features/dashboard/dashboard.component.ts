// Vista general del panel principal.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoursesService } from '../../core/services/courses.service';
import { KitsService } from '../../core/services/kits.service';
import { UsersService } from '../../core/services/users.service';
import { Course } from '../../core/models/course.model';
import { Kit } from '../../core/models/kit.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  courses: Course[] = [];
  kits: Kit[] = [];
  users: User[] = [];
  message = '';

  courseForm: Partial<Course> = {
    title: '',
    description: '',
    price: 0,
    tier: 'basic',
    level: 'beginner'
  };

  lessonForm = {
    courseId: 0,
    title: '',
    content: '',
    videoUrl: '',
    orderIndex: 1,
    durationMin: 10
  };

  kitForm: Partial<Kit> = {
    name: '',
    description: '',
    price: 0,
    stock: 0
  };

  userUpdate = {
    id: 0,
    name: '',
    email: '',
    role: 'customer' as User['role']
  };

  constructor(
    private readonly coursesService: CoursesService,
    private readonly kitsService: KitsService,
    private readonly usersService: UsersService
  ) {}

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.coursesService.list().subscribe((items) => (this.courses = items));
    this.kitsService.list().subscribe((items) => (this.kits = items));
    this.usersService.list().subscribe((items) => (this.users = items));
  }

  createCourse() {
    this.coursesService.create(this.courseForm).subscribe({
      next: () => {
        this.message = 'Curso creado.';
        this.courseForm = {
          title: '',
          description: '',
          price: 0,
          tier: 'basic',
          level: 'beginner'
        };
        this.refresh();
      },
      error: () => {
        this.message = 'No se pudo crear el curso.';
      }
    });
  }

  createLesson() {
    if (!this.lessonForm.courseId || !this.lessonForm.title.trim()) {
      this.message = 'Indica el ID del curso y el titulo de la leccion.';
      return;
    }

    this.coursesService.createLesson(this.lessonForm.courseId, {
      title: this.lessonForm.title,
      content: this.lessonForm.content,
      videoUrl: this.lessonForm.videoUrl || null,
      orderIndex: this.lessonForm.orderIndex,
      durationMin: this.lessonForm.durationMin
    }).subscribe({
      next: () => {
        this.message = 'Leccion creada.';
        this.lessonForm = {
          courseId: this.lessonForm.courseId,
          title: '',
          content: '',
          videoUrl: '',
          orderIndex: 1,
          durationMin: 10
        };
      },
      error: () => {
        this.message = 'No se pudo crear la leccion.';
      }
    });
  }

  updateCourse(course: Course) {
    this.coursesService.update(course.id, course).subscribe({
      next: () => {
        this.message = 'Curso actualizado.';
        this.refresh();
      },
      error: () => {
        this.message = 'No se pudo actualizar el curso.';
      }
    });
  }

  deleteCourse(id: number) {
    this.coursesService.remove(id).subscribe({
      next: () => {
        this.message = 'Curso eliminado.';
        this.refresh();
      },
      error: () => {
        this.message = 'No se pudo eliminar el curso.';
      }
    });
  }

  createKit() {
    this.kitsService.create(this.kitForm).subscribe({
      next: () => {
        this.message = 'Kit creado.';
        this.kitForm = { name: '', description: '', price: 0, stock: 0 };
        this.refresh();
      },
      error: () => {
        this.message = 'No se pudo crear el kit.';
      }
    });
  }

  updateKit(kit: Kit) {
    this.kitsService.update(kit.id, kit).subscribe({
      next: () => {
        this.message = 'Kit actualizado.';
        this.refresh();
      },
      error: () => {
        this.message = 'No se pudo actualizar el kit.';
      }
    });
  }

  deleteKit(id: number) {
    this.kitsService.remove(id).subscribe({
      next: () => {
        this.message = 'Kit eliminado.';
        this.refresh();
      },
      error: () => {
        this.message = 'No se pudo eliminar el kit.';
      }
    });
  }

  updateUser() {
    if (!this.userUpdate.id) {
      this.message = 'Indica el ID del cliente.';
      return;
    }

    const payload = {
      name: this.userUpdate.name || undefined,
      email: this.userUpdate.email || undefined,
      role: this.userUpdate.role
    };

    this.usersService.update(this.userUpdate.id, payload).subscribe({
      next: () => {
        this.message = 'Cliente actualizado.';
        this.refresh();
      },
      error: () => {
        this.message = 'No se pudo actualizar el cliente.';
      }
    });
  }
}
