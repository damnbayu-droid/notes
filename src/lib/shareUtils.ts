/**
 * Generates a URL-friendly public share slug for a note.
 * Format: kebab-case-title-XXXX (4-char random alphanumeric suffix)
 * Example: "Tropic Tech Report" → "tropic-tech-report-a3k9"
 */
export function generateShareSlug(title: string): string {
    const randomSuffix = Math.random().toString(36).substring(2, 6);

    const titleSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric chars
        .replace(/\s+/g, '-')          // spaces to dashes
        .replace(/-+/g, '-')           // collapse multiple dashes
        .replace(/^-|-$/g, '')         // trim leading/trailing dashes
        .substring(0, 40);             // cap length

    const base = titleSlug || 'note';
    return `${base}-${randomSuffix}`;
}

/**
 * Builds the full public share URL from a slug.
 */
export function buildShareUrl(slug: string): string {
    return `${window.location.origin}/s/${slug}`;
}
