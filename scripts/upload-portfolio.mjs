/**
 * Upload portfolio images to Supabase Storage.
 * Transliterates Cyrillic folder/file names to ASCII.
 * Run: node scripts/upload-portfolio.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "fs/promises";
import { join, relative } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SUPABASE_URL = "https://nctkkhnqtfambhamfvmi.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdGtraG5xdGZhbWJoYW1mdm1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAzMjk0MywiZXhwIjoyMDg5NjA4OTQzfQ.ssN8k3BfjiR5Gzu1xxxzNbIk787YVrzX1UETMmx2-c4";
const BUCKET = "portfolio";
const PORTFOLIO_DIR = join(ROOT, "src/assets/portfolio");
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);
const MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

// Cyrillic → Latin transliteration table
const CYR_MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
  ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  А: "a", Б: "b", В: "v", Г: "g", Д: "d", Е: "e", Ё: "yo",
  Ж: "zh", З: "z", И: "i", Й: "y", К: "k", Л: "l", М: "m",
  Н: "n", О: "o", П: "p", Р: "r", С: "s", Т: "t", У: "u",
  Ф: "f", Х: "kh", Ц: "ts", Ч: "ch", Ш: "sh", Щ: "shch",
  Ъ: "", Ы: "y", Ь: "", Э: "e", Ю: "yu", Я: "ya",
};

// Specific base-name overrides (matched case-insensitively, without extension)
const WORD_OVERRIDES = { до: "before", после: "after" };

/** Convert a single path segment (file or folder name) to a safe ASCII name */
function safeName(segment) {
  const dotIdx = segment.lastIndexOf(".");
  const hasExt = dotIdx > 0 && dotIdx < segment.length - 1;
  const base = hasExt ? segment.slice(0, dotIdx) : segment;
  const ext = hasExt ? segment.slice(dotIdx) : "";

  // Word-level override (e.g. "до.jpg" → "before.jpg")
  const override = WORD_OVERRIDES[base.toLowerCase()];
  if (override) return override + ext;

  // Transliterate Cyrillic characters
  let result = segment.split("").map((c) => CYR_MAP[c] ?? c).join("");
  // "1 (10).jpg" style → "1-10.jpg"
  result = result.replace(/\s*\((\d+)\)\s*/g, "-$1");
  // remaining spaces → dash
  result = result.replace(/\s+/g, "-");
  // drop remaining parentheses
  result = result.replace(/[()]/g, "");
  // collapse multiple dashes
  result = result.replace(/-+/g, "-");
  // remove trailing dash before extension
  result = result.replace(/-(\.[a-z0-9]+)$/i, "$1");
  // remove leading dash
  result = result.replace(/^-+/, "");
  return result;
}

/** Convert a full relative path to a safe storage key */
export function safePath(relPath) {
  return relPath.split("/").map(safeName).join("/");
}

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectFiles(fullPath)));
    } else {
      const ext = entry.name.split(".").pop().toLowerCase();
      if (IMAGE_EXTS.has(ext)) results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Ensure bucket exists and is public
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) { console.error("Cannot list buckets:", listErr.message); process.exit(1); }

  const exists = buckets.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) { console.error("Failed to create bucket:", error.message); process.exit(1); }
    console.log(`✓ Created bucket "${BUCKET}"`);
  } else {
    await supabase.storage.updateBucket(BUCKET, { public: true });
    console.log(`✓ Bucket "${BUCKET}" already exists (public)`);
  }

  const files = await collectFiles(PORTFOLIO_DIR);
  console.log(`\nUploading ${files.length} images...\n`);

  let ok = 0, fail = 0;
  for (const file of files) {
    const originalPath = relative(PORTFOLIO_DIR, file);
    const storagePath = safePath(originalPath);
    const ext = file.split(".").pop().toLowerCase();
    const contentType = MIME[ext] || "image/jpeg";
    const content = await readFile(file);

    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, content, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.error(`✗ ${storagePath}  (${originalPath}): ${error.message}`);
      fail++;
    } else {
      console.log(`✓ ${storagePath}`);
      ok++;
    }
  }

  console.log(`\nDone: ${ok} uploaded, ${fail} failed`);
}

main().catch((err) => { console.error(err); process.exit(1); });
