import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export const PORTFOLIO_BUCKET = "portfolio";

/** Get the public URL for a file in the portfolio bucket.
 *  width=0 means original. Otherwise uses Netlify Image CDN (free, WebP, cached).
 */
export function getPortfolioUrl(storagePath, { width = 0, quality = 75 } = {}) {
  const { data } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(storagePath)
  const originalUrl = data.publicUrl
  if (width > 0) {
    return `/.netlify/images?url=${encodeURIComponent(originalUrl)}&w=${width}&q=${quality}&fm=webp`
  }
  return originalUrl
}

const CACHE_KEY = "portfolio_files_v4";
const CACHE_TTL = 60 * 60 * 1000; // 1 час

/**
 * Fetch all portfolio images via a single RPC call to list_portfolio_files().
 * Replaces the old recursive storage.list() approach (N requests → 1 request).
 * Results are cached in localStorage for CACHE_TTL.
 */
export async function fetchPortfolioItems() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch {}

  const { data, error } = await supabase.rpc("list_portfolio_files");
  if (error || !data) return [];

  const result = data
    .map(({ name: storagePath }) => ({
      path: `./assets/portfolio/${storagePath}`,
      url: getPortfolioUrl(storagePath, { width: 700, quality: 50 }),
      urlThumb: getPortfolioUrl(storagePath, { width: 260, quality: 40 }),
      urlFull: getPortfolioUrl(storagePath),
    }));

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, ts: Date.now() }));
  } catch {}

  return result;
}
