import { Inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Quote, QuoteSchema } from './quote.model';
import { SUPABASE_CONFIG, SupabaseConfig } from './supabase.config';

export interface PaginatedQuotes {
  quotes: Quote[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly client: SupabaseClient | null;
  private readonly isConfigured: boolean;
  private readonly table = 'quotes';

  /** Simple in-memory cache for count to avoid double queries on boot */
  private countCache: { value: number; expiresAt: number } | null = null;
  private countRequest: Promise<number> | null = null;
  private static readonly COUNT_TTL_MS = 60_000;
  private static readonly MAX_PAGE_SIZE = 100;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 1000;

  constructor(@Inject(SUPABASE_CONFIG) private readonly config: SupabaseConfig) {
    this.isConfigured = Boolean(
      config.supabaseUrl &&
      config.supabaseUrl !== 'YOUR_SUPABASE_URL' &&
      config.supabaseAnonKey &&
      config.supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY',
    );

    this.client = this.isConfigured
      ? createClient(config.supabaseUrl, config.supabaseAnonKey)
      : null;
  }

  /** Whether Supabase credentials have been provided. */
  isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /** Fetches the total number of quotes, with short-lived cache. */
  async getCount(): Promise<number> {
    if (!this.client) {
      throw new Error('Supabase connection not configured.');
    }

    if (this.countCache && Date.now() < this.countCache.expiresAt) {
      return this.countCache.value;
    }

    // Share the in-flight request so parallel callers on boot only query once.
    if (!this.countRequest) {
      this.countRequest = this.fetchCount().finally(() => {
        this.countRequest = null;
      });
    }
    return this.countRequest;
  }

  private async fetchCount(): Promise<number> {
    if (!this.client) {
      throw new Error('Supabase connection not configured.');
    }

    const { count, error } = await this.client
      .from(this.table)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    const value = count ?? 0;
    this.countCache = { value, expiresAt: Date.now() + SupabaseService.COUNT_TTL_MS };
    return value;
  }

  /** Invalidates the cached count — useful after mutations. */
  clearCountCache(): void {
    this.countCache = null;
    this.countRequest = null;
  }

  private async withRetry<T>(operation: () => Promise<T>, retries = SupabaseService.MAX_RETRIES): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          const delay = SupabaseService.RETRY_DELAY_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  /**
   * Fetches a single random quote.
   * Strategy: count → random offset → range fetch with deterministic ordering.
   * Validated with Zod at the boundary. Retries once on race/offset miss.
   * For large tables consider a Postgres RPC: `select * from quotes order by random() limit 1`.
   */
  async getRandomQuote(retry = true): Promise<Quote> {
    if (!this.client) {
      throw new Error('Supabase connection not configured.');
    }

    const count = await this.getCount();
    if (!count || count === 0) {
      throw new Error('No quotes found in the database.');
    }

    const randomOffset = Math.floor(Math.random() * count);

    const { data, error } = await this.client
      .from(this.table)
      .select('id, content, author, category')
      .order('id', { ascending: true })
      .range(randomOffset, randomOffset)
      .single();

    if (error) {
      // PGRST116 = no rows, often due to concurrent delete / offset race
      const isNotFound = (error as { code?: string }).code === 'PGRST116';
      if (isNotFound && retry) {
        this.clearCountCache();
        return this.getRandomQuote(false);
      }
      throw error;
    }

    // Runtime validation — ensures shape matches Quote model
    try {
      return QuoteSchema.parse(data);
    } catch (zodErr) {
      // Re-throw with context for better diagnostics
      throw new Error(
        `Quote validation failed: ${zodErr instanceof Error ? zodErr.message : String(zodErr)}`,
      );
    }
  }

  /**
   * Fetches a paginated slice of quotes ordered by id.
   * Returns validated quotes alongside total count and page metadata.
   */
  async getQuotesPaginated(page: number, pageSize: number): Promise<PaginatedQuotes> {
    if (!this.client) {
      throw new Error('Supabase connection not configured.');
    }

    const safePageSize = Number.isFinite(pageSize)
      ? Math.max(1, Math.min(Math.floor(pageSize), SupabaseService.MAX_PAGE_SIZE))
      : 5;

    const total = await this.getCount();
    if (!total || total === 0) {
      return { quotes: [], total: 0, page: 1, totalPages: 0 };
    }

    const totalPages = Math.ceil(total / safePageSize);
    const requestedPage = Number.isFinite(page) ? Math.floor(page) : 1;
    const safePage = Math.max(1, Math.min(requestedPage, totalPages));
    const offset = (safePage - 1) * safePageSize;

    const { data, error } = await this.client
      .from(this.table)
      .select('id, content, author, category')
      .order('id', { ascending: true })
      .range(offset, offset + safePageSize - 1);

    if (error) throw error;

    const quotes: Quote[] = [];
    if (data) {
      for (const row of data) {
        try {
          quotes.push(QuoteSchema.parse(row));
        } catch (zodErr) {
          throw new Error(
            `Quote validation failed: ${zodErr instanceof Error ? zodErr.message : String(zodErr)}`,
          );
        }
      }
    }

    return { quotes, total, page: safePage, totalPages };
  }

  /**
   * Fetches a single quote by its ID.
   * Returns null if the quote does not exist.
   */
  async getQuoteById(id: number): Promise<Quote | null> {
    if (!this.client) {
      throw new Error('Supabase connection not configured.');
    }

    if (!Number.isFinite(id) || id < 1) {
      throw new Error('Invalid quote ID.');
    }

    const { data, error } = await this.client
      .from(this.table)
      .select('id, content, author, category')
      .eq('id', id)
      .single();

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    try {
      return QuoteSchema.parse(data);
    } catch (zodErr) {
      throw new Error(
        `Quote validation failed: ${zodErr instanceof Error ? zodErr.message : String(zodErr)}`,
      );
    }
  }

  /**
   * Fetches all distinct categories from the quotes table.
   * Returns an empty array if no categories exist.
   */
  async getCategories(): Promise<string[]> {
    if (!this.client) {
      throw new Error('Supabase connection not configured.');
    }

    const { data, error } = await this.client
      .from(this.table)
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;

    const categories = new Set<string>();
    if (data) {
      for (const row of data) {
        const cat = row.category?.trim();
        if (cat) {
          categories.add(cat);
        }
      }
    }

    return Array.from(categories).sort();
  }

  /**
   * Fetches a random quote filtered by category.
   * Falls back to any random quote if the category has no quotes.
   */
  async getRandomQuoteByCategory(category: string): Promise<Quote> {
    if (!this.client) {
      throw new Error('Supabase connection not configured.');
    }

    const { data, error } = await this.client
      .from(this.table)
      .select('id, content, author, category')
      .eq('category', category)
      .order('id', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error(`No quotes found in category "${category}".`);
    }

    const randomIndex = Math.floor(Math.random() * data.length);
    const row = data[randomIndex];

    try {
      return QuoteSchema.parse(row);
    } catch (zodErr) {
      throw new Error(
        `Quote validation failed: ${zodErr instanceof Error ? zodErr.message : String(zodErr)}`,
      );
    }
  }

  /**
   * Fetches paginated quotes filtered by category.
   */
  async getQuotesByCategory(
    category: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedQuotes> {
    if (!this.client) {
      throw new Error('Supabase connection not configured.');
    }

    const safePageSize = Number.isFinite(pageSize)
      ? Math.max(1, Math.min(Math.floor(pageSize), SupabaseService.MAX_PAGE_SIZE))
      : 5;

    const { count, error: countError } = await this.client
      .from(this.table)
      .select('*', { count: 'exact', head: true })
      .eq('category', category);

    if (countError) throw countError;

    const total = count ?? 0;
    if (total === 0) {
      return { quotes: [], total: 0, page: 1, totalPages: 0 };
    }

    const totalPages = Math.ceil(total / safePageSize);
    const requestedPage = Number.isFinite(page) ? Math.floor(page) : 1;
    const safePage = Math.max(1, Math.min(requestedPage, totalPages));
    const offset = (safePage - 1) * safePageSize;

    const { data, error } = await this.client
      .from(this.table)
      .select('id, content, author, category')
      .eq('category', category)
      .order('id', { ascending: true })
      .range(offset, offset + safePageSize - 1);

    if (error) throw error;

    const quotes: Quote[] = [];
    if (data) {
      for (const row of data) {
        try {
          quotes.push(QuoteSchema.parse(row));
        } catch (zodErr) {
          throw new Error(
            `Quote validation failed: ${zodErr instanceof Error ? zodErr.message : String(zodErr)}`,
          );
        }
      }
    }

    return { quotes, total, page: safePage, totalPages };
  }
}
