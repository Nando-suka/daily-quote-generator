import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { SUPABASE_CONFIG } from './core/supabase.config';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: SUPABASE_CONFIG, useValue: environment },
  ],
};
