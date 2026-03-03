// Vista general del panel principal.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, firstValueFrom, of, timeout } from 'rxjs';
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
  isLoadingCourses = false;
  coursesLoadError = '';
  private coursesRequestVersion = 0;
  message = '';
  selectedCourseId = 0;
  selectedCourse: Course | null = null;
  selectedKitId = 0;
  selectedKit: Kit | null = null;

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
    muxPlaybackId: '',
    videoUrl: '',
    orderIndex: 1,
    durationMin: 10
  };
  selectedVideoFile: File | null = null;
  isUploadingVideo = false;
  uploadProgressMessage = '';

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
    this.loadCourses();
    this.kitsService.list().subscribe((items) => {
      this.kits = items;
      if (this.selectedKitId) {
        this.selectKitForEdit();
      }
    });
    this.usersService.list().subscribe((items) => (this.users = items));
  }

  retryCoursesLoad() {
    this.loadCourses();
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

    if (this.selectedVideoFile && !this.lessonForm.videoUrl) {
      this.message = 'Primero sube el archivo de video a Mux y espera a que termine.';
      return;
    }

    const normalizedVideoUrl = this.normalizeMuxVideoInput(this.lessonForm.videoUrl, this.lessonForm.muxPlaybackId);

    this.coursesService.createLesson(this.lessonForm.courseId, {
      title: this.lessonForm.title,
      content: this.lessonForm.content,
      videoUrl: normalizedVideoUrl,
      orderIndex: this.lessonForm.orderIndex,
      durationMin: this.lessonForm.durationMin
    }).subscribe({
      next: () => {
        this.message = 'Leccion creada.';
        this.lessonForm = {
          courseId: this.lessonForm.courseId,
          title: '',
          content: '',
          muxPlaybackId: '',
          videoUrl: '',
          orderIndex: 1,
          durationMin: 10
        };
        this.selectedVideoFile = null;
        this.uploadProgressMessage = '';
      },
      error: () => {
        this.message = 'No se pudo crear la leccion.';
      }
    });
  }

  onVideoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedVideoFile = input.files?.[0] || null;

    if (this.selectedVideoFile) {
      this.uploadProgressMessage = `Archivo seleccionado: ${this.selectedVideoFile.name}`;
      this.lessonForm.videoUrl = '';
      return;
    }

    this.uploadProgressMessage = '';
  }

  async uploadVideoToMuxAndAttach() {
    if (!this.lessonForm.courseId) {
      this.message = 'Selecciona un curso antes de subir el video.';
      return;
    }

    if (!this.selectedVideoFile) {
      this.message = 'Selecciona un archivo de video primero.';
      return;
    }

    this.isUploadingVideo = true;

    try {
      this.uploadProgressMessage = 'Solicitando URL segura de carga a Mux...';
      const uploadInit = await firstValueFrom(
        this.coursesService.createMuxUpload(this.lessonForm.courseId, {
          fileName: this.selectedVideoFile.name,
          contentType: this.selectedVideoFile.type || 'application/octet-stream'
        })
      );

      if (!uploadInit.uploadId || !uploadInit.uploadUrl) {
        throw new Error('Respuesta invalida al crear carga de Mux.');
      }

      this.uploadProgressMessage = 'Subiendo archivo a Mux...';
      const uploadResponse = await fetch(uploadInit.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': this.selectedVideoFile.type || 'application/octet-stream'
        },
        body: this.selectedVideoFile
      });

      if (!uploadResponse.ok) {
        throw new Error(`Error subiendo archivo: ${uploadResponse.status}`);
      }

      this.uploadProgressMessage = 'Procesando video en Mux...';
      let statusResponse: {
        muxStatus: 'ready' | 'preparing' | 'errored' | 'unknown';
        videoUrl: string | null;
      } | null = null;

      for (let attempt = 0; attempt < 30; attempt += 1) {
        await this.sleep(4000);
        statusResponse = await firstValueFrom(
          this.coursesService.getMuxUploadStatus(this.lessonForm.courseId, uploadInit.uploadId)
        );

        if (statusResponse.muxStatus === 'ready' && statusResponse.videoUrl) {
          break;
        }

        if (statusResponse.muxStatus === 'errored') {
          throw new Error('Mux reporto error procesando el video.');
        }
      }

      if (!statusResponse?.videoUrl) {
        throw new Error('Mux todavia no genera playback. Intenta nuevamente en unos minutos.');
      }

      this.lessonForm.videoUrl = statusResponse.videoUrl;
      this.message = 'Video cargado y procesado en Mux. Ya puedes crear la leccion.';
      this.uploadProgressMessage = 'Video listo en Mux.';
    } catch (error) {
      console.error('Mux upload flow error:', error);
      this.message = 'No se pudo subir/procesar el video en Mux.';
    } finally {
      this.isUploadingVideo = false;
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private loadCourses() {
    const requestVersion = ++this.coursesRequestVersion;
    this.isLoadingCourses = true;
    this.coursesLoadError = '';

    this.coursesService
      .list()
      .pipe(
        timeout(15000),
        catchError((error) => {
          if (requestVersion !== this.coursesRequestVersion) {
            return of([] as Course[]);
          }

          this.coursesLoadError =
            error?.status === 0
              ? 'No se pudo conectar para cargar cursos. Verifica backend y red.'
              : 'No se pudieron cargar los cursos del panel.';
          this.courses = [];
          this.selectedCourse = null;
          this.selectedCourseId = 0;
          this.lessonForm.courseId = 0;
          return of([] as Course[]);
        }),
        finalize(() => {
          if (requestVersion === this.coursesRequestVersion) {
            this.isLoadingCourses = false;
          }
        })
      )
      .subscribe((items) => {
        if (requestVersion !== this.coursesRequestVersion) {
          return;
        }

        this.courses = items;

        if (this.selectedCourseId && !items.some((item) => item.id === Number(this.selectedCourseId))) {
          this.selectedCourseId = 0;
          this.selectedCourse = null;
        } else if (this.selectedCourseId) {
          this.selectCourseForEdit();
        }

        if (this.lessonForm.courseId && !items.some((item) => item.id === Number(this.lessonForm.courseId))) {
          this.lessonForm.courseId = 0;
        }
      });
  }

  private normalizeMuxVideoInput(videoUrl: string, playbackId: string) {
    const cleanPlaybackId = (playbackId || '').trim();
    if (cleanPlaybackId) {
      return `https://stream.mux.com/${cleanPlaybackId}.m3u8`;
    }

    const cleanVideoUrl = (videoUrl || '').trim();
    return cleanVideoUrl || null;
  }

  selectCourseForEdit() {
    const found = this.courses.find((item) => item.id === Number(this.selectedCourseId));
    this.selectedCourse = found
      ? {
          ...found,
          price: Number(found.price)
        }
      : null;
  }

  saveSelectedCourse() {
    if (!this.selectedCourse) {
      this.message = 'Selecciona un curso para guardar cambios.';
      return;
    }

    this.updateCourse(this.selectedCourse);
  }

  deleteSelectedCourse() {
    if (!this.selectedCourse) {
      this.message = 'Selecciona un curso para eliminar.';
      return;
    }

    this.deleteCourse(this.selectedCourse.id);
    this.selectedCourse = null;
    this.selectedCourseId = 0;
  }

  assignSelectedCourseToLesson() {
    if (!this.selectedCourse) {
      this.message = 'Selecciona un curso para crear la leccion.';
      return;
    }

    this.lessonForm.courseId = this.selectedCourse.id;
    this.message = `Curso seleccionado para lecciones: ${this.selectedCourse.title} (ID ${this.selectedCourse.id}).`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  selectKitForEdit() {
    const found = this.kits.find((item) => item.id === Number(this.selectedKitId));
    this.selectedKit = found
      ? {
          ...found,
          price: Number(found.price),
          stock: Number(found.stock)
        }
      : null;
  }

  saveSelectedKit() {
    if (!this.selectedKit) {
      this.message = 'Selecciona un kit para guardar cambios.';
      return;
    }

    this.updateKit(this.selectedKit);
  }

  deleteSelectedKit() {
    if (!this.selectedKit) {
      this.message = 'Selecciona un kit para eliminar.';
      return;
    }

    this.deleteKit(this.selectedKit.id);
    this.selectedKit = null;
    this.selectedKitId = 0;
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
