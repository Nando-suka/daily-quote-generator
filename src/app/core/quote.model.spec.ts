import { QuoteSchema } from './quote.model';

describe('QuoteSchema', () => {
  it('should parse a valid quote', () => {
    const input = {
      id: 1,
      content: 'The only way to do great work is to love what you do.',
      author: 'Steve Jobs',
      category: 'work',
    };

    const result = QuoteSchema.parse(input);

    expect(result).toEqual({
      id: 1,
      content: 'The only way to do great work is to love what you do.',
      author: 'Steve Jobs',
      category: 'work',
    });
  });

  it('should transform null author to "Unknown"', () => {
    const input = {
      id: 2,
      content: 'A quote without an author.',
      author: null,
      category: null,
    };

    const result = QuoteSchema.parse(input);

    expect(result.author).toBe('Unknown');
  });

  it('should accept null category', () => {
    const input = {
      id: 3,
      content: 'A quote with no category.',
      author: 'Someone',
      category: null,
    };

    const result = QuoteSchema.parse(input);

    expect(result.category).toBeNull();
  });

  it('should reject empty content', () => {
    const input = {
      id: 5,
      content: '',
      author: 'Someone',
      category: 'life',
    };

    expect(() => QuoteSchema.parse(input)).toThrow();
  });

  it('should reject missing content', () => {
    const input = {
      id: 6,
      author: 'Someone',
      category: 'life',
    };

    expect(() => QuoteSchema.parse(input)).toThrow();
  });

  it('should reject missing id', () => {
    const input = {
      content: 'A quote.',
      author: 'Someone',
      category: 'life',
    };

    expect(() => QuoteSchema.parse(input)).toThrow();
  });

  it('should reject non-number id', () => {
    const input = {
      id: 'not-a-number',
      content: 'A quote.',
      author: 'Someone',
      category: 'life',
    };

    expect(() => QuoteSchema.parse(input)).toThrow();
  });

  it('should reject non-string content', () => {
    const input = {
      id: 7,
      content: 123,
      author: 'Someone',
      category: 'life',
    };

    expect(() => QuoteSchema.parse(input)).toThrow();
  });

  it('should use safeParse to return success boolean instead of throwing', () => {
    const valid = QuoteSchema.safeParse({
      id: 1,
      content: 'Valid quote.',
      author: 'Author',
      category: null,
    });

    const invalid = QuoteSchema.safeParse({
      id: 'bad',
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
