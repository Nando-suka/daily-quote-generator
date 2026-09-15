import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Quote } from './core/quote.model';
import { SupabaseService } from './core/supabase.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit, OnDestroy {
  quote = signal<Quote | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  copied = signal(false);
  totalQuotes = signal(0);
  showToast = signal(false);
  toastMessage = signal('');
  today = signal(this.formatDate(new Date()));

  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly supabase: SupabaseService) {}

  ngOnInit(): void {
    // Fire in parallel; count is cached so second getCount is cheap
    void this.fetchTotalCount();
    void this.fetchRandomQuote();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
  }

  async fetchRandomQuote(): Promise<void> {
    if (this.loading()) return; // guard against rapid clicks / parallel fetches
    this.loading.set(true);
    this.error.set(null);

    try {
      const q = await this.supabase.getRandomQuote();
      this.quote.set(q);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!environment.production) {
        console.error('[App] Failed to fetch quote:', err);
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

  async copyToClipboard(): Promise<void> {
    const q = this.quote();
    if (!q) return;

    const text = `"${q.content}" — ${q.author}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for insecure contexts — uses deprecated execCommand as last resort
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.copied.set(true);
      this.showToastMsg('Quote copied to clipboard ✓');
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.copied.set(false), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!environment.production) {
        console.error('[App] Clipboard error:', msg);
      }
      this.showToastMsg('Copy failed — please try manually.');
    }
  }

  shareOnTwitter(): void {
    const q = this.quote();
    if (!q) return;
    const tweetText = encodeURIComponent(`"${q.content}" — ${q.author}\n\n#DailyQuote #Motivation`);
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}`,
      '_blank',
      'noopener,noreferrer',
    );
    this.showToastMsg('Shared to Twitter/X ✓');
  }

  shareOnLinkedIn(): void {
    const q = this.quote();
    if (!q) return;
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank',
      'noopener,noreferrer',
    );
    this.showToastMsg('Shared to LinkedIn ✓');
  }

  shareOnFacebook(): void {
    const q = this.quote();
    if (!q) return;
    const fbUrl = encodeURIComponent(window.location.href);
    // Note: Facebook sharer quote param is deprecated; URL is primary
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${fbUrl}`,
      '_blank',
      'noopener,noreferrer',
    );
    this.showToastMsg('Shared to Facebook ✓');
  }

  private async fetchTotalCount(): Promise<void> {
    try {
      const count = await this.supabase.getCount();
      this.totalQuotes.set(count ?? 0);
    } catch (err) {
      if (!environment.production) {
        console.warn('[App] Could not fetch total count:', err);
      }
    }
  }

  private showToastMsg(message: string, duration = 2500): void {
    this.toastMessage.set(message);
    this.showToast.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.showToast.set(false), duration);
  }

  private formatDate(date: Date): string {
    // Use user's locale by default; fall back to en-GB for consistency
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    const metaKey = isMac ? event.metaKey : event.ctrlKey;
    const key = event.key.toLowerCase();

    if (metaKey && key === 'c' && this.quote() && !this.loading()) {
      event.preventDefault();
      void this.copyToClipboard();
    }
    if (metaKey && event.altKey && key === 't' && this.quote()) {
      event.preventDefault();
      this.shareOnTwitter();
    }
    if (metaKey && event.altKey && key === 'l' && this.quote()) {
      event.preventDefault();
      this.shareOnLinkedIn();
    }
    if (metaKey && event.altKey && key === 'f' && this.quote()) {
      event.preventDefault();
      this.shareOnFacebook();
    }
  }
}
