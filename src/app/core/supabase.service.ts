import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Quote, QuoteSchema } from './quote.model';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly client: SupabaseClient | null;
  private readonly isConfigured: boolean;
  private readonly table = 'quotes';

  constructor() {
    this.isConfigured = Boolean(
      environment.supabaseUrl &&
        environment.supabaseUrl !== 'YOUR_SUPABASE_URL' &&
        environment.supabaseAnonKey &&
        environment.supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY',
    );

    this.client = this.isConfigured
      ? createClient(environment.supabaseUrl, environment.supabaseAnonKey)
      : null;
  }

  /** Whether Supabase credentials have been provided. */
  isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /** Fetches the total number of quotes. */
  async getCount(): Promise<number> {
    if (!this.client) {
      throw new Error('Supabase connection not configured.');
    }
    const { count, error } = await this.client
      .from(this.table)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count ?? 0;
  }

  /**
   * Fetches a single random quote.
   * Strategy: count → random offset → range fetch with deterministic ordering.
   * Avoids full-table scan; validated with Zod.
   */
  async getRandomQuote(): Promise<Quote> {
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

    if (error) throw error;
    // Runtime validation — ensures shape matches Quote model
    return QuoteSchema.parse(data);
  }
}
