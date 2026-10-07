import { TestBed } from '@angular/core/testing';
import { ShareService } from './share.service';

describe('ShareService', () => {
  let service: ShareService;
  const quote = { id: 7, content: 'Stay curious.', author: 'Ada', category: 'mindset' };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build quote text with attribution', () => {
    expect(service.buildQuoteText(quote)).toBe('"Stay curious." — Ada');
  });

  it('should build an absolute permalink for a quote', () => {
    expect(service.getQuoteUrl(7, 'https://example.com')).toBe('https://example.com/quote/7');
  });

  it('should build a tweet intent containing the quote text', () => {
    const url = service.buildTweetIntent(quote);
    expect(url.startsWith('https://x.com/intent/post?text=')).toBe(true);
    expect(decodeURIComponent(url)).toContain('Stay curious.');
  });

  it('should build LinkedIn and Facebook intents around the permalink', () => {
    const permalink = 'https://example.com/quote/7';
    expect(service.buildLinkedInIntent(permalink)).toContain(encodeURIComponent(permalink));
    expect(service.buildFacebookIntent(permalink)).toContain(encodeURIComponent(permalink));
  });

  it('should copy via navigator.clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    await service.copyText('hello');

    expect(writeText).toHaveBeenCalledWith('hello');
  });
});
