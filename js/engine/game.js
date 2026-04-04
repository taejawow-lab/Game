// Game Engine
// Game loop, state management, obstacle spawning, rendering

const GameState = {
    TITLE: 'title',
    STAGE_SELECT: 'stage_select',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    STAGE_CLEAR: 'stage_clear',
};

class Game {
    constructor(canvas, input) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.input = input;

        // Game dimensions
        this.WIDTH = 320;
        this.HEIGHT = 480;
        this.SCALE = 3; // pixel scale for sprites

        canvas.width = this.WIDTH;
        canvas.height = this.HEIGHT;

        // State
        this.state = GameState.TITLE;
        this.currentStage = 0;
        this.clearedStages = this.loadProgress();

        // Prerender sprites
        this.prerenderedSprites = {};
        this.prerenderAll();

        // Game objects
        this.player = null;
        this.obstacles = [];
        this.soccerBalls = [];
        this.scrollY = 0;
        this.distanceTraveled = 0;
        this.spawnTimer = 0;
        this.gameOverTimer = 0;
        this.clearTimer = 0;

        // Environment
        this.trees = [];
        this.tileOffset = 0;

        // Animation timers
        this.titleBlink = 0;
        this.flagAnimator = null;

        // Prerender environment tiles
        this.roadTileCanvas = SpriteRenderer.prerenderSprite(ROAD_TILE, this.SCALE)[0];
        this.roadCenterCanvas = SpriteRenderer.prerenderSprite(ROAD_CENTER_LINE, this.SCALE)[0];
        this.sidewalkCanvas = SpriteRenderer.prerenderSprite(SIDEWALK_TILE, this.SCALE)[0];
        this.grassCanvas = SpriteRenderer.prerenderSprite(GRASS_TILE, this.SCALE)[0];
        this.finishLineCanvas = SpriteRenderer.prerenderSprite(FINISH_LINE, this.SCALE)[0];
        this.treeCanvases = SpriteRenderer.prerenderSprite(TREE, this.SCALE);
        this.flagCanvases = SpriteRenderer.prerenderSprite(FLAG, this.SCALE);

