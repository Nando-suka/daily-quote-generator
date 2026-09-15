import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';
import { SUPABASE_CONFIG } from './supabase.config';

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockSingle = vi.fn();

const mockClient = {
  from: mockFrom,
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

const configuredProvider = {
  provide: SUPABASE_CONFIG,
  useValue: {
    production: false,
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key',
  },
};

const unconfiguredProvider = {
  provide: SUPABASE_CONFIG,
  useValue: {
    production: false,
    supabaseUrl: 'YOUR_SUPABASE_URL',
    supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  },
};

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockFrom.mockReset();
    mockSelect.mockReset();
    mockOrder.mockReset();
    mockRange.mockReset();
    mockSingle.mockReset();

    TestBed.configureTestingModule({
      providers: [configuredProvider],
    });
    service = TestBed.inject(SupabaseService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isReady', () => {
    it('should return true when credentials are configured', () => {
      expect(service.isReady()).toBe(true);
    });
  });

  describe('getCount', () => {
    it('should return the count from Supabase', async () => {
      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ count: 20, error: null });

      const count = await service.getCount();

      expect(count).toBe(20);
      expect(mockFrom).toHaveBeenCalledWith('quotes');
    });

    it('should return cached count within TTL', async () => {
      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ count: 20, error: null });

      const first = await service.getCount();
      const second = await service.getCount();

      expect(first).toBe(20);
      expect(second).toBe(20);
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('should fetch fresh count after TTL expires', async () => {
      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ count: 20, error: null });

      await service.getCount();

      vi.advanceTimersByTime(61_000);

      mockSelect.mockReturnValue({ count: 25, error: null });
      const result = await service.getCount();

      expect(result).toBe(25);
      expect(mockFrom).toHaveBeenCalledTimes(2);
    });

    it('should throw when Supabase returns an error', async () => {
      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ count: null, error: new Error('connection failed') });

      await expect(service.getCount()).rejects.toThrow('connection failed');
    });
  });

  describe('clearCountCache', () => {
    it('should force a fresh fetch on next getCount', async () => {
      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ count: 20, error: null });

      await service.getCount();
      service.clearCountCache();

      mockSelect.mockReturnValue({ count: 30, error: null });
      const result = await service.getCount();

      expect(result).toBe(30);
      expect(mockFrom).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRandomQuote', () => {
    function setupQuoteFetch(data: unknown, error: unknown, count = 10) {
      const countSelect = vi.fn().mockReturnValue({ count, error: null });
      mockFrom.mockImplementationOnce(() => ({ select: countSelect }));

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ order: mockOrder });
      mockOrder.mockReturnValue({ range: mockRange });
      mockRange.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data, error });
    }

    it('should return a validated quote', async () => {
      setupQuoteFetch(
        {
          id: 1,
          content: 'Test quote content.',
          author: 'Test Author',
          category: 'test',
        },
        null,
      );

      const quote = await service.getRandomQuote();

      expect(quote.id).toBe(1);
      expect(quote.content).toBe('Test quote content.');
      expect(quote.author).toBe('Test Author');
      expect(quote.category).toBe('test');
    });

    it('should transform null author to "Unknown"', async () => {
      setupQuoteFetch(
        {
          id: 2,
          content: 'Quote with no author.',
          author: null,
          category: null,
        },
        null,
      );

      const quote = await service.getRandomQuote();

      expect(quote.author).toBe('Unknown');
    });

    it('should retry once on PGRST116 error', async () => {
      const countSelect = vi.fn().mockReturnValue({ count: 10, error: null });
      mockFrom
        .mockImplementationOnce(() => ({ select: countSelect }))
        .mockImplementationOnce(() => ({ select: mockSelect }))
        .mockImplementationOnce(() => ({ select: countSelect }));

      mockSelect.mockReturnValue({ order: mockOrder });
      mockOrder.mockReturnValue({ range: mockRange });
      mockRange.mockReturnValue({ single: mockSingle });
      mockFrom.mockReturnValue({ select: mockSelect });

      mockSingle
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({
          data: {
            id: 3,
            content: 'Retry succeeded.',
            author: 'Author',
            category: null,
          },
          error: null,
        });

      const quote = await service.getRandomQuote();

      expect(quote.id).toBe(3);
      expect(quote.content).toBe('Retry succeeded.');
    });

    it('should throw on non-PGRST116 errors without retrying', async () => {
      const countSelect = vi.fn().mockReturnValue({ count: 10, error: null });
      mockFrom.mockImplementationOnce(() => ({ select: countSelect }));

      setupQuoteFetch(null, { code: '42P01', message: 'relation does not exist' });

      await expect(service.getRandomQuote()).rejects.toThrow();
    });

    it('should throw when count is zero', async () => {
      setupQuoteFetch(null, null, 0);

      await expect(service.getRandomQuote()).rejects.toThrow('No quotes found');
    });

    it('should throw on Zod validation failure', async () => {
      setupQuoteFetch(
        {
          id: 'not-a-number',
          content: '',
        },
        null,
      );

      await expect(service.getRandomQuote()).rejects.toThrow('Quote validation failed');
    });
  });
});

describe('SupabaseService (not configured)', () => {
  let service: SupabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [unconfiguredProvider],
    });
    service = TestBed.inject(SupabaseService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should report not ready when credentials are placeholders', () => {
    expect(service.isReady()).toBe(false);
  });

  it('should throw when getRandomQuote is called without configuration', async () => {
    await expect(service.getRandomQuote()).rejects.toThrow('Supabase connection not configured');
  });

  it('should throw when getCount is called without configuration', async () => {
    await expect(service.getCount()).rejects.toThrow('Supabase connection not configured');
  });
});
