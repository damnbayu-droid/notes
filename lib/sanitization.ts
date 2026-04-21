import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Version for Next.js that works on both Server and Client.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';

    // Next.js Server side detection
    const isServer = typeof window === 'undefined';
    
    let purify;
    if (isServer) {
        // Use linkedom for Edge-compatible server-side DOM
        const { parseHTML } = require('linkedom');
        const { window } = parseHTML('<!DOCTYPE html><html><body></body></html>');
        purify = DOMPurify(window as any);
    } else {
        purify = DOMPurify;
    }

    return purify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'span',
            'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'section', 'article',
            'audio', 'source'
        ],
        ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'style',
            'srcset', 'sizes', 'width', 'height', 'loading', 'itemprop', 'itemtype', 'itemscope',
            'data-type', 'data-width-percentage', 'data-rotate', 'data-z-index', 'data-position', 'data-top', 'data-left', 'data-align', 'data-background-color', 'data-border-color',
            'controls', 'autoplay', 'loop', 'muted'
        ],
        ADD_ATTR: ['target'],
        ALLOW_DATA_ATTR: true,
        FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'object', 'embed'],
        FORBID_ATTR: ['onerror', 'onclick', 'onmouseover'],
    });
}
