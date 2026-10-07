import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import type { Quote } from '../../core/quote.model';
import { SupabaseService } from '../../core/supabase.service';
import { ShareService } from '../../core/share.service';
import { QuoteCardComponent } from '../../shared/quote-card/quote-card';
import { QuoteDrawerComponent } from '../../quote-drawer/quote-drawer';
import { environment } from '../../../environments/environment';

/**
 * Shareable quote page at `/quote/:id`.
 * Loads one quote by ID, updates SEO tags, and offers the same
 * copy / share actions as the home page plus a permalink button.
 */
@Component({
  selector: 'app-quote-detail-page',
  imports: [QuoteCardComponent, QuoteDrawerComponent, RouterLink],
  templateUrl: './quote-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteDetailComponent implements OnInit, OnDestroy {
  /** Route param `id` — bound automatically via withComponentInputBinding(). */
  id = input<string | number | undefined>(undefined);

  quote = signal<Quote | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  copied = signal(false);
  linkCopied = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  drawerOpen = signal(false);

  private copiedTimer: ReturnType<typeof setTimeout> | undefined;
  private linkCopiedTimer: ReturnType<typeof setTimeout> | undefined;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly supabase = inject(SupabaseService);
  private readonly share = inject(ShareService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    void this.loadQuote();
  }

  ngOnDestroy(): void {
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    if (this.linkCopiedTimer) clearTimeout(this.linkCopiedTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  async loadQuote(): Promise<void> {
    const rawId = Number(this.id());
    if (!Number.isFinite(rawId) || rawId < 1) {
      this.loading.set(false);
      this.error.set('That quote link looks invalid. Head home for a fresh quote.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const q = await this.supabase.getQuoteById(rawId);
      if (!q) {
        this.error.set(`Quote #${rawId} does not exist (it may have been removed).`);
        this.quote.set(null);
        return;
      }
      this.quote.set(q);
      this.updateSeoTags(q);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!environment.production) console.error('[QuoteDetail] Failed to load quote:', err);
      this.error.set(
        msg.includes('Supabase connection not configured')
          ? 'The quote library is not connected yet. Add your Supabase credentials, then refresh.'
          : 'Could not load this quote. Please check your connection and try again.',
      );
    } finally {
      this.loading.set(false);
    }
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
    } catch {
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
    } catch {
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

  newRandomQuote(): void {
    void this.router.navigate(['/']);
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  onQuoteSelected(quote: Quote): void {
    void this.router.navigate(['/quote', quote.id]);
  }

  private updateSeoTags(q: Quote): void {
    const pageTitle = `"${q.content}" — ${q.author} | Daily Quote`;
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageTitle });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:url', content: this.share.getQuoteUrl(q.id) });
  }

  private showToastMsg(message: string, duration = 2500): void {
    this.toastMessage.set(message);
    this.showToast.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast.set(false), duration);
  }
}
