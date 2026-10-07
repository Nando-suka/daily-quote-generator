import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home';
import { SUPABASE_CONFIG } from '../../core/supabase.config';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        {
          provide: SUPABASE_CONFIG,
          useValue: {
            production: false,
            supabaseUrl: 'YOUR_SUPABASE_URL',
            supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
          },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render hero title', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Find a thoughtful quote');
  });

  it('should have openDrawer and closeDrawer methods', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    expect(fixture.componentInstance.drawerOpen()).toBe(false);

    fixture.componentInstance.openDrawer();
    expect(fixture.componentInstance.drawerOpen()).toBe(true);

    fixture.componentInstance.closeDrawer();
    expect(fixture.componentInstance.drawerOpen()).toBe(false);
  });

  it('should set the selected category', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    // Stub out the network fetch so the test stays offline.
    vi.spyOn(component, 'fetchRandomQuote').mockResolvedValue(undefined);

    await component.selectCategory('work');

    expect(component.selectedCategory()).toBe('work');
  });
});
