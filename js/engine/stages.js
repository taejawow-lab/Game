// Stage Configurations
// 10 stages with progressive difficulty

const OBSTACLE_TYPES = {
    WALKER: 'walker',           // Straight-line walking person
    PLAYING: 'playing',         // Person playing/jumping (zigzag)
    SOCCER: 'soccer',           // Soccer player + ball
    BICYCLE: 'bicycle',         // Bicycle rider
    MOTORCYCLE: 'motorcycle',   // Motorcycle rider
};

const STAGES = [
    // Stage 1: Easy - Few slow walkers
    {
        name: 'Stage 1',
        subtitle: '조용한 거리',
        speedMultiplier: 1.0,
        scrollSpeed: 60,       // pixels per second
        roadWidth: 0.7,        // ratio of canvas width
        levelLength: 3000,     // pixels to scroll before flag
        spawnInterval: 2000,   // ms between spawns
        maxObstacles: 4,
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 1, speed: 40 },
        ]
    },
    // Stage 2: More walkers, slightly faster
    {
        name: 'Stage 2',
        subtitle: '붐비는 거리',
        speedMultiplier: 1.1,
        scrollSpeed: 65,
        roadWidth: 0.7,
        levelLength: 3500,
        spawnInterval: 1700,
        maxObstacles: 5,
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 1, speed: 50 },
        ]
    },
    // Stage 3: Add playing people
    {
        name: 'Stage 3',
        subtitle: '놀이터 앞',
        speedMultiplier: 1.2,
        scrollSpeed: 70,
        roadWidth: 0.7,
        levelLength: 4000,
        spawnInterval: 1500,
        maxObstacles: 6,
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 50 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 1, speed: 35, zigzagAmplitude: 40, zigzagFreq: 0.002 },
        ]
    },
    // Stage 4: Soccer players
    {
        name: 'Stage 4',
        subtitle: '축구장 근처',
        speedMultiplier: 1.3,
        scrollSpeed: 75,
        roadWidth: 0.65,
        levelLength: 4500,
        spawnInterval: 1400,
        maxObstacles: 7,
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 55 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 1, speed: 40, zigzagAmplitude: 45, zigzagFreq: 0.002 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 1, speed: 45, ballSpeed: 80 },
        ]
    },
    // Stage 5: Bicycles appear
    {
        name: 'Stage 5',
        subtitle: '자전거 도로',
        speedMultiplier: 1.4,
        scrollSpeed: 80,
        roadWidth: 0.6,
        levelLength: 5000,
        spawnInterval: 1300,
        maxObstacles: 8,
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 55 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 1, speed: 40, zigzagAmplitude: 50, zigzagFreq: 0.0025 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 1, speed: 50, ballSpeed: 90 },
            { type: OBSTACLE_TYPES.BICYCLE, weight: 1, speed: 90 },
        ]
    },
    // Stage 6: Motorcycles!
    {
        name: 'Stage 6',
        subtitle: '오토바이 거리',
        speedMultiplier: 1.5,
        scrollSpeed: 85,
        roadWidth: 0.6,
        levelLength: 5500,
        spawnInterval: 1200,
        maxObstacles: 9,
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 60 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 1, speed: 45, zigzagAmplitude: 50, zigzagFreq: 0.003 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 1, speed: 50, ballSpeed: 100 },
            { type: OBSTACLE_TYPES.BICYCLE, weight: 1, speed: 100 },
            { type: OBSTACLE_TYPES.MOTORCYCLE, weight: 1, speed: 130, wobbleAmplitude: 15 },
        ]
    },
    // Stage 7: Everything mixed, faster
    {
        name: 'Stage 7',
        subtitle: '혼잡한 시내',
        speedMultiplier: 1.7,
        scrollSpeed: 90,
        roadWidth: 0.55,
        levelLength: 6000,
        spawnInterval: 1100,
        maxObstacles: 10,
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 65 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 2, speed: 50, zigzagAmplitude: 55, zigzagFreq: 0.003 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 1, speed: 55, ballSpeed: 110 },
            { type: OBSTACLE_TYPES.BICYCLE, weight: 2, speed: 110 },
            { type: OBSTACLE_TYPES.MOTORCYCLE, weight: 1, speed: 140, wobbleAmplitude: 20 },
        ]
    },
    // Stage 8: Narrow paths, very busy
    {
        name: 'Stage 8',
        subtitle: '좁은 골목',
        speedMultiplier: 1.8,
        scrollSpeed: 95,
        roadWidth: 0.5,
        levelLength: 6500,
        spawnInterval: 1000,
        maxObstacles: 11,
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 70 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 2, speed: 55, zigzagAmplitude: 40, zigzagFreq: 0.004 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 1, speed: 60, ballSpeed: 120 },
            { type: OBSTACLE_TYPES.BICYCLE, weight: 2, speed: 120 },
            { type: OBSTACLE_TYPES.MOTORCYCLE, weight: 2, speed: 150, wobbleAmplitude: 15 },
        ]
    },
    // Stage 9: Very fast, chaotic
    {
        name: 'Stage 9',
        subtitle: '러시아워',
        speedMultiplier: 2.0,
        scrollSpeed: 100,
        roadWidth: 0.48,
        levelLength: 7000,
        spawnInterval: 900,
        maxObstacles: 12,
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 75 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 2, speed: 60, zigzagAmplitude: 50, zigzagFreq: 0.004 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 2, speed: 65, ballSpeed: 130 },
            { type: OBSTACLE_TYPES.BICYCLE, weight: 2, speed: 130 },
            { type: OBSTACLE_TYPES.MOTORCYCLE, weight: 2, speed: 160, wobbleAmplitude: 25 },
        ]
    },
    // Stage 10: BOSS - Maximum difficulty
    {
        name: 'Stage 10',
        subtitle: '최종 도전!',
        speedMultiplier: 2.2,
        scrollSpeed: 110,
        roadWidth: 0.45,
        levelLength: 8000,
        spawnInterval: 800,
        maxObstacles: 14,
        obstacles: [
            { type: OBSTACLE_TYPES.WALKER, weight: 2, speed: 80 },
            { type: OBSTACLE_TYPES.PLAYING, weight: 2, speed: 65, zigzagAmplitude: 55, zigzagFreq: 0.005 },
            { type: OBSTACLE_TYPES.SOCCER, weight: 2, speed: 70, ballSpeed: 140 },
            { type: OBSTACLE_TYPES.BICYCLE, weight: 3, speed: 140 },
            { type: OBSTACLE_TYPES.MOTORCYCLE, weight: 3, speed: 180, wobbleAmplitude: 30 },
        ]
    },
];
