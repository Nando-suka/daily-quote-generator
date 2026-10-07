import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Quote } from '../../core/quote.model';

/**
 * Presentational quote card + action row.
 * All data fetching and sharing logic lives in the parent page;
 * this component only renders state and forwards user intent.
 */
@Component({
  selector: 'app-quote-card',
  templateUrl: './quote-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteCardComponent {
  quote = input<Quote | null>(null);
  loading = input(false);
  error = input<string | null>(null);
  copied = input(false);
  linkCopied = input(false);
  showNewQuote = input(true);

  retry = output<void>();
  newQuote = output<void>();
  copy = output<void>();
  copyLink = output<void>();
  shareX = output<void>();
  shareLinkedIn = output<void>();
  shareFacebook = output<void>();
}
