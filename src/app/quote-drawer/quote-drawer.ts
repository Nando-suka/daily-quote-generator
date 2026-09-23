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
    // React to the drawer opening — the component is created once with
    // isOpen=false, so ngOnInit alone never fetches data.
    effect(() => {
      if (this.isOpen()) {
        this.lockScroll();
        if (this.quotes().length === 0 && !this.loading() && !this.error()) {
          void this.loadPage(this.currentPage());
        }
        // Move focus into the dialog for keyboard and screen reader users.
        queueMicrotask(() => this.closeButtonRef()?.nativeElement.focus());
      } else {
        this.unlockScroll();
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
    }
  }

  async loadPage(page: number): Promise<void> {
    if (this.loading()) return;
    const requested = Math.floor(page);
    if (!Number.isFinite(requested) || requested < 1) return;
    // Allow the first fetch when totalPages is still unknown (0).
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

  private lockScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
  }
}
