/**
 * Utility functions for handling image URLs from backend
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://kyokushin-api.onrender.com';

/**
 * Converts a relative image path from backend to full URL
 * @param path - Relative path (e.g., "/uploads/image-123.jpg") or full URL
 * @returns Full URL to the image
 */
export function getImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    
    // If already a full URL, return as is
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

/**
 * Get user profile image URL with fallback
 * @param user - User object with profilePhotoUrl
 * @returns Full URL or null
 */
export function getUserProfileImage(user: { profilePhotoUrl?: string | null } | null | undefined): string | null {
    if (!user?.profilePhotoUrl) return null;
    return getImageUrl(user.profilePhotoUrl);
}
