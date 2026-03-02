// Modelo de datos para compras de kits.
export interface Purchase {
  id: number;
  user_id: number;
  kit_id: number;
  quantity: number;
  total_price: number;
  name?: string;
  created_at?: string;
}
