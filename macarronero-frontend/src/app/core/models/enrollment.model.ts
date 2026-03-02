// Modelo de datos para inscripciones a cursos.
export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  title?: string;
  level?: string;
  created_at?: string;
}
