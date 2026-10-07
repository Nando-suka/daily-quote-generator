import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuoteDetailComponent } from './quote-detail';
import { SUPABASE_CONFIG } from '../../core/supabase.config';
import { SupabaseService } from '../../core/supabase.service';

describe('QuoteDetailComponent', () => {
  const configuredProvider = {
    provide: SUPABASE_CONFIG,
    useValue: {
      production: false,
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-anon-key',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteDetailComponent],
      providers: [provideRouter([]), configuredProvider],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(QuoteDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show an error for an invalid id', async () => {
    const fixture = TestBed.createComponent(QuoteDetailComponent);
    fixture.componentRef.setInput('id', 'not-a-number');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toContain('invalid');
  });

  it('should load a quote by id and render it', async () => {
    const service = TestBed.inject(SupabaseService);
    vi.spyOn(service, 'getQuoteById').mockResolvedValue({
      id: 7,
      content: 'Stay curious.',
      author: 'Ada',
      category: 'mindset',
    });

    const fixture = TestBed.createComponent(QuoteDetailComponent);
    fixture.componentRef.setInput('id', '7');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.quote()?.id).toBe(7);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="quote-text"]')?.textContent).toContain('Stay curious.');
  });

  it('should show a not-found error when the quote does not exist', async () => {
    const service = TestBed.inject(SupabaseService);
    vi.spyOn(service, 'getQuoteById').mockResolvedValue(null);

    const fixture = TestBed.createComponent(QuoteDetailComponent);
    fixture.componentRef.setInput('id', '999');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.error()).toContain('does not exist');
  });
});
