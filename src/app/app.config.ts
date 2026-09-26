import { ApplicationConfig, provideBrowserGlobalErrorProviders, provideAppInitializer } from '@angular/core';
import { SUPABASE_CONFIG } from './core/supabase.config';
import { SupabaseService } from './core/supabase.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorProviders(),
    provideAppInitializer(async (injector) => {
      const supabase = injector.get(SupabaseService);
      if (!supabase.isReady()) {
        console.warn('[App] Supabase is not configured. The app will operate in offline mode.');
      }
    }),
    { provide: SUPABASE_CONFIG, useValue: environment },
  ],
};
