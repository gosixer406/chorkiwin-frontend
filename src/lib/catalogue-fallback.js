const referenceFallbackEndpoints = {
    hot: '/api/9w/games/hot?limit=40',
    live: '/api/9w/games/all?category=live&limit=40',
    slots: '/api/9w/games/all?category=slot&limit=40',
    table: '/api/9w/games/all?category=table&limit=40',
    crash: '/api/9w/games/all?category=crash&limit=40',
    fishing: '/api/9w/games/all?category=fish&limit=40',
    arcade: '/api/9w/games/all?category=arcade&limit=40',
    lottery: '/api/9w/games/all?category=lottery&limit=40',
    egame: '/api/9w/games/all?category=arcade,crash&limit=40',
}

export function referenceFallbackPath(path) {
    if (!path.includes('/api/9w/games/reference')) return ''
    const query = path.includes('?') ? path.slice(path.indexOf('?') + 1) : ''
    const category = new URLSearchParams(query).get('category')?.toLowerCase()
    return referenceFallbackEndpoints[category] || ''
}
