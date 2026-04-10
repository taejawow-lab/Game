// Character Customization System
// Hair=5 styles, Body=5 types, Shirt=5 colors, Pants=5 colors, Socks=5 colors

// Hair shapes - only rows 0-16 differ (back view, 20 chars wide)
const HAIR_STYLES = [
    // Style 0: 기본 (둥근 머리) - original round head
    { name: '기본', rows: [
        '00000012221100000000',  // 0  top
        '00001223332210000000',  // 1
        '00012234443321000000',  // 2
        '00123344444332100000',  // 3
        '01234444444443210000',  // 4
        '12334444444443321000',  // 5
        '12344444444444332100',  // 6  widest
        '12344444444444332100',  // 7
        '12344444444444332100',  // 8
        '12334444444444332100',  // 9
        '12333444444433332100',  // 10
        '65333344444333335600',  // 11 ears
        '57333334443333337500',  // 12 ears
        '57333333333333337500',  // 13 ears
        '12333333333333332100',  // 14 back of head
        '01233333333333321000',  // 15
        '00123333333332100000',  // 16 → connects to neck row 17
    ]},
    // Style 1: 숏컷 - shorter hair on top, same head shape below
    { name: '숏컷', rows: [
        '00000000000000000000',  // 0  no hair on top
        '00000013321100000000',  // 1  shorter start
        '00001233333210000000',  // 2
        '00012334443321000000',  // 3
        '00123344444332100000',  // 4
        '01233444444433210000',  // 5
        '12334444444443321000',  // 6  same head width
        '12344444444444332100',  // 7
        '12344444444444332100',  // 8
        '12334444444444332100',  // 9
        '12333444444433332100',  // 10
        '65333344444333335600',  // 11 ears
        '57333334443333337500',  // 12 ears
        '57333333333333337500',  // 13 ears
        '12333333333333332100',  // 14
        '01233333333333321000',  // 15
        '00123333333332100000',  // 16 → neck
    ]},
    // Style 2: 긴머리 - long flowing hair, covers ears, wider at bottom
    { name: '긴머리', rows: [
        '00000012221100000000',  // 0  same top as default
        '00001223332210000000',  // 1
        '00012234443321000000',  // 2
        '00123344444332100000',  // 3
        '01234444444443210000',  // 4
        '12334444444443321000',  // 5
        '12344444444444332100',  // 6
        '12344444444444332100',  // 7
        '12344444444444332100',  // 8
        '12344444444444332100',  // 9
        '12334444444443332100',  // 10
        '12233344444333322100',  // 11 hair covers ears
        '12233334443333322100',  // 12 flowing down
        '12233333333333322100',  // 13 wider at sides
        '12233333333333322100',  // 14 still wide
        '01233333333333321000',  // 15
        '01233333333333321000',  // 16 → wider neck connection
    ]},
    // Style 3: 모자 - cap with brim, hair visible below
    { name: '모자', rows: [
        '00000000000000000000',  // 0
        '00001111111110000000',  // 1  cap top
        '00111111111111100000',  // 2
        '01111111111111110000',  // 3
        '11111111111111111000',  // 4  brim extends right
        '01222222222222210000',  // 5  cap body (hair color)
        '01233333333333310000',  // 6
        '12344444444444321000',  // 7  head underneath
        '12344444444444332100',  // 8
        '12344444444444332100',  // 9
        '12333444444433332100',  // 10
        '65333344444333335600',  // 11 ears
        '57333334443333337500',  // 12 ears
        '57333333333333337500',  // 13 ears
        '12333333333333332100',  // 14 back of head
        '01233333333333321000',  // 15
        '00123333333332100000',  // 16 → neck
    ]},
    // Style 4: 뾰족 - spiky hair on top, normal head below
    { name: '뾰족', rows: [
        '00040000004000000000',  // 0  spikes
        '00043000034000000000',  // 1
        '00143400343100000000',  // 2
        '00123434343210000000',  // 3
        '01234444444432100000',  // 4
        '12334444444443210000',  // 5
        '12344444444444321000',  // 6  normal head
        '12344444444444332100',  // 7
        '12344444444444332100',  // 8
        '12334444444444332100',  // 9
        '12333444444433332100',  // 10
        '65333344444333335600',  // 11 ears
        '57333334443333337500',  // 12 ears
        '57333333333333337500',  // 13 ears
        '12333333333333332100',  // 14
        '01233333333333321000',  // 15
        '00123333333332100000',  // 16 → neck
    ]},
];

