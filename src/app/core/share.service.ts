import { Injectable } from '@angular/core';
import type { Quote } from './quote.model';

/**
 * Centralises all quote sharing logic so every page builds
 * identical share text and identical permalinks.
 *
 * A permalink always points at the shareable route:
 * `${origin}/quote/:id`
 */
@Injectable({ providedIn: 'root' })
export class ShareService {
  /** Human-readable `"<content>" — <author>` text used for copy and X. */
  buildQuoteText(quote: Quote): string {
    return `"${quote.content}" — ${quote.author}`;
  }

  /** Absolute URL of the shareable quote page. */
  getQuoteUrl(quoteId: number, origin = window.location.origin): string {
    return `${origin}/quote/${quoteId}`;
  }

  /** X / Twitter intent URL for a quote. */
  buildTweetIntent(quote: Quote): string {
    const tweetText = encodeURIComponent(`${this.buildQuoteText(quote)}\n\n#DailyQuote #Motivation`);
    return `https://x.com/intent/post?text=${tweetText}`;
  }

  /** LinkedIn share URL pointing at the quote permalink. */
  buildLinkedInIntent(quoteUrl: string): string {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(quoteUrl)}`;
  }

  /** Facebook share URL pointing at the quote permalink. */
  buildFacebookIntent(quoteUrl: string): string {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quoteUrl)}`;
  }

  /** Copies text, with a fallback for insecure contexts. */
  async copyText(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  /** Opens a share URL without giving the new page access to window.opener. */
  openShareWindow(url: string): Window | null {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) win.opener = null;
    return win;
  }
}
