import { InjectionToken } from '@angular/core';

export interface SupabaseConfig {
  production: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const SUPABASE_CONFIG = new InjectionToken<SupabaseConfig>('SUPABASE_CONFIG');
