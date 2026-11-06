import { ErrorHandler, Service } from '@angular/core';

@Service()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    console.error('[GlobalErrorHandler]', message);

    if (stack) {
      console.error('[GlobalErrorHandler] Stack:', stack);
    }

    if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (e: unknown) => void } }).Sentry) {
      (window as unknown as { Sentry: { captureException: (e: unknown) => void } }).Sentry.captureException(error);
    }
  }
}
