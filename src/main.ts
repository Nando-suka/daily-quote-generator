import { bootstrapApplication } from '@angular/platform-browser';
import { provideClientHydration } from '@angular/platform-browser';
import { provideProfiling } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, provideProfiling('performance', provideClientHydration(), appConfig)).catch(
  (err) => console.error(err),
);
