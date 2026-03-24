import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export const PORTFOLIO_BUCKET = "portfolio";

/** Get the public URL for a file in the portfolio bucket.
 *  width=0 means original. Otherwise uses Supabase image transform (WebP, compressed).
 */
export function getPortfolioUrl(storagePath, { width = 0, quality = 75 } = {}) {
  if (width > 0) {
    const base = import.meta.env.VITE_SUPABASE_URL
    return `${base}/storage/v1/render/image/public/${PORTFOLIO_BUCKET}/${storagePath}?width=${width}&quality=${quality}&format=webp`
  }
  const { data } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
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
