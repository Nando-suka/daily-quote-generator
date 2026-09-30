import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Quote } from '../core/quote.model';
import { SupabaseService } from '../core/supabase.service';

const PAGE_SIZE = 5;
const MAX_PAGE_BUTTONS = 5;

@Component({
  selector: 'app-quote-drawer',
  templateUrl: './quote-drawer.html',
  styleUrl: './quote-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteDrawerComponent implements OnDestroy {
  isOpen = input.required<boolean>();
  quoteSelected = output<Quote>();
  close = output<void>();

  quotes = signal<Quote[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(0);
  totalQuotes = signal(0);

  private readonly closeButtonRef = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly drawerRef = viewChild<ElementRef<HTMLElement>>('dialog');
  private previouslyFocusedElement: HTMLElement | null = null;

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total === 0) return [];

    const maxButtons = Math.min(MAX_PAGE_BUTTONS, total);
    let start = Math.max(1, current - Math.floor(maxButtons / 2));
    const end = Math.min(total, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  constructor(private readonly supabase: SupabaseService) {
    effect(() => {
      if (this.isOpen()) {
        this.previouslyFocusedElement = document.activeElement as HTMLElement | null;
        this.lockScroll();
        if (this.quotes().length === 0 && !this.loading() && !this.error()) {
          void this.loadPage(this.currentPage());
        }
        queueMicrotask(() => this.closeButtonRef()?.nativeElement.focus());
      } else {
        this.unlockScroll();
        this.restoreFocus();
      }
    });
  }

  ngOnDestroy(): void {
    this.unlockScroll();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.close.emit();
      return;
    }

    if (event.key === 'Tab' && this.isOpen()) {
      this.trapFocus(event);
    }
  }

  async loadPage(page: number): Promise<void> {
    if (this.loading()) return;
    const requested = Math.floor(page);
    if (!Number.isFinite(requested) || requested < 1) return;
    if (this.totalPages() > 0 && requested > this.totalPages()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await this.supabase.getQuotesPaginated(requested, PAGE_SIZE);
      this.quotes.set(result.quotes);
      this.currentPage.set(result.page);
      this.totalPages.set(result.totalPages);
      this.totalQuotes.set(result.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.error.set(`Could not load quotes: ${msg}`);
    } finally {
      this.loading.set(false);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onQuoteClick(quote: Quote): void {
    this.quoteSelected.emit(quote);
    this.close.emit();
  }

  private trapFocus(event: KeyboardEvent): void {
    const drawer = this.drawerRef()?.nativeElement;
    if (!drawer) return;

    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0]!;
    const lastElement = focusableElements[focusableElements.length - 1]!;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  private restoreFocus(): void {
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  private lockScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
  }
}
