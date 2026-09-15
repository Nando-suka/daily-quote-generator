import { Inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Quote, QuoteSchema } from './quote.model';
import { SUPABASE_CONFIG, SupabaseConfig } from './supabase.config';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly client: SupabaseClient | null;
  private readonly isConfigured: boolean;
  private readonly table = 'quotes';

  /** Simple in-memory cache for count to avoid double queries on boot */
  private countCache: { value: number; expiresAt: number } | null = null;
  private readonly COUNT_TTL_MS = 60_000;

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

    const { count, error } = await this.client
      .from(this.table)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    const value = count ?? 0;
    this.countCache = { value, expiresAt: Date.now() + this.COUNT_TTL_MS };
    return value;
  }

  /** Invalidates the cached count — useful after mutations. */
  clearCountCache(): void {
    this.countCache = null;
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
}
