import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML content — allows safe formatting tags for blog posts
 * but strips dangerous scripts, event handlers, and iframes
 */
export const sanitizeRichHtml = (dirty: string): string => {
    return sanitizeHtml(dirty, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'figure', 'figcaption', 'video', 'source',
            'span', 'div', 'br', 'hr', 'table', 'thead',
            'tbody', 'tr', 'th', 'td',
        ]),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
            a: ['href', 'name', 'target', 'rel'],
            video: ['src', 'controls', 'width', 'height'],
            source: ['src', 'type'],
            span: ['class', 'style'],
            div: ['class', 'style'],
            td: ['colspan', 'rowspan'],
            th: ['colspan', 'rowspan'],
        },
        allowedStyles: {
            '*': {
                color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/],
                'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
                'font-size': [/^\d+(?:px|em|rem|%)$/],
                'font-weight': [/^\d+$/, /^bold$/, /^normal$/],
                'text-decoration': [/^underline$/, /^line-through$/, /^none$/],
            },
        },
        // Ensure all links open safely
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
        },
    });
};

/**
 * Strip ALL HTML — for plain text fields (names, titles, etc.)
 */
export const stripHtml = (dirty: string): string => {
    return sanitizeHtml(dirty, {
        allowedTags: [],
        allowedAttributes: {},
    }).trim();
};
