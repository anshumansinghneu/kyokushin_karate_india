'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface ResponsiveImageProps extends Omit<ImageProps, 'onError'> {
    fallbackSrc?: string;
    /** Aspect ratio class, e.g. "aspect-video", "aspect-square" */
    aspectRatio?: string;
    /** Wrapper classname */
    wrapperClassName?: string;
}

/**
 * Optimized responsive image component.
 * - Uses Next.js Image for automatic optimization, lazy loading, and responsive sizing.
 * - Serves appropriately-sized images for mobile vs desktop.
 * - Auto lazy-loads for fast mobile performance.
 * - Provides fallback on load error.
 */
export default function ResponsiveImage({
    src,
    alt,
    fallbackSrc,
    aspectRatio = 'aspect-video',
    wrapperClassName = '',
    className = '',
    sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    priority = false,
    ...props
}: ResponsiveImageProps) {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        if (fallbackSrc && !hasError) {
            setImgSrc(fallbackSrc);
            setHasError(true);
        }
    };

    return (
        <div className={`relative overflow-hidden ${aspectRatio} ${wrapperClassName}`}>
            <Image
                src={imgSrc}
                alt={alt}
                fill
                sizes={sizes}
                className={`object-cover ${className}`}
                loading={priority ? undefined : 'lazy'}
                priority={priority}
                quality={75}
                onError={handleError}
                {...props}
            />
        </div>
    );
}
