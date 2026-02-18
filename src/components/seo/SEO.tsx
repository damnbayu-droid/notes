import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article';
}

export function SEO({
    title = 'Smart Notes - Aplikasi Catatan & Produktivitas Terbaik',
    description = 'Aplikasi catatan terbaik untuk produktivitas Anda. Catatan harian, tugas, jadwal, dan AI pintar dalam satu aplikasi. Aman, bisa offline, dan canggih.',
    keywords = ['catatan', 'notes', 'produktivitas', 'ai', 'offline', 'pwa', 'react', 'jadwal', 'tugas', 'smart notes'],
    image = 'https://notes.biz.id/Logo.jpg',
    url = 'https://notes.biz.id/',
    type = 'website',
}: SEOProps) {
    const siteTitle = title === 'Smart Notes - Aplikasi Catatan & Produktivitas Terbaik' ? title : `${title} | Smart Notes`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords.join(', ')} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data (JSON-LD) */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "Smart Notes",
                    "applicationCategory": "ProductivityApplication",
                    "operatingSystem": "Web, Android, iOS",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "IDR"
                    },
                    "description": description,
                    "image": image,
                    "url": url,
                    "author": {
                        "@type": "Person",
                        "name": "Bayu"
                    }
                })}
            </script>
        </Helmet>
    );
}
