import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mocks that vi.mock can access
const { mockSearch, mockTrending } = vi.hoisted(() => ({
  mockSearch: vi.fn(),
  mockTrending: vi.fn(),
}));

vi.mock('@giphy/js-fetch-api', () => {
  return {
    GiphyFetch: class MockGiphyFetch {
      search = mockSearch;
      trending = mockTrending;
    },
  };
});

// Must import after mock setup
import { searchGifs, trendingGifs, type GifResult } from '../../src/lib/giphy';

const makeFakeGif = (id: string) => ({
  id,
  title: `GIF ${id}`,
  images: {
    original: { url: `https://giphy.com/original/${id}.gif`, width: '480', height: '360' },
    fixed_width: { url: `https://giphy.com/fixed/${id}.gif`, width: '200', height: '150' },
  },
});

const fakePagination = { total_count: 100, count: 2, offset: 0 };

describe('giphy wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchGifs', () => {
    it('calls GIPHY search with correct parameters', async () => {
      mockSearch.mockResolvedValue({
        data: [makeFakeGif('1'), makeFakeGif('2')],
        pagination: fakePagination,
      });

      await searchGifs('funny cats', 0, 20);

      expect(mockSearch).toHaveBeenCalledWith('funny cats', {
        limit: 20,
        offset: 0,
        rating: 'g',
      });
    });

    it('returns mapped GifResult array', async () => {
      mockSearch.mockResolvedValue({
        data: [makeFakeGif('abc')],
        pagination: { total_count: 50, count: 1, offset: 0 },
      });

      const result = await searchGifs('test');

      expect(result.gifs).toHaveLength(1);
      expect(result.gifs[0]).toEqual<GifResult>({
        id: 'abc',
        title: 'GIF abc',
        url: 'https://giphy.com/original/abc.gif',
        previewUrl: 'https://giphy.com/fixed/abc.gif',
        width: 480,
        height: 360,
      });
    });

    it('returns totalCount and offset from pagination', async () => {
      mockSearch.mockResolvedValue({
        data: [makeFakeGif('1')],
        pagination: { total_count: 42, count: 1, offset: 10 },
      });

      const result = await searchGifs('dogs', 10);

      expect(result.totalCount).toBe(42);
      expect(result.offset).toBe(10);
    });

    it('always uses rating "g" for family-friendly content', async () => {
      mockSearch.mockResolvedValue({
        data: [],
        pagination: { total_count: 0, count: 0, offset: 0 },
      });

      await searchGifs('anything');

      expect(mockSearch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ rating: 'g' })
      );
    });

    it('respects custom offset and limit', async () => {
      mockSearch.mockResolvedValue({
        data: [],
        pagination: { total_count: 0, count: 0, offset: 40 },
      });

      await searchGifs('test', 40, 10);

      expect(mockSearch).toHaveBeenCalledWith('test', {
        limit: 10,
        offset: 40,
        rating: 'g',
      });
    });
  });

  describe('trendingGifs', () => {
    it('calls GIPHY trending with correct parameters', async () => {
      mockTrending.mockResolvedValue({
        data: [makeFakeGif('t1')],
        pagination: fakePagination,
      });

      await trendingGifs(0, 20);

      expect(mockTrending).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        rating: 'g',
      });
    });

    it('returns mapped GifResult array', async () => {
      mockTrending.mockResolvedValue({
        data: [makeFakeGif('t1'), makeFakeGif('t2')],
        pagination: { total_count: 200, count: 2, offset: 0 },
      });

      const result = await trendingGifs();

      expect(result.gifs).toHaveLength(2);
      expect(result.gifs[0].id).toBe('t1');
      expect(result.gifs[1].id).toBe('t2');
      expect(result.totalCount).toBe(200);
    });

    it('uses default offset=0 and limit=20', async () => {
      mockTrending.mockResolvedValue({
        data: [],
        pagination: { total_count: 0, count: 0, offset: 0 },
      });

      await trendingGifs();

      expect(mockTrending).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        rating: 'g',
      });
    });
  });

  describe('GIF data mapping', () => {
    it('uses fixed_width for previewUrl when available', async () => {
      mockSearch.mockResolvedValue({
        data: [makeFakeGif('x')],
        pagination: fakePagination,
      });

      const result = await searchGifs('test');
      expect(result.gifs[0].previewUrl).toContain('fixed');
    });

    it('falls back to original url when fixed_width is missing', async () => {
      mockSearch.mockResolvedValue({
        data: [{
          id: 'fallback',
          title: 'Fallback GIF',
          images: {
            original: { url: 'https://giphy.com/original.gif', width: '400', height: '300' },
            fixed_width: { url: undefined },
          },
        }],
        pagination: fakePagination,
      });

      const result = await searchGifs('test');
      expect(result.gifs[0].previewUrl).toBe('https://giphy.com/original.gif');
    });

    it('converts width and height to numbers', async () => {
      mockSearch.mockResolvedValue({
        data: [makeFakeGif('num')],
        pagination: fakePagination,
      });

      const result = await searchGifs('test');
      expect(typeof result.gifs[0].width).toBe('number');
      expect(typeof result.gifs[0].height).toBe('number');
    });
  });
});
