// Modelo de datos para suscripciones de usuario.
export interface Subscription {
  id: number;
  user_id?: number;
  plan: 'normal' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  created_at?: string;
  updated_at?: string;
  premiumSelection?: PremiumSelection | null;
}

export interface PremiumSelection {
  course_id: number;
  title: string;
  level: string;
  cover_url?: string | null;
}