// Body types - rows 17-22 (torso) + rows 23-24 (pants top)
// Palette: 5=#FFCC99(skin), 6=#DDAA77(arm), 7=#FFD8A8(highlight)
//          8=shirt, 9=shirt shadow, A=shirt accent
//          B=pants, C=pants detail
const BODY_STYLES = [
    // 0: 홀쭉 (Skinny) - narrow torso, minimal arms
    { name: '홀쭉', bodyRows: [
        '00000566650000000000',  // 17 thin neck (5w)
        '00005889885000000000',  // 18 (7w)
        '00005889988500000000',  // 19 (8w)
        '00005889A98850000000',  // 20 widest (9w)
        '00005889A98850000000',  // 21
        '00005888888500000000',  // 22 (8w)
    ], pantsRows: [
        '00000BBBBBB000000000',  // 23 (6w)
        '00000BBCBCB000000000',  // 24
    ]},
    // 1: 날씬 (Slim) - slightly narrower than default
    { name: '날씬', bodyRows: [
        '00005666650000000000',  // 17 neck (6w)
        '00008889988800000000',  // 18 (8w)
        '00058889988500000000',  // 19 (9w)
        '00056889A98865000000',  // 20 widest (11w)
        '00056889A98865000000',  // 21
        '00005888888850000000',  // 22 (9w)
    ], pantsRows: [
        '00000BBBBBBB00000000',  // 23 (7w)
        '00000BBCBCBB00000000',  // 24
    ]},
    // 2: 기본 (Normal) - default body
    { name: '기본', bodyRows: [
        '00005666665000000000',  // 17 neck (7w)
        '00008889988800000000',  // 18 (8w)
        '00058889998850000000',  // 19 (10w)
        '00568889AA8886500000',  // 20 widest (13w)
        '00568889AA8886500000',  // 21
        '00058888888850000000',  // 22 (10w)
    ], pantsRows: [
        '00000BBBBBBBB0000000',  // 23 (8w)
        '00000BBCBCBBB0000000',  // 24
    ]},
    // 3: 통통 (Chubby) - wider torso with more arm showing
    { name: '통통', bodyRows: [
        '00005666666500000000',  // 17 neck (8w)
        '00058889988850000000',  // 18 (10w)
        '00568889988865000000',  // 19 (12w)
        '05668889AA8886650000',  // 20 widest (15w)
        '05668889AA8886650000',  // 21
        '00568888888865000000',  // 22 (12w)
    ], pantsRows: [
        '0000BBBBBBBBB0000000',  // 23 (9w)
        '0000BBBCBCBBB0000000',  // 24
    ]},
    // 4: 뚱뚱 (Fat) - very wide torso, prominent arms
    { name: '뚱뚱', bodyRows: [
        '00056666666500000000',  // 17 wider neck (9w)
        '00056889998865000000',  // 18 (11w)
        '05668889988886500000',  // 19 (14w)
        '056688889AA888665000',  // 20 widest (17w)
        '056688889AA888665000',  // 21
        '05688888888888650000',  // 22 (14w)
    ], pantsRows: [
        '0000BBBBBBBBBB000000',  // 23 (10w)
        '0000BBBCBBCBBB000000',  // 24
    ]},
];

