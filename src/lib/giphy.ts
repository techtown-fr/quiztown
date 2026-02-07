import { GiphyFetch } from '@giphy/js-fetch-api';

const apiKey = import.meta.env.PUBLIC_GIPHY_API_KEY ?? '';

const gf = new GiphyFetch(apiKey);

export interface GifResult {
  id: string;
  title: string;
  url: string; // original GIF URL
  previewUrl: string; // small preview for picker grid
  width: number;
  height: number;
}

export interface GifSearchResponse {
  gifs: GifResult[];
  totalCount: number;
  offset: number;
}

function mapGifs(data: { id: string | number; title: string; images: Record<string, { url?: string; width?: string; height?: string }> }[]): GifResult[] {
  return data.map((gif) => ({
    id: String(gif.id),
    title: gif.title,
    url: gif.images.original?.url ?? '',
    previewUrl: gif.images.fixed_width?.url ?? gif.images.original?.url ?? '',
    width: Number(gif.images.original?.width ?? 0),
    height: Number(gif.images.original?.height ?? 0),
  }));
}

export async function searchGifs(
  query: string,
  offset: number = 0,
  limit: number = 20
): Promise<GifSearchResponse> {
  const result = await gf.search(query, { limit, offset, rating: 'g' });
  return {
    gifs: mapGifs(result.data as unknown as Parameters<typeof mapGifs>[0]),
    totalCount: result.pagination.total_count,
    offset: result.pagination.offset,
  };
}

export async function trendingGifs(
  offset: number = 0,
  limit: number = 20
): Promise<GifSearchResponse> {
  const result = await gf.trending({ limit, offset, rating: 'g' });
  return {
    gifs: mapGifs(result.data as unknown as Parameters<typeof mapGifs>[0]),
    totalCount: result.pagination.total_count,
    offset: result.pagination.offset,
  };
}
