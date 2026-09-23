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

  it('should have openDrawer and closeDrawer methods', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(fixture.componentInstance.drawerOpen()).toBe(false);

    fixture.componentInstance.openDrawer();
    expect(fixture.componentInstance.drawerOpen()).toBe(true);

    fixture.componentInstance.closeDrawer();
    expect(fixture.componentInstance.drawerOpen()).toBe(false);
  });

  it('should load quote into main view from drawer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const quote = { id: 5, content: 'Selected quote.', author: 'Author', category: 'life' };
    fixture.componentInstance.onQuoteSelected(quote);

    expect(fixture.componentInstance.quote()?.id).toBe(5);
    expect(fixture.componentInstance.quote()?.content).toBe('Selected quote.');
  });
});
