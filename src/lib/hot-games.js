// The Hot Game list itself is admin's Hot list (Game Catalog > Hot Games),
// served by /api/9w/games/reference?category=hot.
// These bundled icons only stand in when the API sends a game without artwork.
const icon = (file) => `/game-icons/hot/${file}`

export const HOT_GAME_ARTWORK = {
    'crazy time': icon('crazy-time.webp'),
    'red baron': icon('red-baron.webp'),
    'baccarat': icon('baccarat.png'),
    'golden ace': icon('golden-ace.webp'),
    'magic ace': icon('magic-ace.png'),
    'aviator': icon('aviator.png'),
    'plinko': icon('plinko.png'),
    'magic ace wild lock': icon('magic-ace-wild-lock.png'),
    'super ace': icon('super-ace.webp'),
    'boxing king': icon('boxing-king.webp'),
    'rummy': icon('rummy.webp'),
    'go rush': icon('go-rush.webp'),
    'ludo quick': icon('ludo-quick.webp'),
    'frog dash': icon('frog-dash.webp'),
    'chicken dash': icon('chicken-dash.webp'),
    'sic bo': icon('sic-bo.webp'),
    'chicken dash jackpot': icon('chicken-dash-jackpot.webp'),
    'chicken dash 10000': icon('chicken-dash-10000.webp'),
    'fortune game': icon('fortune-game.webp'),
    'golden land': icon('golden-land.webp'),
    '7 up 7 down': icon('7-up-7-dwon.webp'),
    'big small': icon('big-small.webp'),
    'number king': icon('number-king.webp'),
    'teen patti joker': icon('teen-patti-joker.webp'),
    'dragon & tiger': icon('dragon-tiger.webp'),
    'callbreak quick': icon('callbreak-quick.webp'),
    'dragon tiger': icon('dragon-tiger.jpg'),
}
