import type { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { QuoteDetailComponent } from './pages/quote-detail/quote-detail';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Daily Quote Generator' },
  { path: 'quote/:id', component: QuoteDetailComponent, title: 'Quote | Daily Quote Generator' },
  { path: '**', redirectTo: '' },
];
