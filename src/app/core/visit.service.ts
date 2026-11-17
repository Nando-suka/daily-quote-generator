import { Service, computed, signal } from '@angular/core';

export const VISIT_STORAGE_KEY = 'dqg.visit-count.v1';

/**
 * Storage is resolved from the DOM `window`, never from the global scope.
 * Node exposes an experimental `localStorage` global that is undefined unless
 * started with a storage file, and preferring it would silently disable the
 * visit counter in tests and non-browser tooling.
 */
function getStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : (window.localStorage ?? null);
  } catch {
    return null;
  }
}

function readVisitCount(storage: Storage | null): number {
  if (!storage) return 0;
  try {
    const raw = storage.getItem(VISIT_STORAGE_KEY);
    const parsed = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeVisitCount(storage: Storage | null, count: number): void {
  if (!storage) return;
  try {
    storage.setItem(VISIT_STORAGE_KEY, String(count));
  } catch {
    // Storage can be unavailable (private mode, disabled cookies, quota).
    // Visit history is a nice-to-have, so failing to persist is not an error.
  }
}

/**
 * Tracks how many times the landing page has been opened in this browser.
 *
 * The home page uses this to keep the first visit's introductory copy and to
 * drop it on later visits, where the quote itself should dominate the fold.
 * Falls back to "first visit" whenever storage is unavailable, so the intro
 * is never hidden from a user who cannot be recognised.
 */
@Service()
export class VisitService {
  private readonly storage = getStorage();
  private readonly visits = signal(readVisitCount(this.storage) + 1);

  readonly visitCount = this.visits.asReadonly();
  readonly isFirstVisit = computed(() => this.visits() === 1);

  constructor() {
    writeVisitCount(this.storage, this.visits());
  }
}
