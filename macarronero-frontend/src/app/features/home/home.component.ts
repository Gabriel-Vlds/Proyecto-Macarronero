// Vista principal con hero y secciones destacadas.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CoursesService } from '../../core/services/courses.service';
import { KitsService } from '../../core/services/kits.service';
import { Course } from '../../core/models/course.model';
import { Kit } from '../../core/models/kit.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  courses: Course[] = [];
  kits: Kit[] = [];
  loading = true;

  constructor(
    private readonly coursesService: CoursesService,
    private readonly kitsService: KitsService
  ) {}

  ngOnInit() {
    Promise.all([
      firstValueFrom(this.coursesService.list()),
      firstValueFrom(this.kitsService.list())
    ])
      .then(([courses, kits]) => {
        this.courses = (courses || []).slice(0, 3);
        this.kits = (kits || []).slice(0, 3);
      })
      .finally(() => {
        this.loading = false;
      });
  }
}

