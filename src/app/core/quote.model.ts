import { z } from 'zod';

/**
 * Zod schema for runtime validation of Supabase quote records.
 * Uses British English in documentation.
 */
export const QuoteSchema = z.object({
  id: z.number(),
  content: z.string().min(1, 'Quote content must not be empty'),
  author: z.string().min(1).default('Unknown'),
  category: z.string().nullable(),
});

export type Quote = z.infer<typeof QuoteSchema>;
