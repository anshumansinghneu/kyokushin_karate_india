/** Centralized app configuration — single source of truth for URLs and settings */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/** Base for homepage film frames, loops and stills. Point at a CDN (R2, CloudFront) to move them off the app. */
export const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE || '/media').replace(/\/$/, '');
