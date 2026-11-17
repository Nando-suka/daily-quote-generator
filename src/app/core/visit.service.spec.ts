import { TestBed } from '@angular/core/testing';
import { VISIT_STORAGE_KEY, VisitService } from './visit.service';

/**
 * The Angular test runner's DOM shim has no `localStorage` (opaque origin),
 * so specs install their own in-memory implementation.
 */
function installFakeStorage(): void {
  const entries = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return entries.size;
    },
    key: (index: number) => Array.from(entries.keys())[index] ?? null,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, String(value));
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
    clear: () => {
      entries.clear();
    },
  };

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  });
}

describe('VisitService', () => {
  beforeEach(() => {
    installFakeStorage();
    window.localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createService(): VisitService {
    TestBed.configureTestingModule({});
    return TestBed.inject(VisitService);
  }

  it('treats the first visit as first and persists the count', () => {
    const service = createService();

    expect(service.visitCount()).toBe(1);
    expect(service.isFirstVisit()).toBe(true);
    expect(window.localStorage.getItem(VISIT_STORAGE_KEY)).toBe('1');
  });

  it('treats a stored count as a return visit', () => {
    window.localStorage.setItem(VISIT_STORAGE_KEY, '3');

    const service = createService();

    expect(service.visitCount()).toBe(4);
    expect(service.isFirstVisit()).toBe(false);
    expect(window.localStorage.getItem(VISIT_STORAGE_KEY)).toBe('4');
  });

  it('counts consecutive loads as return visits', () => {
    const first = createService();
    expect(first.isFirstVisit()).toBe(true);

    TestBed.resetTestingModule();
    const second = createService();

    expect(second.visitCount()).toBe(2);
    expect(second.isFirstVisit()).toBe(false);
  });

  it('ignores corrupted stored values', () => {
    window.localStorage.setItem(VISIT_STORAGE_KEY, 'not-a-number');

    const service = createService();

    expect(service.visitCount()).toBe(1);
    expect(service.isFirstVisit()).toBe(true);
  });

  it('ignores negative stored values', () => {
    window.localStorage.setItem(VISIT_STORAGE_KEY, '-5');

    const service = createService();

    expect(service.visitCount()).toBe(1);
  });

  it('falls back to a first visit when storage is unavailable', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('storage blocked');
      },
    });

    const service = createService();

    expect(service.visitCount()).toBe(1);
    expect(service.isFirstVisit()).toBe(true);
  });
});