        // UI prerender
        this.heartCanvas = SpriteRenderer.prerenderSprite(HEART, this.SCALE)[0];
        this.starCanvas = SpriteRenderer.prerenderSprite(STAR, this.SCALE)[0];
        this.lockCanvas = SpriteRenderer.prerenderSprite(LOCK, this.SCALE)[0];
        this.arrowLeftCanvas = SpriteRenderer.prerenderSprite(ARROW_LEFT, 2)[0];
        this.arrowRightCanvas = SpriteRenderer.prerenderSprite(ARROW_RIGHT, 2)[0];
    }

    prerenderAll() {
        // Main character
        this.playerFrames = SpriteRenderer.prerenderSprite(MAIN_CHARACTER, this.SCALE);

        // Person variants
        this.personVariants = PERSON_VARIANTS.map(colors =>
            SpriteRenderer.prerenderSpriteWithColors(PERSON_DOWN, this.SCALE, colors)
        );

        // Playing person
        this.playingFrames = SpriteRenderer.prerenderSprite(PERSON_PLAYING, this.SCALE);

        // Soccer player
        this.soccerFrames = SpriteRenderer.prerenderSprite(SOCCER_PLAYER, this.SCALE);

        // Soccer ball
        this.ballFrames = SpriteRenderer.prerenderSprite(SOCCER_BALL, this.SCALE);

        // Bicycle variants
        this.bicycleVariants = BICYCLE_VARIANTS.map(colors =>
            SpriteRenderer.prerenderSpriteWithColors(BICYCLE, this.SCALE, colors)
        );

        // Motorcycle variants
        this.motorcycleVariants = MOTORCYCLE_VARIANTS.map(colors =>
            SpriteRenderer.prerenderSpriteWithColors(MOTORCYCLE, this.SCALE, colors)
        );
    }

    // Save/load progress
    loadProgress() {
        try {
            const data = localStorage.getItem('pixelCrossing_cleared');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    saveProgress() {
        try {
            localStorage.setItem('pixelCrossing_cleared', JSON.stringify(this.clearedStages));
        } catch { /* ignore */ }
    }

    isStageUnlocked(index) {
        if (index === 0) return true;
        return this.clearedStages.includes(index - 1);
    }

    // Start a stage
    startStage(stageIndex) {
        this.currentStage = stageIndex;
        const stage = STAGES[stageIndex];
        const spriteSize = 16 * this.SCALE;

        this.player = {
            x: this.WIDTH / 2 - spriteSize / 2,
            y: this.HEIGHT * 0.7,
            width: spriteSize,
            height: spriteSize,
            frameTimer: 0,
            frame: 0,
            speed: 150, // px/s lateral
            moving: false,
        };

        this.obstacles = [];
        this.soccerBalls = [];
        this.scrollY = 0;
        this.distanceTraveled = 0;
        this.spawnTimer = 0;
        this.gameOverTimer = 0;
        this.clearTimer = 0;
        this.tileOffset = 0;
        this.state = GameState.PLAYING;

        // Generate tree positions for decoration
        this.trees = [];
        const roadLeft = (this.WIDTH - this.WIDTH * stage.roadWidth) / 2;
        const roadRight = roadLeft + this.WIDTH * stage.roadWidth;
        for (let i = 0; i < 30; i++) {
            const side = Math.random() < 0.5 ? 'left' : 'right';
            this.trees.push({
                x: side === 'left'
                    ? Math.random() * (roadLeft - 30)
                    : roadRight + Math.random() * (this.WIDTH - roadRight - 10),
                baseY: Math.random() * stage.levelLength,
                side
            });
        }

        this.input.clearClicks();
    }

    // Spawn an obstacle
    spawnObstacle() {
        const stage = STAGES[this.currentStage];
        if (this.obstacles.length >= stage.maxObstacles) return;

        // Weighted random selection
        const totalWeight = stage.obstacles.reduce((sum, o) => sum + o.weight, 0);
        let r = Math.random() * totalWeight;
        let selected = stage.obstacles[0];
        for (const obs of stage.obstacles) {
            r -= obs.weight;
            if (r <= 0) { selected = obs; break; }
        }

        const spriteSize = 16 * this.SCALE;
        const roadLeft = (this.WIDTH - this.WIDTH * stage.roadWidth) / 2;
        const roadRight = roadLeft + this.WIDTH * stage.roadWidth;
        const spawnX = roadLeft + Math.random() * (roadRight - roadLeft - spriteSize);

        const obstacle = {
            type: selected.type,
            x: spawnX,
            y: -spriteSize - 20,
            width: spriteSize,
            height: spriteSize,
            speed: selected.speed * stage.speedMultiplier,
            frameTimer: 0,
            frame: 0,
            spawnTime: Date.now(),
            startX: spawnX,
        };

        // Type-specific properties
        if (selected.type === OBSTACLE_TYPES.PLAYING) {
            obstacle.zigzagAmplitude = selected.zigzagAmplitude || 40;
            obstacle.zigzagFreq = selected.zigzagFreq || 0.002;
        }
        if (selected.type === OBSTACLE_TYPES.MOTORCYCLE) {
            obstacle.wobbleAmplitude = selected.wobbleAmplitude || 15;
        }
        if (selected.type === OBSTACLE_TYPES.SOCCER) {
            obstacle.ballTimer = 1000 + Math.random() * 2000;
            obstacle.ballSpeed = selected.ballSpeed || 80;
        }

        // Variant selection
        if (selected.type === OBSTACLE_TYPES.WALKER) {
            obstacle.variant = Math.floor(Math.random() * this.personVariants.length);
        } else if (selected.type === OBSTACLE_TYPES.BICYCLE) {
            obstacle.variant = Math.floor(Math.random() * this.bicycleVariants.length);
        } else if (selected.type === OBSTACLE_TYPES.MOTORCYCLE) {
            obstacle.variant = Math.floor(Math.random() * this.motorcycleVariants.length);
        }

        this.obstacles.push(obstacle);
    }

    // Update game logic
    update(dt) {
        switch (this.state) {
            case GameState.TITLE:
                this.titleBlink += dt;
                if (this.input.consumeConfirm()) {
                    this.state = GameState.STAGE_SELECT;
                    this.input.clearClicks();
                }
                const click = this.input.getClick();
                if (click) {
                    this.state = GameState.STAGE_SELECT;
                    this.input.clearClicks();
                }
                break;

            case GameState.STAGE_SELECT:
                this.updateStageSelect();
                break;

            case GameState.PLAYING:
                this.updatePlaying(dt);
                break;

            case GameState.GAME_OVER:
                this.gameOverTimer += dt;
                if (this.gameOverTimer > 1000) {
                    const c = this.input.getClick();
                    if (c || this.input.consumeConfirm()) {
                        // Check button positions
                        if (c) {
                            const retryBtn = { x: this.WIDTH / 2 - 80, y: 300, w: 70, h: 35 };
                            const menuBtn = { x: this.WIDTH / 2 + 10, y: 300, w: 70, h: 35 };
                            if (Collision.pointInRect(c.x, c.y, retryBtn.x, retryBtn.y, retryBtn.w, retryBtn.h)) {
                                this.startStage(this.currentStage);
                            } else if (Collision.pointInRect(c.x, c.y, menuBtn.x, menuBtn.y, menuBtn.w, menuBtn.h)) {
                                this.state = GameState.STAGE_SELECT;
                                this.input.clearClicks();
                            }
                        } else {
                            this.startStage(this.currentStage);
                        }
                    }
                }
                break;

            case GameState.STAGE_CLEAR:
                this.clearTimer += dt;
                if (this.clearTimer > 1500) {
                    const c = this.input.getClick();
                    if (c || this.input.consumeConfirm()) {
                        if (c) {
                            const nextBtn = { x: this.WIDTH / 2 - 80, y: 310, w: 70, h: 35 };
                            const menuBtn = { x: this.WIDTH / 2 + 10, y: 310, w: 70, h: 35 };
                            if (this.currentStage < 9 && Collision.pointInRect(c.x, c.y, nextBtn.x, nextBtn.y, nextBtn.w, nextBtn.h)) {
                                this.startStage(this.currentStage + 1);
                            } else if (Collision.pointInRect(c.x, c.y, menuBtn.x, menuBtn.y, menuBtn.w, menuBtn.h)) {
                                this.state = GameState.STAGE_SELECT;
                                this.input.clearClicks();
                            }
                        } else {
                            if (this.currentStage < 9) {
                                this.startStage(this.currentStage + 1);
                            } else {
                                this.state = GameState.STAGE_SELECT;
                                this.input.clearClicks();
                            }
                        }
                    }
                }
                break;
        }
    }

    updateStageSelect() {
        const click = this.input.getClick();
        if (!click) return;

        // Stage grid: 2 columns, 5 rows
        const gridX = 40;
        const gridY = 120;
        const cellW = 120;
        const cellH = 55;
        const gap = 5;

        for (let i = 0; i < 10; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const cx = gridX + col * (cellW + gap);
            const cy = gridY + row * (cellH + gap);

            if (Collision.pointInRect(click.x, click.y, cx, cy, cellW, cellH)) {
                if (this.isStageUnlocked(i)) {
                    this.startStage(i);
                    return;
                }
            }
        }
    }

    updatePlaying(dt) {
        const stage = STAGES[this.currentStage];
        const spriteSize = 16 * this.SCALE;
        const roadLeft = (this.WIDTH - this.WIDTH * stage.roadWidth) / 2;
        const roadRight = roadLeft + this.WIDTH * stage.roadWidth;

        // Player movement
        this.player.moving = false;
        if (this.input.isLeft()) {
            this.player.x -= this.player.speed * dt / 1000;
            this.player.moving = true;
        }
        if (this.input.isRight()) {
            this.player.x += this.player.speed * dt / 1000;
            this.player.moving = true;
        }

        // Clamp to road
        this.player.x = Math.max(roadLeft, Math.min(roadRight - this.player.width, this.player.x));

        // Walk animation
        if (true) { // always walking forward
            this.player.frameTimer += dt;
            if (this.player.frameTimer > 200) {
                this.player.frameTimer -= 200;
                this.player.frame = (this.player.frame + 1) % 3;
            }
        }

        // Scroll
        this.distanceTraveled += stage.scrollSpeed * dt / 1000;
        this.tileOffset = (this.tileOffset + stage.scrollSpeed * dt / 1000) % (16 * this.SCALE);

        // Check win condition
        if (this.distanceTraveled >= stage.levelLength) {
            this.state = GameState.STAGE_CLEAR;
            this.clearTimer = 0;
            if (!this.clearedStages.includes(this.currentStage)) {
                this.clearedStages.push(this.currentStage);
                this.saveProgress();
            }
            return;
        }

        // Spawn obstacles
        this.spawnTimer += dt;
        if (this.spawnTimer >= stage.spawnInterval) {
            this.spawnTimer -= stage.spawnInterval;
            this.spawnObstacle();
        }

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            const elapsed = Date.now() - obs.spawnTime;

            // Movement based on type
            obs.y += (obs.speed + stage.scrollSpeed) * dt / 1000;

            if (obs.type === OBSTACLE_TYPES.PLAYING) {
                obs.x = obs.startX + Math.sin(elapsed * obs.zigzagFreq) * obs.zigzagAmplitude;
                obs.x = Math.max(roadLeft, Math.min(roadRight - obs.width, obs.x));
            }

            if (obs.type === OBSTACLE_TYPES.MOTORCYCLE) {
                obs.x = obs.startX + Math.sin(elapsed * 0.003) * (obs.wobbleAmplitude || 15);
                obs.x = Math.max(roadLeft, Math.min(roadRight - obs.width, obs.x));
            }

            // Soccer ball spawning
            if (obs.type === OBSTACLE_TYPES.SOCCER) {
                obs.ballTimer -= dt;
                if (obs.ballTimer <= 0) {
                    obs.ballTimer = 1500 + Math.random() * 2000;
                    obs.frame = 1; // kick animation
                    setTimeout(() => { if (obs) obs.frame = 0; }, 300);

                    const ballSize = 8 * this.SCALE;
                    this.soccerBalls.push({
                        x: obs.x + obs.width / 2 - ballSize / 2,
                        y: obs.y + obs.height / 2,
                        width: ballSize,
                        height: ballSize,
                        vx: (Math.random() - 0.5) * obs.ballSpeed * 2,
                        vy: obs.ballSpeed,
                        frame: 0,
                        frameTimer: 0,
                    });
                }
            }

            // Animation
            obs.frameTimer += dt;
            if (obs.frameTimer > 250) {
                obs.frameTimer -= 250;
                if (obs.type !== OBSTACLE_TYPES.SOCCER) {
                    obs.frame = (obs.frame + 1) % 2;
                }
            }

            // Remove if off-screen
            if (obs.y > this.HEIGHT + 50) {
                this.obstacles.splice(i, 1);
            }

            // Collision check
            if (Collision.check(this.player, obs)) {
                this.state = GameState.GAME_OVER;
                this.gameOverTimer = 0;
                return;
            }
        }

        // Update soccer balls
        for (let i = this.soccerBalls.length - 1; i >= 0; i--) {
            const ball = this.soccerBalls[i];
            ball.x += ball.vx * dt / 1000;
            ball.y += ball.vy * dt / 1000;

            ball.frameTimer += dt;
            if (ball.frameTimer > 150) {
                ball.frameTimer -= 150;
                ball.frame = (ball.frame + 1) % 2;
            }

            if (ball.y > this.HEIGHT + 30 || ball.x < -30 || ball.x > this.WIDTH + 30) {
                this.soccerBalls.splice(i, 1);
                continue;
            }

            if (Collision.check(this.player, ball)) {
                this.state = GameState.GAME_OVER;
                this.gameOverTimer = 0;
                return;
            }
        }

        // Consume any leftover clicks
        this.input.getClick();
    }

    // Render
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

        switch (this.state) {
            case GameState.TITLE:
                this.renderTitle(ctx);
                break;
            case GameState.STAGE_SELECT:
                this.renderStageSelect(ctx);
                break;
            case GameState.PLAYING:
                this.renderPlaying(ctx);
                break;
            case GameState.GAME_OVER:
                this.renderPlaying(ctx);
                this.renderGameOver(ctx);
                break;
            case GameState.STAGE_CLEAR:
                this.renderPlaying(ctx);
                this.renderStageClear(ctx);
                break;
        }
    }

    renderTitle(ctx) {
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Decorative road
        ctx.fillStyle = '#555555';
        ctx.fillRect(60, 0, 200, this.HEIGHT);
        ctx.fillStyle = '#BBAA99';
        ctx.fillRect(40, 0, 20, this.HEIGHT);
        ctx.fillRect(260, 0, 20, this.HEIGHT);

        // Dashed center line
        ctx.fillStyle = '#CCCC44';
        for (let y = ((this.titleBlink * 0.05) % 40) - 40; y < this.HEIGHT; y += 40) {
            ctx.fillRect(157, y, 6, 20);
        }

        // Draw character large
        const bigScale = 6;
        const bigFrames = SpriteRenderer.prerenderSprite(MAIN_CHARACTER, bigScale);
        const charFrame = Math.floor(this.titleBlink / 300) % 3;
        const charX = this.WIDTH / 2 - (16 * bigScale) / 2;
        ctx.drawImage(bigFrames[charFrame], charX, 180);

        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIXEL', this.WIDTH / 2, 60);
        ctx.fillStyle = '#FFDD44';
        ctx.fillText('CROSSING', this.WIDTH / 2, 90);

        // Subtitle
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '12px monospace';
        ctx.fillText('위험한 거리를 건너라!', this.WIDTH / 2, 115);

        // Blink "TAP TO START"
        if (Math.floor(this.titleBlink / 500) % 2 === 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('TAP TO START', this.WIDTH / 2, 430);
        }

        ctx.textAlign = 'left';
    }

    renderStageSelect(ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE SELECT', this.WIDTH / 2, 40);

        // Subtitle
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '11px monospace';
        ctx.fillText('스테이지를 선택하세요', this.WIDTH / 2, 60);

        // Character
        ctx.drawImage(this.playerFrames[0], this.WIDTH / 2 - 24, 72);

        // Stage grid
        const gridX = 40;
        const gridY = 120;
        const cellW = 120;
        const cellH = 55;
        const gap = 5;

        for (let i = 0; i < 10; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const cx = gridX + col * (cellW + gap);
            const cy = gridY + row * (cellH + gap);
            const unlocked = this.isStageUnlocked(i);
            const cleared = this.clearedStages.includes(i);

            // Background
            if (cleared) {
                ctx.fillStyle = '#2a4a2a';
            } else if (unlocked) {
                ctx.fillStyle = '#2a2a4a';
            } else {
                ctx.fillStyle = '#2a2a2a';
            }
            ctx.fillRect(cx, cy, cellW, cellH);

            // Border
            ctx.strokeStyle = cleared ? '#44AA44' : unlocked ? '#4466AA' : '#444444';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx, cy, cellW, cellH);

            // Stage number
            ctx.fillStyle = unlocked ? '#FFFFFF' : '#666666';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${i + 1}`, cx + 8, cy + 22);

            // Stage subtitle
            ctx.font = '10px monospace';
            ctx.fillStyle = unlocked ? '#CCCCCC' : '#555555';
            ctx.fillText(STAGES[i].subtitle, cx + 8, cy + 40);

            // Star or Lock icon
            if (cleared) {
                ctx.drawImage(this.starCanvas, cx + cellW - 30, cy + 5);
            } else if (!unlocked) {
                ctx.drawImage(this.lockCanvas, cx + cellW - 30, cy + 5);
            }
        }

        ctx.textAlign = 'left';
    }

    renderPlaying(ctx) {
        const stage = STAGES[this.currentStage];
        const roadLeft = (this.WIDTH - this.WIDTH * stage.roadWidth) / 2;
        const roadRight = roadLeft + this.WIDTH * stage.roadWidth;
        const roadWidth = this.WIDTH * stage.roadWidth;
        const tileSize = 16 * this.SCALE;

        // Draw grass background
        for (let y = -tileSize; y < this.HEIGHT + tileSize; y += tileSize) {
            for (let x = 0; x < this.WIDTH; x += tileSize) {
                ctx.drawImage(this.grassCanvas, x, y + (this.tileOffset % tileSize));
            }
        }

        // Draw sidewalk
        const sidewalkWidth = 20;
        for (let y = -tileSize; y < this.HEIGHT + tileSize; y += tileSize) {
            ctx.drawImage(this.sidewalkCanvas, roadLeft - sidewalkWidth, y + (this.tileOffset % tileSize));
            ctx.drawImage(this.sidewalkCanvas, roadRight, y + (this.tileOffset % tileSize));
        }

        // Draw road
        for (let y = -tileSize; y < this.HEIGHT + tileSize; y += tileSize) {
            for (let x = roadLeft; x < roadRight; x += tileSize) {
                ctx.drawImage(this.roadTileCanvas, x, y + (this.tileOffset % tileSize));
            }
        }

        // Center line
        ctx.fillStyle = '#CCCC44';
        const centerX = this.WIDTH / 2 - 2;
        for (let y = -40 + (this.tileOffset % 40); y < this.HEIGHT + 40; y += 40) {
            ctx.fillRect(centerX, y, 4, 20);
        }

        // Trees (decorative)
        for (const tree of this.trees) {
            const treeY = ((tree.baseY - this.distanceTraveled) % (stage.levelLength + 500));
            const screenY = this.HEIGHT - treeY * this.HEIGHT / 1000;
            if (screenY > -100 && screenY < this.HEIGHT + 50) {
                ctx.drawImage(this.treeCanvases[0], tree.x, screenY);
            }
        }

        // Flag (when near the end)
        const flagDistance = stage.levelLength - this.distanceTraveled;
        if (flagDistance < this.HEIGHT * 2) {
            const flagY = -flagDistance + this.HEIGHT * 0.3;

            // Finish line
            for (let x = roadLeft; x < roadRight; x += this.finishLineCanvas.width) {
                ctx.drawImage(this.finishLineCanvas, x, flagY);
            }

            // Flag
            const flagFrame = Math.floor(Date.now() / 500) % 2;
            ctx.drawImage(this.flagCanvases[flagFrame], this.WIDTH / 2 - 24, flagY - 70);
        }

        // Draw obstacles (sorted by Y for proper overlap)
        const allEntities = [...this.obstacles, ...this.soccerBalls];
        allEntities.sort((a, b) => a.y - b.y);

        for (const entity of allEntities) {
            if (entity.vx !== undefined) {
                // Soccer ball
                ctx.drawImage(this.ballFrames[entity.frame], entity.x, entity.y);
                continue;
            }

            let frames;
            switch (entity.type) {
                case OBSTACLE_TYPES.WALKER:
                    frames = this.personVariants[entity.variant || 0];
                    break;
                case OBSTACLE_TYPES.PLAYING:
                    frames = this.playingFrames;
                    break;
                case OBSTACLE_TYPES.SOCCER:
                    frames = this.soccerFrames;
                    break;
                case OBSTACLE_TYPES.BICYCLE:
                    frames = this.bicycleVariants[entity.variant || 0];
                    break;
                case OBSTACLE_TYPES.MOTORCYCLE:
                    frames = this.motorcycleVariants[entity.variant || 0];
                    break;
            }
            if (frames) {
                ctx.drawImage(frames[entity.frame % frames.length], entity.x, entity.y);
            }
        }

        // Draw player
        if (this.player && this.state !== GameState.GAME_OVER || (this.state === GameState.GAME_OVER && Math.floor(this.gameOverTimer / 100) % 2 === 0)) {
            ctx.drawImage(this.playerFrames[this.player.frame], this.player.x, this.player.y);
        }

        // HUD
        this.renderHUD(ctx);

        // Mobile controls
        this.renderMobileControls(ctx);
    }

    renderHUD(ctx) {
        const stage = STAGES[this.currentStage];

        // Stage name
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(5, 5, 95, 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Stage ${this.currentStage + 1}`, 10, 20);

        // Progress bar
        const barX = this.WIDTH - 110;
        const barY = 8;
        const barW = 100;
        const barH = 14;
        const progress = Math.min(1, this.distanceTraveled / stage.levelLength);

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = progress > 0.8 ? '#44DD44' : '#4488DD';
        ctx.fillRect(barX, barY, barW * progress, barH);

        // Flag icon at end of bar
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(barX + barW - 2, barY - 3, 8, 6);
        ctx.fillStyle = '#AAAAAA';
        ctx.fillRect(barX + barW - 3, barY - 4, 2, barH + 6);

        // Distance text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(progress * 100)}%`, barX + barW / 2, barY + 11);
        ctx.textAlign = 'left';
    }

    renderMobileControls(ctx) {
        // Semi-transparent control areas
        const btnSize = 50;
        const btnY = this.HEIGHT - btnSize - 15;
        const alpha = (this.input.touchLeft || this.input.touchRight) ? 0.4 : 0.2;

        // Left button
        ctx.globalAlpha = this.input.touchLeft ? 0.5 : alpha;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(40, btnY, btnSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.8;
        ctx.drawImage(this.arrowLeftCanvas, 40 - 16, btnY - 16);

        // Right button
        ctx.globalAlpha = this.input.touchRight ? 0.5 : alpha;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.WIDTH - 40, btnY, btnSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.8;
        ctx.drawImage(this.arrowRightCanvas, this.WIDTH - 40 - 16, btnY - 16);

        ctx.globalAlpha = 1.0;
    }

    renderGameOver(ctx) {
        // Darken overlay
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Impact effect
        if (this.gameOverTimer < 300) {
            ctx.fillStyle = `rgba(255,50,50,${0.3 - this.gameOverTimer / 1000})`;
            ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        }

        // Text
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.WIDTH / 2, 230);

        ctx.fillStyle = '#CCCCCC';
        ctx.font = '12px monospace';
        ctx.fillText(`Stage ${this.currentStage + 1} - ${STAGES[this.currentStage].subtitle}`, this.WIDTH / 2, 260);

        if (this.gameOverTimer > 1000) {
            // Retry button
            ctx.fillStyle = '#446688';
            ctx.fillRect(this.WIDTH / 2 - 80, 300, 70, 35);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 13px monospace';
            ctx.fillText('RETRY', this.WIDTH / 2 - 45, 322);

            // Menu button
            ctx.fillStyle = '#664444';
            ctx.fillRect(this.WIDTH / 2 + 10, 300, 70, 35);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('MENU', this.WIDTH / 2 + 45, 322);
        }

        ctx.textAlign = 'left';
    }

    renderStageClear(ctx) {
        // Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Sparkle effect
        if (this.clearTimer < 2000) {
            for (let i = 0; i < 8; i++) {
                const angle = (this.clearTimer / 500 + i * 0.785) % (Math.PI * 2);
                const radius = 40 + Math.sin(this.clearTimer / 200) * 15;
                const sx = this.WIDTH / 2 + Math.cos(angle) * radius;
                const sy = 200 + Math.sin(angle) * radius;
                ctx.fillStyle = `hsl(${(this.clearTimer / 5 + i * 45) % 360}, 100%, 70%)`;
                ctx.fillRect(sx - 3, sy - 3, 6, 6);
            }
        }

        // Text
        ctx.fillStyle = '#FFDD44';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE CLEAR!', this.WIDTH / 2, 210);

        // Star
        ctx.drawImage(this.starCanvas, this.WIDTH / 2 - 12, 225);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px monospace';
        ctx.fillText(`Stage ${this.currentStage + 1} Complete!`, this.WIDTH / 2, 270);

        ctx.fillStyle = '#AAAAAA';
        ctx.font = '11px monospace';
        ctx.fillText(STAGES[this.currentStage].subtitle, this.WIDTH / 2, 290);

        if (this.clearTimer > 1500) {
            if (this.currentStage < 9) {
                // Next Stage button
                ctx.fillStyle = '#448844';
                ctx.fillRect(this.WIDTH / 2 - 80, 310, 70, 35);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 11px monospace';
                ctx.fillText('NEXT', this.WIDTH / 2 - 45, 332);
            }

            // Menu button
            ctx.fillStyle = '#664444';
            ctx.fillRect(this.WIDTH / 2 + 10, 310, 70, 35);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('MENU', this.WIDTH / 2 + 45, 332);
        }

        ctx.textAlign = 'left';
    }
}
