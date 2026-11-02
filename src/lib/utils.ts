/**
 * Validates whether a given string is a valid image URL, data URL, blob URL, or valid root relative path.
 */
export function isValidUrlString(str: string | undefined | null): boolean {
  if (!str || typeof str !== "string") return false;
  const trimmed = str.trim();
  if (!trimmed) return false;

  // Explicitly allow preserved template SVGs
  if (
    trimmed === "Frame 68.svg" ||
    trimmed === "/Frame 68.svg" ||
    trimmed === "Frame 77.svg" ||
    trimmed === "/Frame 77.svg"
  ) {
    return true;
  }

  // Ignore non-existent template SVGs
  if (
    trimmed.startsWith("/Rectangle") ||
    trimmed.startsWith("/Property") ||
    trimmed.startsWith("/Frame 26") ||
    trimmed.startsWith("/Frame 60")
  ) {
    return false;
  }

  // Data URLs (base64 images)
  if (trimmed.startsWith("data:image/")) {
    return true;
  }

  // Blob URLs
  if (trimmed.startsWith("blob:")) {
    return true;
  }

  // Relative path starting with / (e.g., /images/photo.png, /uploads/pic.jpg)
  if (trimmed.startsWith("/")) {
    return true;
  }

  // Google Drive & content CDN domains without protocol
  if (
    trimmed.startsWith("drive.google.com") ||
    trimmed.startsWith("lh3.googleusercontent.com") ||
    trimmed.startsWith("drive.usercontent.google.com")
  ) {
    return true;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Formats Google Drive share links into direct viewable image URLs.
 * Handles patterns like:
 * - https://drive.google.com/file/d/1ABC.../view?usp=sharing
 * - https://drive.google.com/open?id=1ABC...
 * - https://drive.google.com/uc?id=1ABC...
 * - https://lh3.googleusercontent.com/d/1ABC...
 * - Base64 Data URLs (data:image/...)
 * - Blob URLs (blob:...)
 * - Relative image paths (/...)
 * - Direct image URLs (https://...)
 */
export function formatGoogleDriveUrl(url: string | undefined | null, fallback: string = ""): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }

  let cleanUrl = url.trim();
  if (!cleanUrl) return fallback;

  // Explicitly return preserved template SVGs
  if (cleanUrl === "Frame 68.svg" || cleanUrl === "/Frame 68.svg") {
    return "/Frame 68.svg";
  }
  if (cleanUrl === "Frame 77.svg" || cleanUrl === "/Frame 77.svg") {
    return "/Frame 77.svg";
  }

  // Filter out non-existent template default SVG paths
  if (
    cleanUrl.startsWith("/Rectangle") ||
    cleanUrl.startsWith("/Property") ||
    cleanUrl.startsWith("/Frame 26") ||
    cleanUrl.startsWith("/Frame 60")
  ) {
    return fallback;
  }

  // Remove surrounding quotes or stray whitespace
  cleanUrl = cleanUrl.replace(/^["']|["']$/g, "").trim();

  // Return base64 data URLs, blob URLs, and relative paths directly
  if (cleanUrl.startsWith("data:image/") || cleanUrl.startsWith("blob:") || cleanUrl.startsWith("/")) {
    return cleanUrl;
  }

  // Add https protocol if missing from drive.google.com or lh3.googleusercontent.com
  if (
    cleanUrl.startsWith("drive.google.com") ||
    cleanUrl.startsWith("lh3.googleusercontent.com") ||
    cleanUrl.startsWith("drive.usercontent.google.com")
  ) {
    cleanUrl = `https://${cleanUrl}`;
  }

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
  const fileDMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID or thumbnail?id=FILE_ID
  const idMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }

  // Pattern 3: Already an lh3 direct link
  const lh3Match = cleanUrl.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match && lh3Match[1]) {
    return `https://lh3.googleusercontent.com/d/${lh3Match[1]}`;
  }

  if (isValidUrlString(cleanUrl)) {
    return cleanUrl;
  }

  return fallback;
}

/**
 * Parses any date string (including Indonesian months, various separators, and formats)
 * into a timestamp (milliseconds). Fallbacks to numeric ID or 0 if unparseable.
 */
export function parseBlogDate(dateStr: string | undefined | null, fallbackId?: string | number): number {
  if (!dateStr || typeof dateStr !== "string") {
    const num = Number(fallbackId);
    return !isNaN(num) && num > 1000000 ? num : 0;
  }

  const str = dateStr.trim();
  if (!str) {
    const num = Number(fallbackId);
    return !isNaN(num) && num > 1000000 ? num : 0;
  }

  // Indonesian month mappings
  const monthMap: Record<string, string> = {
    januari: "january",
    februari: "february",
    peb: "feb",
    feb: "feb",
    maret: "march",
    mar: "mar",
    april: "april",
    apr: "apr",
    mei: "may",
    juni: "june",
    jun: "jun",
    juli: "july",
    jul: "jul",
    agustus: "august",
    ags: "aug",
    agu: "aug",
    september: "september",
    sep: "sep",
    oktober: "october",
    okt: "oct",
    november: "november",
    nop: "nov",
    nov: "nov",
    desember: "december",
    des: "dec",
  };

  let normalized = str;
  for (const [indo, eng] of Object.entries(monthMap)) {
    normalized = normalized.replace(new RegExp(`\\b${indo}\\b`, "gi"), eng);
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = normalized.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d.getTime();
  }

  // Try standard Date.parse
  const parsed = new Date(normalized).getTime();
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }

  const num = Number(fallbackId);
  return !isNaN(num) && num > 1000000 ? num : 0;
}

/**
 * Sorts an array of Blog items in descending order (latest publish date first).
 */
export function sortBlogsByDate<T extends { date?: string; id?: string | number }>(blogs: T[]): T[] {
  if (!blogs || !Array.isArray(blogs)) return [];
  return [...blogs].sort((a, b) => {
    const timeA = parseBlogDate(a.date, a.id);
    const timeB = parseBlogDate(b.date, b.id);
    return timeB - timeA;
  });
}

