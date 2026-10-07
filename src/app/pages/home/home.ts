import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Quote } from '../../core/quote.model';
import { SupabaseService } from '../../core/supabase.service';
import { ShareService } from '../../core/share.service';
import { QuoteCardComponent } from '../../shared/quote-card/quote-card';
import { QuoteDrawerComponent } from '../../quote-drawer/quote-drawer';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home-page',
  imports: [QuoteCardComponent, QuoteDrawerComponent, RouterLink],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  quote = signal<Quote | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  copied = signal(false);
  linkCopied = signal(false);
  totalQuotes = signal(0);
  showToast = signal(false);
  toastMessage = signal('');
  today = signal(this.formatDate(new Date()));
  drawerOpen = signal(false);
  categories = signal<string[]>([]);
  selectedCategory = signal<string | null>(null);

  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;
  private linkCopiedTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly share: ShareService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    void this.fetchTotalCount();
    void this.fetchRandomQuote();
    void this.fetchCategories();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    if (this.linkCopiedTimer) clearTimeout(this.linkCopiedTimer);
  }

  async fetchRandomQuote(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    try {
      const category = this.selectedCategory();
      const q = category
        ? await this.supabase.getRandomQuoteByCategory(category)
        : await this.supabase.getRandomQuote();
      this.quote.set(q);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!environment.production) {
        console.error('[Home] Failed to fetch quote:', err);
      }
      if (msg.includes('Supabase connection not configured')) {
        this.error.set(
          'The quote library is not connected yet. Add your Supabase URL and anonymous key in src/environments/environment.ts, then refresh the page.',
        );
      } else {
        this.error.set('Could not load a quote. Please check your connection and try again.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async selectCategory(category: string | null): Promise<void> {
    this.selectedCategory.set(category);
    await this.fetchRandomQuote();
  }

  async copyToClipboard(): Promise<void> {
    const q = this.quote();
    if (!q) return;
    try {
      await this.share.copyText(this.share.buildQuoteText(q));
      this.copied.set(true);
      this.showToastMsg('Quote copied to clipboard ✓');
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.copied.set(false), 2500);
    } catch (err: unknown) {
      if (!environment.production) console.error('[Home] Clipboard error:', err);
      this.showToastMsg('Copy failed — please try manually.');
    }
  }

  async copyPermalink(): Promise<void> {
    const q = this.quote();
    if (!q) return;
    try {
      await this.share.copyText(this.share.getQuoteUrl(q.id));
      this.linkCopied.set(true);
      this.showToastMsg('Shareable link copied ✓');
      if (this.linkCopiedTimer) clearTimeout(this.linkCopiedTimer);
      this.linkCopiedTimer = setTimeout(() => this.linkCopied.set(false), 2500);
    } catch (err: unknown) {
      if (!environment.production) console.error('[Home] Link copy error:', err);
      this.showToastMsg('Copy failed — please try manually.');
    }
  }

  shareOnTwitter(): void {
    const q = this.quote();
    if (!q) return;
    this.share.openShareWindow(this.share.buildTweetIntent(q));
    this.showToastMsg('Shared to X ✓');
  }

  shareOnLinkedIn(): void {
    const q = this.quote();
    if (!q) return;
    this.share.openShareWindow(this.share.buildLinkedInIntent(this.share.getQuoteUrl(q.id)));
    this.showToastMsg('Shared to LinkedIn ✓');
  }

  shareOnFacebook(): void {
    const q = this.quote();
    if (!q) return;
    this.share.openShareWindow(this.share.buildFacebookIntent(this.share.getQuoteUrl(q.id)));
    this.showToastMsg('Shared to Facebook ✓');
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  /** Drawer selection navigates to the shareable permalink. */
  onQuoteSelected(quote: Quote): void {
    void this.router.navigate(['/quote', quote.id]);
  }

  viewPermalink(): void {
    const q = this.quote();
    if (!q) return;
    void this.router.navigate(['/quote', q.id]);
  }

  private async fetchTotalCount(): Promise<void> {
    try {
      this.totalQuotes.set((await this.supabase.getCount()) ?? 0);
    } catch (err) {
      if (!environment.production) console.warn('[Home] Could not fetch total count:', err);
    }
  }

  private async fetchCategories(): Promise<void> {
    try {
      this.categories.set(await this.supabase.getCategories());
    } catch (err) {
      if (!environment.production) console.warn('[Home] Could not fetch categories:', err);
    }
  }

  private showToastMsg(message: string, duration = 2500): void {
    this.toastMessage.set(message);
    this.showToast.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast.set(false), duration);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();

    if (key === 'escape' && this.drawerOpen()) {
      event.preventDefault();
      this.closeDrawer();
      return;
    }

    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      return;
    }

    const mod = event.metaKey || event.ctrlKey;
    if (!mod || !event.altKey || !this.quote()) return;

    if (key === 't') {
      event.preventDefault();
      this.shareOnTwitter();
    } else if (key === 'l') {
      event.preventDefault();
      this.shareOnLinkedIn();
    } else if (key === 'f') {
      event.preventDefault();
      this.shareOnFacebook();
    }
  }
}
