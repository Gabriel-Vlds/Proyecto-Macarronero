// Modelo de datos para kits.
export interface Kit {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}
