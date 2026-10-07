import { ApplicationConfig, ErrorHandler, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { SUPABASE_CONFIG } from './core/supabase.config';
import { SupabaseService } from './core/supabase.service';
import { GlobalErrorHandler } from './core/error-handler';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAppInitializer(async () => {
      const supabase = inject(SupabaseService);
      if (!supabase.isReady()) {
        console.warn('[App] Supabase is not configured. The app will operate in offline mode.');
      }
    }),
    { provide: SUPABASE_CONFIG, useValue: environment },
  ],
};
