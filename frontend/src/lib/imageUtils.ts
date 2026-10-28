/**
 * Utility functions for handling image URLs from backend
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://kyokushin-api.onrender.com';

/**
 * Converts a relative image path from backend to full URL
 * @param path - Relative path (e.g., "/uploads/image-123.jpg"), full URL, or Supabase URL
 * @returns Full URL to the image
 */
export function getImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;

    // If already a full URL (Supabase, Cloudinary, etc.), return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // If relative path, prepend backend URL
    if (path.startsWith('/')) {
        return `${BACKEND_URL}${path}`;
    }

    // If no leading slash, add it
    return `${BACKEND_URL}/${path}`;
}

// Hosts next.config allows the image optimizer to fetch from.
const OPTIMIZABLE = /^https:\/\/([a-z0-9-]+\.supabase\.co\/storage\/|kyokushin-api\.onrender\.com\/uploads\/)/;
// Widths the optimizer accepts (Next's default imageSizes and deviceSizes).
const WIDTHS = [256, 384, 640, 750, 828, 1080, 1200, 1920];

/**
 * An uploaded photo resized for display at about `width` CSS pixels (doubled for
 * sharp screens), via the Next image optimizer. Originals are 1–2 MB; a gallery
 * tile needs a fraction of that. Anything the optimizer can't fetch passes through.
 */
export function sizedImageUrl(path: string | null | undefined, width: number): string | null {
    const url = getImageUrl(path);
    if (!url || !OPTIMIZABLE.test(url)) return url;
    const w = WIDTHS.find((x) => x >= width * 2) ?? WIDTHS[WIDTHS.length - 1];
    return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;
}

/**
 * Get user profile image URL with fallback
 * @param user - User object with profilePhotoUrl
 * @returns Full URL or null
 */
export function getUserProfileImage(user: { profilePhotoUrl?: string | null } | null | undefined): string | null {
    if (!user?.profilePhotoUrl) return null;
    return getImageUrl(user.profilePhotoUrl);
}
