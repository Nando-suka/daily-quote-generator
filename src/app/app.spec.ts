import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { SUPABASE_CONFIG } from './core/supabase.config';

describe('App (shell)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: SUPABASE_CONFIG,
          useValue: {
            production: false,
            supabaseUrl: 'https://test.supabase.co',
            supabaseAnonKey: 'test-anon-key',
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the header with a home link', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo-text')?.textContent).toContain('Daily Quote');
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
