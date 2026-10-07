import { TestBed } from '@angular/core/testing';
import { QuoteCardComponent } from './quote-card';

describe('QuoteCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteCardComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(QuoteCardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the quote text and author', () => {
    const fixture = TestBed.createComponent(QuoteCardComponent);
    fixture.componentRef.setInput('quote', {
      id: 7,
      content: 'Stay curious.',
      author: 'Ada',
      category: 'mindset',
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="quote-text"]')?.textContent).toContain('Stay curious.');
    expect(el.querySelector('[data-testid="quote-author"]')?.textContent).toContain('Ada');
  });

  it('should emit copy when the copy button is clicked', () => {
    const fixture = TestBed.createComponent(QuoteCardComponent);
    fixture.componentRef.setInput('quote', {
      id: 1,
      content: 'Hi.',
      author: 'A',
      category: null,
    });
    fixture.detectChanges();

    const emitted: unknown[] = [];
    fixture.componentInstance.copy.subscribe(() => emitted.push(true));
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="copy-btn"]')
      ?.click();

    expect(emitted).toHaveLength(1);
  });

  it('should render the error state with a retry button', () => {
    const fixture = TestBed.createComponent(QuoteCardComponent);
    fixture.componentRef.setInput('error', 'Something went wrong.');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="quote-error"]')?.textContent).toContain(
      'Something went wrong.',
    );
    expect(el.querySelector('[data-testid="retry-btn"]')).toBeTruthy();
  });
});