// Walk animation rows (rows 25-27) - shared across all body types
const LEG_WALK_ROWS = [
    ['00000EEE0EEE00000000','00000DDE0DDE00000000','00000DDF0DDF00000000'],  // frame 0
    ['0000EEEE00EEE0000000','0000DDE000DDE0000000','000DDF00000DDF000000'],  // frame 1
    ['00000EEE00EEEE000000','00000DDE000DDE000000','000000DDF000DDF00000'],  // frame 2
];

const SHIRT_STYLES = [
    { name: '화이트', colors: {8:'#EEEEEE',9:'#CCCCCC',10:'#44BB55'} },
    { name: '레드',   colors: {8:'#DD4444',9:'#BB2222',10:'#FFDD44'} },
    { name: '블루',   colors: {8:'#4488DD',9:'#3366BB',10:'#FFFFFF'} },
    { name: '옐로우', colors: {8:'#FFCC44',9:'#DDAA22',10:'#FF6644'} },
    { name: '블랙',   colors: {8:'#333333',9:'#222222',10:'#DD4444'} },
];

const PANTS_STYLES = [
    { name: '라이트블루', colors: {11:'#8EAACC',12:'#6688AA'} },
    { name: '다크진',     colors: {11:'#445566',12:'#334455'} },
    { name: '브라운',     colors: {11:'#AA8866',12:'#886644'} },
    { name: '블랙',       colors: {11:'#333333',12:'#222222'} },
    { name: '카키',       colors: {11:'#99AA77',12:'#778855'} },
];

const SOCK_STYLES = [
    { name: '화이트', colors: {14:'#FFFFFF'} },
    { name: '레드',   colors: {14:'#DD4444'} },
    { name: '블루',   colors: {14:'#4488DD'} },
    { name: '옐로우', colors: {14:'#FFCC44'} },
    { name: '블랙',   colors: {14:'#333333'} },
];

// Build character sprite from customization indices
function buildCharacterSprite(hairIdx, bodyIdx, shirtIdx, pantsIdx, sockIdx) {
    // Backwards compatibility: if bodyIdx is missing (old 4-arg calls), shift args
    if (arguments.length === 4) {
        sockIdx = pantsIdx; pantsIdx = shirtIdx; shirtIdx = bodyIdx; bodyIdx = 2;
    }
    const hair = HAIR_STYLES[hairIdx % 5] || HAIR_STYLES[0];
    const body = BODY_STYLES[bodyIdx % 5] || BODY_STYLES[2];
    const shirt = SHIRT_STYLES[shirtIdx % 5] || SHIRT_STYLES[0];
    const pants = PANTS_STYLES[pantsIdx % 5] || PANTS_STYLES[0];
    const socks = SOCK_STYLES[sockIdx % 5] || SOCK_STYLES[0];

    // Build 3 walk frames: hair(0-16) + body(17-22) + pants(23-24) + walk(25-27)
    const frames = [0,1,2].map(f => [
        ...hair.rows,
        ...body.bodyRows,
        ...body.pantsRows,
        ...LEG_WALK_ROWS[f]
    ]);

    // Merge palette overrides
    const palette = [
        null,'#1A1008','#3A2818','#5A4030','#7A5A40',
        '#FFCC99','#DDAA77','#FFD8A8',
        '#EEEEEE','#CCCCCC','#44BB55',
        '#8EAACC','#6688AA','#FFFFFF','#EE5533','#888888'
    ];
    const overrides = {...shirt.colors, ...pants.colors, ...socks.colors};
    for (const [i, c] of Object.entries(overrides)) palette[parseInt(i)] = c;

    return { palette, width: 20, height: 28, frames };
}

// Swatch colors for UI preview
function getShirtSwatch(idx) { return SHIRT_STYLES[idx%5].colors[8]; }
function getPantsSwatch(idx) { return PANTS_STYLES[idx%5].colors[11]; }
function getSockSwatch(idx)  { return SOCK_STYLES[idx%5].colors[14]; }
