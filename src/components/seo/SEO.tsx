import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article';
    locale?: 'id_ID' | 'en_US';
    noindex?: boolean;
}

const SITE_NAME = 'Smart Notes';
const BASE_URL = 'https://notes.biz.id';
const DEFAULT_IMAGE = `${BASE_URL}/Logo.jpg`;

const DEFAULT_TITLE = 'Smart Notes | Secured and Encrypted';
const DEFAULT_DESCRIPTION =
    'Smart Notes adalah aplikasi catatan AI terbaik untuk produktivitas. Tulis, simpan, jadwalkan, dan bagikan catatan harian, reminder, jadwal & scanner dokumen. Gratis, offline, dan aman.';
const DEFAULT_KEYWORDS = [
    // Indonesian SEO
    'catatan pintar', 'aplikasi catatan', 'catatan harian', 'catatan online', 'aplikasi produktivitas',
    'catatan indonesia', 'buat catatan', 'notes indonesia', 'catatan offline',
    // English SEO
    'smart notes', 'note taking app', 'notes app', 'ai notes', 'offline notes', 'pwa notes',
    'productivity app', 'note organizer', 'best notes app',
    // Feature keywords
    'reminder catatan', 'jadwal harian', 'scanner dokumen', 'ai assistant', 'dark mode notes',
];

export function SEO({
    title = DEFAULT_TITLE,
    description = DEFAULT_DESCRIPTION,
    keywords = DEFAULT_KEYWORDS,
    image = DEFAULT_IMAGE,
    url = `${BASE_URL}/`,
    type = 'website',
    locale = 'id_ID',
    noindex = false,
}: SEOProps) {
    const pageTitle =
        title === DEFAULT_TITLE ? title : `${title} | ${SITE_NAME}`;

    const canonicalUrl = url.endsWith('/') ? url : `${url}/`;

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        alternateName: 'Smart Notes Indonesia',
        applicationCategory: 'ProductivityApplication',
        applicationSubCategory: 'NotesTakingApplication',
        operatingSystem: 'Web, Android, iOS',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
        description,
        image,
        url: canonicalUrl,
        inLanguage: ['id-ID', 'en-US'],
        author: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: BASE_URL,
        },
        featureList: [
            'Catatan offline & online',
            'AI Assistant',
            'Reminder & Jadwal',
            'Scanner Dokumen',
            'Berbagi Catatan Publik',
            'Dark Mode',
            'PWA – Progressive Web App',
        ],
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: '128',
            bestRating: '5',
            worstRating: '1',
        },
    };

    return (
        <Helmet>
            {/* ===== CORE ===== */}
            <html lang={locale === 'id_ID' ? 'id' : 'en'} />
            <title>{pageTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords.join(', ')} />
            <meta name="author" content={SITE_NAME} />
            <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
            <meta name="rating" content="general" />

            {/* ===== CANONICAL & HREFLANG ===== */}
            <link rel="canonical" href={canonicalUrl} />
            <link rel="alternate" hrefLang="id" href={`${BASE_URL}/`} />
            <link rel="alternate" hrefLang="en" href={`${BASE_URL}/en/`} />
            <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/`} />

            {/* ===== OPEN GRAPH ===== */}
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:image:alt" content={`${SITE_NAME} - Aplikasi Catatan Pintar`} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:locale" content={locale} />
            <meta property="og:locale:alternate" content={locale === 'id_ID' ? 'en_US' : 'id_ID'} />

            {/* ===== TWITTER CARD ===== */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@smartnotes" />
            <meta name="twitter:creator" content="@smartnotes" />
            <meta name="twitter:url" content={canonicalUrl} />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            <meta name="twitter:image:alt" content={`${SITE_NAME} App`} />

            {/* ===== PWA / MOBILE ===== */}
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
            <meta name="application-name" content={SITE_NAME} />
            <meta name="msapplication-TileColor" content="#7c3aed" />
            <meta name="msapplication-TileImage" content="/Logo.webp" />
            <link rel="apple-touch-icon" href="/Logo.webp" />

            {/* ===== STRUCTURED DATA (JSON-LD) ===== */}
            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>
        </Helmet>
    );
}
