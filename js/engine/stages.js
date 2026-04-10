// Stage Configurations - 10 stages, shorter lengths, progressive difficulty

const OBSTACLE_TYPES = {
    WALKER: 'walker',
    PLAYING: 'playing',
    SOCCER: 'soccer',
    BICYCLE: 'bicycle',
    MOTORCYCLE: 'motorcycle',
};

const STAGES = [
    { // Stage 1
        name: '1단계', subtitle: '조용한 골목길',
        speedMultiplier: 1.0, scrollSpeed: 55,
        roadWidth: 0.65, levelLength: 3600,
        spawnInterval: 2200, maxObstacles: 3, coinChance: 0.03,
        roadType: 'dirt', // dirt or paved
        buildings: ['house', 'fence', 'tree', 'lamp_post'],
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 1, speed: 35 },
        ]
    },
    { // Stage 2
        name: '2단계', subtitle: '동네 앞길',
        speedMultiplier: 1.1, scrollSpeed: 60,
        roadWidth: 0.65, levelLength: 4200,
        spawnInterval: 1800, maxObstacles: 4, coinChance: 0.035,
        roadType: 'mixed',
        buildings: ['house', 'house', 'fence', 'tree', 'lamp_post'],
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 1, speed: 42 },
        ]
    },
    { // Stage 3
        name: '3단계', subtitle: '놀이터 앞',
        speedMultiplier: 1.2, scrollSpeed: 65,
        roadWidth: 0.6, levelLength: 4500,
        spawnInterval: 1600, maxObstacles: 5, coinChance: 0.04,
        roadType: 'dirt',
        buildings: ['playground', 'tree', 'fence', 'house', 'shop', 'lamp_post'],
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 45 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 1, speed: 30, zigzagAmplitude: 35, zigzagFreq: 0.002 },
        ]
    },
    { // Stage 4
        name: '4단계', subtitle: '학교 가는 길',
        speedMultiplier: 1.3, scrollSpeed: 70,
        roadWidth: 0.6, levelLength: 4800,
        spawnInterval: 1400, maxObstacles: 6, coinChance: 0.04,
        roadType: 'paved',
        buildings: ['school', 'tree', 'fence', 'house', 'shop', 'lamp_post'],
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 48 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 1, speed: 35, zigzagAmplitude: 40, zigzagFreq: 0.002 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 1, speed: 40, ballSpeed: 70 },
        ]
    },
    { // Stage 5
        name: '5단계', subtitle: '자전거 거리',
        speedMultiplier: 1.4, scrollSpeed: 75,
        roadWidth: 0.58, levelLength: 5100,
        spawnInterval: 1300, maxObstacles: 7, coinChance: 0.045,
        roadType: 'paved',
        buildings: ['building', 'shop', 'cafe', 'tree', 'lamp_post', 'vending'],
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 50 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 1, speed: 38, zigzagAmplitude: 42, zigzagFreq: 0.0025 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 1, speed: 45, ballSpeed: 80 },
            { type: OBSTACLE_TYPES.BICYCLE, weight: 1, speed: 80 },
        ]
    },
    { // Stage 6
        name: '6단계', subtitle: '오토바이 골목',
        speedMultiplier: 1.5, scrollSpeed: 80,
        roadWidth: 0.55, levelLength: 5400,
        spawnInterval: 1200, maxObstacles: 8, coinChance: 0.05,
        roadType: 'mixed',
        buildings: ['building', 'shop', 'cafe', 'tree', 'lamp_post', 'vending'],
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 52 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 1, speed: 40, zigzagAmplitude: 45, zigzagFreq: 0.003 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 1, speed: 48, ballSpeed: 90 },
            { type: OBSTACLE_TYPES.BICYCLE, weight: 1, speed: 90 },
            { type: OBSTACLE_TYPES.MOTORCYCLE, weight: 1, speed: 110, wobbleAmplitude: 15 },
        ]
    },
    { // Stage 7
        name: '7단계', subtitle: '혼잡한 시내',
        speedMultiplier: 1.6, scrollSpeed: 85,
        roadWidth: 0.52, levelLength: 5700,
        spawnInterval: 1100, maxObstacles: 9, coinChance: 0.05,
        roadType: 'paved',
        buildings: ['building', 'tall_apt', 'shop', 'cafe', 'lamp_post', 'vending'],
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 55 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 2, speed: 45, zigzagAmplitude: 48, zigzagFreq: 0.003 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 1, speed: 50, ballSpeed: 100 },
            { type: OBSTACLE_TYPES.BICYCLE, weight: 2, speed: 100 },
            { type: OBSTACLE_TYPES.MOTORCYCLE, weight: 1, speed: 120, wobbleAmplitude: 18 },
        ]
    },
    { // Stage 8
        name: '8단계', subtitle: '좁은 골목',
        speedMultiplier: 1.7, scrollSpeed: 90,
        roadWidth: 0.48, levelLength: 6000,
        spawnInterval: 1000, maxObstacles: 10, coinChance: 0.055,
        roadType: 'dirt',
        buildings: ['building', 'tall_apt', 'shop', 'cafe', 'lamp_post', 'vending'],
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 58 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 2, speed: 48, zigzagAmplitude: 35, zigzagFreq: 0.004 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 1, speed: 52, ballSpeed: 110 },
            { type: OBSTACLE_TYPES.BICYCLE, weight: 2, speed: 110 },
            { type: OBSTACLE_TYPES.MOTORCYCLE, weight: 2, speed: 130, wobbleAmplitude: 12 },
        ]
    },
    { // Stage 9
        name: '9단계', subtitle: '러시아워',
        speedMultiplier: 1.85, scrollSpeed: 95,
        roadWidth: 0.46, levelLength: 6600,
        spawnInterval: 900, maxObstacles: 11, coinChance: 0.06,
        roadType: 'paved',
        buildings: ['tall_apt', 'building', 'cafe', 'school', 'lamp_post', 'vending'],
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 62 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 2, speed: 52, zigzagAmplitude: 45, zigzagFreq: 0.004 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 2, speed: 55, ballSpeed: 120 },
            { type: OBSTACLE_TYPES.BICYCLE, weight: 2, speed: 120 },
            { type: OBSTACLE_TYPES.MOTORCYCLE, weight: 2, speed: 145, wobbleAmplitude: 20 },
        ]
    },
    { // Stage 10
        name: '10단계', subtitle: '최종 도전!',
        speedMultiplier: 2.0, scrollSpeed: 100,
        roadWidth: 0.44, levelLength: 7500,
        spawnInterval: 800, maxObstacles: 13, coinChance: 0.07,
        roadType: 'mixed',
        buildings: ['tall_apt', 'building', 'cafe', 'school', 'lamp_post', 'vending'],
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 68 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 2, speed: 55, zigzagAmplitude: 50, zigzagFreq: 0.005 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 2, speed: 60, ballSpeed: 130 },
            { type: OBSTACLE_TYPES.BICYCLE, weight: 3, speed: 130 },
            { type: OBSTACLE_TYPES.MOTORCYCLE, weight: 3, speed: 160, wobbleAmplitude: 25 },
        ]
    },
];
