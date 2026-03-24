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

/** Recursively list all files under a prefix in the portfolio bucket */
async function listFiles(prefix) {
  const { data, error } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .list(prefix || undefined, { limit: 1000 });
  if (error || !data) return [];

  const results = [];
  for (const item of data) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      // Directory — recurse
      results.push(...(await listFiles(itemPath)));
    } else {
      results.push(itemPath);
    }
  }
  return results;
}

/**
 * Fetch all portfolio images from Supabase Storage.
 * Returns array of { path, url } where path mimics the original local path
 * for category-detection regex compatibility.
 */
export async function fetchPortfolioItems() {
  const files = await listFiles("");
  return files
    .map((storagePath) => ({
      // Preserve virtual path prefix so App.jsx regex patterns still work
      path: `./assets/portfolio/${storagePath}`,
      url: getPortfolioUrl(storagePath, { width: 800, quality: 75 }),
      urlFull: getPortfolioUrl(storagePath),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}
