import { z } from 'zod';

/**
 * Zod schema for runtime validation of Supabase quote records.
 * Uses British English in documentation.
 *
 * Tolerant at the boundary: trims whitespace, treats missing or blank
 * authors as 'Unknown', and normalises blank categories to null so a
 * single malformed row never breaks the whole quote library.
 */
export const QuoteSchema = z.object({
  id: z.number().int().positive(),
  content: z.string().trim().min(1, 'Quote content must not be empty').max(1000, 'Quote content is too long'),
  author: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v.trim() : 'Unknown'))
    .pipe(z.string().max(120, 'Author name is too long')),
  category: z
    .string()
    .nullish()
    .catch(null)
    .transform((v) => (v?.trim() ? v.trim() : null)),
});

export type Quote = z.infer<typeof QuoteSchema>;
