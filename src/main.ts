import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

bootstrapApplication(App, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(),
    ...appConfig.providers,
  ],
}).catch((err) => console.error(err));

if ('serviceWorker' in navigator && environment.production) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PWA] Service worker registration failed:', err);
    });
  });
}
