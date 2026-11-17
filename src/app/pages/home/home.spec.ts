import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home';
import { SUPABASE_CONFIG } from '../../core/supabase.config';

describe('HomeComponent', () => {
  /** The Angular test runner's DOM shim has no `localStorage`. */
  function installFakeStorage(): void {
    const entries = new Map<string, string>();
    const storage: Storage = {
      get length() {
        return entries.size;
      },
      key: (index: number) => Array.from(entries.keys())[index] ?? null,
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => {
        entries.set(key, String(value));
      },
      removeItem: (key: string) => {
        entries.delete(key);
      },
      clear: () => {
        entries.clear();
      },
    };

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: storage,
    });
  }

  beforeEach(async () => {
    installFakeStorage();
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

  it('should show the intro copy on the first visit', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.hero-subtitle')).toBeTruthy();
    expect(compiled.querySelector('.helper-pills')).toBeTruthy();
  });

  it('should drop the intro copy on return visits', () => {
    window.localStorage.setItem('dqg.visit-count.v1', '1');

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')).toBeTruthy();
    expect(compiled.querySelector('.hero-subtitle')).toBeNull();
    expect(compiled.querySelector('.helper-pills')).toBeNull();
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
