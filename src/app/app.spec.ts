import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { SUPABASE_CONFIG } from './core/supabase.config';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
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

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render hero title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Find a thoughtful quote');
  });
});
