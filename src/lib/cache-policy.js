const CATALOGUE_TTL_MS = 5 * 60 * 1000
// Notices start and end on time and promotions differ per player, and nothing
// tells an open page that they changed: this age is how late an update can be.
const SITE_CONTENT_TTL_MS = 60 * 1000

const SITE_CONTENT_PATHS = new Set(['/api/home-sections', '/api/notices', '/api/promotions'])

/** How long a GET response may be reused, in ms; 0 means never. */
export function responseCacheTtl(path) {
    if (path.startsWith('/api/9w/games/')) return CATALOGUE_TTL_MS
    if (path.startsWith('/api/9w/hall/')) return CATALOGUE_TTL_MS
    if (path.startsWith('/api/sports/games') || path === '/api/sports/providers') return 60 * 1000
    if (SITE_CONTENT_PATHS.has(path)) return SITE_CONTENT_TTL_MS
    return 0
}
