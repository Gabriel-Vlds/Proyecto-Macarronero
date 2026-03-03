// Modelo de datos para cursos y lecciones.
export interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  tier: 'basic' | 'premium';
  level: 'beginner' | 'intermediate' | 'advanced';
  cover_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Lesson {
  id: number;
  title: string;
  content: string;
  video_url?: string | null;
  mux_playback_id?: string | null;
  mux_status?: 'ready' | 'preparing' | 'errored' | 'unknown' | null;
  order_index: number;
  duration_min?: number | null;
}
