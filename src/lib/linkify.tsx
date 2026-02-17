/**
 * Detects URLs in text and returns an array of {text, isLink, url} objects
 */
export function detectLinks(text: string): Array<{ text: string; isLink: boolean; url?: string }> {
    // URL regex pattern
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts: Array<{ text: string; isLink: boolean; url?: string }> = [];

    let lastIndex = 0;
    let match;

    while ((match = urlPattern.exec(text)) !== null) {
        // Add text before the URL
        if (match.index > lastIndex) {
            parts.push({
                text: text.substring(lastIndex, match.index),
                isLink: false,
            });
        }

        // Add the URL
        parts.push({
            text: match[0],
            isLink: true,
            url: match[0],
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push({
            text: text.substring(lastIndex),
            isLink: false,
        });
    }

    return parts.length > 0 ? parts : [{ text, isLink: false }];
}

/**
 * Linkify component that renders text with clickable links
 */
export function linkifyText(text: string): React.ReactNode {
    const parts = detectLinks(text);

    return parts.map((part, index) => {
        if (part.isLink && part.url) {
            return (
                <a
                    key={index}
                    href={part.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                    {part.text}
                </a>
            );
        }
        return <span key={index}>{part.text}</span>;
    });
}
