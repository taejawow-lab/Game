const GameState = {
    NAME_INPUT: 'name_input',
    TITLE: 'title',
    STAGE_SELECT: 'stage_select',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    STAGE_CLEAR: 'stage_clear',
    ENDING: 'ending',
    TOTAL_RANKING: 'total_ranking',
    RANKING_VIEW: 'ranking_view',
    CHARACTER_CUSTOMIZE: 'customize',
};

class Game {
    constructor(canvas, input) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.input = input;
        this.WIDTH = 320;
        this.HEIGHT = 480;
        this.SCALE = 2;
        canvas.width = this.WIDTH;
        canvas.height = this.HEIGHT;

        // Player name
        this.playerName = this.loadName();
        this.nameChars = this.playerName ? this.playerName.split('') : [];
        this.customization = this.loadCustomization();
        this.state = this.playerName ? GameState.TITLE : GameState.NAME_INPUT;

        this.currentStage = 0;
        this.clearedStages = this.loadProgress();
        this.score = 0;
        this.coins = [];
        this.titleBlink = 0;
        this.gameOverTimer = 0;
        this.clearTimer = 0;

        // Leaderboard & ending
        this.stageScores = [];          // scores per stage in current run
        this.cachedLeaderboard = [];    // fetched global leaderboard for display
        this.cachedTotalLB = [];        // total score leaderboard
        this.endingTimer = 0;
        this.endingPhase = 0;           // 0=walk, 1=credits, 2=done
        this.endingScrollY = 0;
        this.totalRankTimer = 0;
        this.rankingViewTab = 0;    // 0~9 = stage, 10 = total
        this.rankingViewData = [];  // cached data for current tab
        this.stepTimer = 0;
        this.spawnTimer = 0;
        this.coinSpawnTimer = 0;
        this.player = null;
        this.obstacles = [];
        this.soccerBalls = [];
        this.distanceTraveled = 0;
        this.tileOffset = 0;
        this.buildings = [];
        this.errorMsg = null;

        // Prerender all sprites
        this.SP = this.SCALE;
        this._miniSpriteCache = {};
        this._rebuildPlayerSprite();

        // Person type prerendered frames
        this.personTypeFrames = PERSON_TYPES.map(p => SpriteRenderer.prerenderSprite(p, this.SP));
        this.personVariantFrames = PERSON_VARIANTS.map(c => SpriteRenderer.prerenderSpriteWithColors(PERSON_DOWN, this.SP, c));
        this.playingFrames = SpriteRenderer.prerenderSprite(PERSON_PLAYING, this.SP);
        this.soccerFrames = SpriteRenderer.prerenderSprite(SOCCER_PLAYER, this.SP);
        this.ballFrames = SpriteRenderer.prerenderSprite(SOCCER_BALL, this.SP);
        this.bicycleVariants = BICYCLE_VARIANTS.map(c => SpriteRenderer.prerenderSpriteWithColors(BICYCLE, this.SP, c));
        this.motorcycleVariants = MOTORCYCLE_VARIANTS.map(c => SpriteRenderer.prerenderSpriteWithColors(MOTORCYCLE, this.SP, c));

        // Environment
        this.roadCanvas = SpriteRenderer.prerenderSprite(ROAD_TILE, this.SP)[0];
        this.dirtCanvas = SpriteRenderer.prerenderSprite(DIRT_TILE, this.SP)[0];
        this.sidewalkCanvas = SpriteRenderer.prerenderSprite(SIDEWALK_TILE, this.SP)[0];
        this.grassCanvas = SpriteRenderer.prerenderSprite(GRASS_TILE, this.SP)[0];
        this.finishCanvas = SpriteRenderer.prerenderSprite(FINISH_LINE, this.SP)[0];
        this.flagCanvases = SpriteRenderer.prerenderSprite(FLAG, this.SP);
        this.dogCanvases = SpriteRenderer.prerenderSprite(DOG, this.SP);
        this.treeCanvases = SpriteRenderer.prerenderSprite(TREE, this.SP);
        this.houseCanvas = SpriteRenderer.prerenderSprite(HOUSE_SMALL, this.SP);
        this.buildingCanvas = SpriteRenderer.prerenderSprite(BUILDING, this.SP);
        this.playgroundCanvas = SpriteRenderer.prerenderSprite(PLAYGROUND, this.SP);
        this.schoolCanvas = SpriteRenderer.prerenderSprite(SCHOOL, this.SP);
        this.fenceCanvas = SpriteRenderer.prerenderSprite(FENCE, this.SP);

        // Static obstacles
        this.staticObstacleCanvases = STATIC_OBSTACLES.map(s => SpriteRenderer.prerenderSprite(s, this.SP)[0]);

        // New buildings
        this.shopCanvas = SpriteRenderer.prerenderSprite(SHOP, this.SP);
        this.cafeCanvas = SpriteRenderer.prerenderSprite(CAFE, this.SP);
        this.tallAptCanvas = SpriteRenderer.prerenderSprite(TALL_APARTMENT, this.SP);
        this.lampCanvas = SpriteRenderer.prerenderSprite(LAMP_POST, this.SP);
        this.vendingCanvas = SpriteRenderer.prerenderSprite(VENDING_MACHINE, this.SP);
        // New items
        this.bombCanvases = SpriteRenderer.prerenderSprite(BOMB, this.SP);
        this.bigStarCanvases = SpriteRenderer.prerenderSprite(BIG_STAR, this.SP);

        // UI
        this.coinCanvases = SpriteRenderer.prerenderSprite(COIN, this.SP);
        this.heartCanvas = SpriteRenderer.prerenderSprite(HEART, this.SP)[0];
        this.starCanvas = SpriteRenderer.prerenderSprite(STAR, this.SP)[0];
        this.lockCanvas = SpriteRenderer.prerenderSprite(LOCK, this.SP)[0];
        this.arrowLCanvas = SpriteRenderer.prerenderSprite(ARROW_LEFT, 3)[0];
        this.arrowRCanvas = SpriteRenderer.prerenderSprite(ARROW_RIGHT, 3)[0];
    }

    // --- Data persistence ---
    loadName() { try { return localStorage.getItem('pixelCrossing_name') || ''; } catch(e) { return ''; } }
    saveName(n) { try { localStorage.setItem('pixelCrossing_name', n); } catch(e) {} }
    loadProgress() { try { const d = localStorage.getItem('pixelCrossing_cleared'); return d ? JSON.parse(d) : []; } catch(e) { return []; } }
    saveProgress() { try { localStorage.setItem('pixelCrossing_cleared', JSON.stringify(this.clearedStages)); } catch(e) {} }
    loadLeaderboard(stage) { try { const d = localStorage.getItem('pixelCrossing_lb_' + stage); return d ? JSON.parse(d) : []; } catch(e) { return []; } }
    saveLeaderboard(stage, board) { try { localStorage.setItem('pixelCrossing_lb_' + stage, JSON.stringify(board)); } catch(e) {} }
    getBestScore(stage) { const lb = this.loadLeaderboard(stage); return lb.length > 0 ? lb[0].score : 0; }
    loadCustomization() {
        try {
            const d = localStorage.getItem('pixelCrossing_custom');
            const c = d ? JSON.parse(d) : {hair:0,body:2,shirt:0,pants:0,socks:0};
            if (c.body === undefined) c.body = 2; // migrate old saves
            return c;
        } catch(e) { return {hair:0,body:2,shirt:0,pants:0,socks:0}; }
    }
    saveCustomization() {
        try { localStorage.setItem('pixelCrossing_custom', JSON.stringify(this.customization)); } catch(e) {}
    }
    _rebuildPlayerSprite() {
        const c = this.customization;
        const sprite = buildCharacterSprite(c.hair, c.body, c.shirt, c.pants, c.socks);
        this.playerFrames = SpriteRenderer.prerenderSprite(sprite, this.SP);
        this.titleCharFrames = SpriteRenderer.prerenderSprite(sprite, 3);
        this.playerMiniFrames = SpriteRenderer.prerenderSprite(sprite, 1);
    }
    _getMiniSprite(look) {
        if (!look) return this.playerMiniFrames;
        const bdy = look.body !== undefined ? look.body : 2;
        const key = '' + (look.hair||0) + bdy + (look.shirt||0) + (look.pants||0) + (look.socks||0);
        if (!this._miniSpriteCache[key]) {
            const sprite = buildCharacterSprite(look.hair||0, bdy, look.shirt||0, look.pants||0, look.socks||0);
            this._miniSpriteCache[key] = SpriteRenderer.prerenderSprite(sprite, 1);
        }
        return this._miniSpriteCache[key];
    }
    addToLeaderboard(stage, name, score) {
        const lb = this.loadLeaderboard(stage);
        lb.push({ name, score, look: this.customization ? {...this.customization} : null });
        lb.sort((a, b) => b.score - a.score);
        this.saveLeaderboard(stage, lb.slice(0, 5));
    }
    isStageUnlocked(i) { return i === 0 || this.clearedStages.includes(i - 1); }

    // --- Start stage ---
    startStage(idx) {
        this.currentStage = idx;
        const stage = STAGES[idx];
        const sw = MAIN_CHARACTER.width * this.SP, sh = MAIN_CHARACTER.height * this.SP;
        this.player = { x: this.WIDTH / 2 - sw / 2, y: this.HEIGHT * 0.72, width: sw, height: sh, frame: 0, frameTimer: 0, speed: 220 };
        this.obstacles = [];
        this.soccerBalls = [];
        this.coins = [];
        this.score = 0;
        this.distanceTraveled = 0;
        this.tileOffset = 0;
        this.spawnTimer = 0;
        this.coinSpawnTimer = 0;
        this.stepTimer = 0;
        this.state = GameState.PLAYING;
        // Generate static road obstacles (carts, rocks, trash, pots)
        this.staticObs = [];
        // Generate buildings
        this.buildings = [];
        this.bombs = [];
        this.bigStars = [];
        const roadL = (this.WIDTH - this.WIDTH * stage.roadWidth) / 2;
        const roadR = roadL + this.WIDTH * stage.roadWidth;
        const bTypes = stage.buildings || ['tree'];
        // Left side
        let leftY = Math.random() * 30;
        while (leftY < stage.levelLength + 200) {
            const bType = bTypes[Math.floor(Math.random() * bTypes.length)];
            const spacing = 40 + Math.random() * 50;
            this.buildings.push({
                type: bType, side: 'left',
                x: Math.max(0, roadL - 42 + Math.random() * 8),
                worldY: leftY,
            });
            leftY += spacing;
        }
        // Right side
        let rightY = 20 + Math.random() * 30;
        while (rightY < stage.levelLength + 200) {
            const bType = bTypes[Math.floor(Math.random() * bTypes.length)];
            const spacing = 40 + Math.random() * 50;
            this.buildings.push({
                type: bType, side: 'right',
                x: roadR + 2 + Math.random() * 8,
                worldY: rightY,
            });
            rightY += spacing;
        }
        // Place static obstacles on road at intervals
        const numStatic = 5 + Math.floor(stage.levelLength / 600);
        for (let i = 0; i < numStatic; i++) {
            const typeIdx = Math.floor(Math.random() * STATIC_OBSTACLES.length);
            const spr = STATIC_OBSTACLES[typeIdx];
            const sw = spr.width * this.SP;
            const sh = spr.height * this.SP;
            const ox = roadL + Math.random() * (roadR - roadL - sw);
            const oy = 200 + i * (stage.levelLength / numStatic) + Math.random() * 100;
            this.staticObs.push({ typeIdx, x: ox, worldY: oy, width: sw, height: sh });
        }
        Sound.init();
        Sound.stageStart();
        Sound.startBGM(idx);
        this.input.clearClicks();
    }

    // --- Spawn obstacle ---
    spawnObstacle() {
        const stage = STAGES[this.currentStage];
        if (this.obstacles.length >= stage.maxObstacles) return;
        const totalW = stage.obstacles.reduce((s, o) => s + o.weight, 0);
        let r = Math.random() * totalW;
        let sel = stage.obstacles[0];
        for (const o of stage.obstacles) { r -= o.weight; if (r <= 0) { sel = o; break; } }
        const sw = 14 * this.SP;
        const roadL = (this.WIDTH - this.WIDTH * stage.roadWidth) / 2;
        const roadR = roadL + this.WIDTH * stage.roadWidth;
        const spX = roadL + Math.random() * (roadR - roadL - sw);
        const obs = { type: sel.type, x: spX, y: -sw - 20, width: sw, height: 20 * this.SP, speed: sel.speed * stage.speedMultiplier, frame: 0, frameTimer: 0, spawnTime: Date.now(), startX: spX };
        if (sel.type === OBSTACLE_TYPES.PLAYING) { obs.zigzagAmp = sel.zigzagAmplitude || 35; obs.zigzagFreq = sel.zigzagFreq || 0.002; }
        if (sel.type === OBSTACLE_TYPES.MOTORCYCLE) { obs.wobble = sel.wobbleAmplitude || 15; }
        if (sel.type === OBSTACLE_TYPES.SOCCER) { obs.ballTimer = 1000 + Math.random() * 2000; obs.ballSpeed = sel.ballSpeed || 70; }
        // Variant
        if (sel.type === OBSTACLE_TYPES.WALKER) {
            obs.personType = Math.floor(Math.random() * (this.personTypeFrames.length + this.personVariantFrames.length));
        } else if (sel.type === OBSTACLE_TYPES.BICYCLE) {
            obs.variant = Math.floor(Math.random() * this.bicycleVariants.length);
            Sound.bicycleBell();
        } else if (sel.type === OBSTACLE_TYPES.MOTORCYCLE) {
            obs.variant = Math.floor(Math.random() * this.motorcycleVariants.length);
            Sound.motorPass();
        }
        // Adjust height for PERSON_B (18 tall)
        if (sel.type === OBSTACLE_TYPES.WALKER && obs.personType === 1) { obs.height = 18 * this.SP; }
        this.obstacles.push(obs);
    }

    // --- UPDATE ---
    update(dt) {
        switch (this.state) {
            case GameState.NAME_INPUT: this.updateNameInput(); break;
            case GameState.TITLE: this.updateTitle(dt); break;
            case GameState.STAGE_SELECT: this.updateStageSelect(); break;
            case GameState.PLAYING: this.updatePlaying(dt); break;
            case GameState.GAME_OVER: this.updateGameOver(dt); break;
            case GameState.STAGE_CLEAR: this.updateStageClear(dt); break;
            case GameState.ENDING: this.updateEnding(dt); break;
            case GameState.TOTAL_RANKING: this.updateTotalRanking(dt); break;
            case GameState.RANKING_VIEW: this.updateRankingView(); break;
            case GameState.CHARACTER_CUSTOMIZE: this.updateCustomize(); break;
        }
    }

    updateNameInput() {
        const click = this.input.getClick();
        if (!click) return;
        const cols = 7, cellW = 38, cellH = 32, startX = 15, startY = 200;
        for (let i = 0; i < 26; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const cx = startX + col * cellW, cy = startY + row * cellH;
            if (Collision.pointInRect(click.x, click.y, cx, cy, cellW - 4, cellH - 4)) {
                if (this.nameChars.length < 8) this.nameChars.push(String.fromCharCode(65 + i));
                return;
            }
        }
        // Backspace button
        if (Collision.pointInRect(click.x, click.y, 15, 370, 80, 32)) {
            this.nameChars.pop();
        }
        // OK button
        if (Collision.pointInRect(click.x, click.y, 220, 370, 80, 32) && this.nameChars.length >= 2) {
            this.playerName = this.nameChars.join('');
            this.saveName(this.playerName);
            this.state = GameState.CHARACTER_CUSTOMIZE;
            Sound.init();
            Sound.select();
        }
    }

    updateTitle(dt) {
        this.titleBlink += dt;
        if (this.input.consumeConfirm()) { Sound.init(); Sound.select(); this.state = GameState.STAGE_SELECT; this.input.clearClicks(); return; }
        const click = this.input.getClick();
        if (click) {
            if (this._checkSoundToggle(click)) return;
            // RANKING button
            if (Collision.pointInRect(click.x, click.y, this.WIDTH/2-45, 295, 90, 28)) {
                Sound.init(); Sound.select();
                this._openRankingView();
                return;
            }
            // CUSTOMIZE button
            if (Collision.pointInRect(click.x, click.y, this.WIDTH/2-45, 330, 90, 28)) {
                Sound.init(); Sound.select();
                this.state = GameState.CHARACTER_CUSTOMIZE;
                this.input.clearClicks();
                return;
            }
            Sound.init(); Sound.select(); this.state = GameState.STAGE_SELECT; this.input.clearClicks();
        }
    }

    updateStageSelect() {
        const click = this.input.getClick();
        if (!click) return;
        if (this._checkSoundToggle(click)) return;
        // Back button
        if (Collision.pointInRect(click.x, click.y, 10, this.HEIGHT - 40, 60, 30)) {
            Sound.select();
            this.state = GameState.TITLE;
            this.input.clearClicks();
            return;
        }
        const gridX = 25, gridY = 100, cellW = 132, cellH = 58, gap = 6;
        for (let i = 0; i < 10; i++) {
            const col = i % 2, row = Math.floor(i / 2);
            const cx = gridX + col * (cellW + gap), cy = gridY + row * (cellH + gap);
            if (Collision.pointInRect(click.x, click.y, cx, cy, cellW, cellH) && this.isStageUnlocked(i)) {
                Sound.select();
                this.startStage(i);
                return;
            }
        }
    }

    updatePlaying(dt) {
        const stage = STAGES[this.currentStage];
        const roadL = (this.WIDTH - this.WIDTH * stage.roadWidth) / 2;
        const roadR = roadL + this.WIDTH * stage.roadWidth;

        // Player movement
        if (this.input.isLeft()) this.player.x -= this.player.speed * dt / 1000;
        if (this.input.isRight()) this.player.x += this.player.speed * dt / 1000;
        this.player.x = Math.max(roadL, Math.min(roadR - this.player.width, this.player.x));

        // Walk animation + step sound
        this.player.frameTimer += dt;
        if (this.player.frameTimer > 180) { this.player.frameTimer -= 180; this.player.frame = (this.player.frame + 1) % 3; }
        this.stepTimer += dt;
        if (this.stepTimer > 350) { this.stepTimer -= 350; Sound.step(); }

        // Scroll
        this.distanceTraveled += stage.scrollSpeed * dt / 1000;
        this.tileOffset = (this.tileOffset + stage.scrollSpeed * dt / 1000) % (16 * this.SP);

        // Win check - player must visually cross the finish line
        // Flag is at world position levelLength, screen Y = -(levelLength - distanceTraveled) + HEIGHT * 0.3
        // Player must pass the flag: flagScreenY >= player.y
        const flagScreenY = -(stage.levelLength - this.distanceTraveled) + this.HEIGHT * 0.3;
        if (flagScreenY >= this.player.y) {
            this.state = GameState.STAGE_CLEAR;
            this.clearTimer = 0;
            Sound.stageClear();
            if (!this.clearedStages.includes(this.currentStage)) { this.clearedStages.push(this.currentStage); this.saveProgress(); }
            this.addToLeaderboard(this.currentStage, this.playerName, this.score);
            // Track stage score for total ranking
            this.stageScores[this.currentStage] = this.score;
            // Fetch global leaderboard async
            this.cachedLeaderboard = this.loadLeaderboard(this.currentStage);
            LeaderboardService.submitScore(this.currentStage, this.playerName, this.score, this.customization);
            LeaderboardService.getStageLeaderboard(this.currentStage).then(lb => { this.cachedLeaderboard = lb; });
            return;
        }

        // Spawn obstacles
        this.spawnTimer += dt;
        if (this.spawnTimer >= stage.spawnInterval) { this.spawnTimer -= stage.spawnInterval; this.spawnObstacle(); }

        // Check if near goal - stop spawning items when close to finish line
        const nearGoal = this.distanceTraveled > stage.levelLength - this.HEIGHT * 1.5;

        // Spawn coins (frequent, in clusters) - not near goal
        this.coinSpawnTimer += dt;
        if (!nearGoal && this.coinSpawnTimer > 200) {
            this.coinSpawnTimer = 0;
            if (Math.random() < 0.18) {
                const cw = 8 * this.SP;
                const baseX = roadL + Math.random() * (roadR - roadL - cw * 3);
                const count = 1 + Math.floor(Math.random() * 3);
                for (let ci = 0; ci < count; ci++) {
                    this.coins.push({ x: baseX + ci * (cw + 4), y: -cw - ci * 20, width: cw, height: cw, frame: 0, frameTimer: 0 });
                }
            }
        }

        // Update coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            c.y += stage.scrollSpeed * dt / 1000;
            c.frameTimer += dt;
            if (c.frameTimer > 200) { c.frameTimer -= 200; c.frame = (c.frame + 1) % 2; }
            if (c.y > this.HEIGHT + 20) { this.coins.splice(i, 1); continue; }
            if (Collision.check(this.player, c)) { this.coins.splice(i, 1); this.score += 100; Sound.select(); }
        }

        // Bomb spawn - scales with stage difficulty, not near goal
        // Stage 0-1: very rare, Stage 2-3: rare, Stage 4-5: moderate, Stage 6-7: frequent, Stage 8-9: heavy
        const bombRate = [0.001, 0.002, 0.003, 0.004, 0.005, 0.006, 0.007, 0.008, 0.009, 0.010][this.currentStage] || 0.005;
        if (!nearGoal && Math.random() < bombRate) {
            const bw = 8 * this.SP;
            const bx = roadL + Math.random() * (roadR - roadL - bw);
            if (!this.bombs) this.bombs = [];
            this.bombs.push({ x: bx, y: -bw - 10, width: bw, height: bw, frame: 0, frameTimer: 0 });
        }
        // Big star spawn (rare) - not near goal
        if (!nearGoal && Math.random() < 0.002) {
            const sw = 10 * this.SP;
            const sx = roadL + Math.random() * (roadR - roadL - sw);
            if (!this.bigStars) this.bigStars = [];
            this.bigStars.push({ x: sx, y: -sw - 10, width: sw, height: sw, frame: 0, frameTimer: 0 });
        }

        // Update bombs
        if (this.bombs) {
            for (let i = this.bombs.length - 1; i >= 0; i--) {
                const b = this.bombs[i];
                b.y += stage.scrollSpeed * dt / 1000;
                b.frameTimer += dt;
                if (b.frameTimer > 200) { b.frameTimer -= 200; b.frame = (b.frame + 1) % 2; }
                if (b.y > this.HEIGHT + 20) { this.bombs.splice(i, 1); continue; }
                if (Collision.check(this.player, b)) {
                    this.bombs.splice(i, 1);
                    this.score = Math.max(0, this.score - 500);
                    Sound.bombHit();
                }
            }
        }
        // Update big stars
        if (this.bigStars) {
            for (let i = this.bigStars.length - 1; i >= 0; i--) {
                const s = this.bigStars[i];
                s.y += stage.scrollSpeed * dt / 1000;
                s.frameTimer += dt;
                if (s.frameTimer > 150) { s.frameTimer -= 150; s.frame = (s.frame + 1) % 2; }
                if (s.y > this.HEIGHT + 20) { this.bigStars.splice(i, 1); continue; }
                if (Collision.check(this.player, s)) {
                    this.bigStars.splice(i, 1);
                    this.score += 1000;
                    Sound.starGet();
                }
            }
        }

        // Remove items past the finish line (clean goal area)
        if (nearGoal) {
            const goalScreenY = -(stage.levelLength - this.distanceTraveled) + this.HEIGHT * 0.3;
            const filterAboveGoal = (arr) => {
                if (!arr) return;
                for (let i = arr.length - 1; i >= 0; i--) {
                    if (arr[i].y < goalScreenY) arr.splice(i, 1);
                }
            };
            filterAboveGoal(this.coins);
            filterAboveGoal(this.bombs);
            filterAboveGoal(this.bigStars);
        }

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            const elapsed = Date.now() - obs.spawnTime;
            obs.y += (obs.speed + stage.scrollSpeed) * dt / 1000;
            if (obs.type === OBSTACLE_TYPES.PLAYING) { obs.x = obs.startX + Math.sin(elapsed * obs.zigzagFreq) * obs.zigzagAmp; obs.x = Math.max(roadL, Math.min(roadR - obs.width, obs.x)); }
            if (obs.type === OBSTACLE_TYPES.MOTORCYCLE) { obs.x = obs.startX + Math.sin(elapsed * 0.003) * (obs.wobble || 15); obs.x = Math.max(roadL, Math.min(roadR - obs.width, obs.x)); }
            if (obs.type === OBSTACLE_TYPES.SOCCER) {
                obs.ballTimer -= dt;
                if (obs.ballTimer <= 0) {
                    obs.ballTimer = 1500 + Math.random() * 2000;
                    obs.frame = 1; Sound.kick();
                    setTimeout(() => { if (obs) obs.frame = 0; }, 300);
                    const bs = 6 * this.SP;
                    this.soccerBalls.push({ x: obs.x + obs.width / 2 - bs / 2, y: obs.y + obs.height / 2, width: bs, height: bs, vx: (Math.random() - 0.5) * obs.ballSpeed * 2, vy: obs.ballSpeed, frame: 0, frameTimer: 0 });
                }
            }
            obs.frameTimer += dt;
            if (obs.frameTimer > 250) { obs.frameTimer -= 250; if (obs.type !== OBSTACLE_TYPES.SOCCER) obs.frame = (obs.frame + 1) % 2; }
            if (obs.y > this.HEIGHT + 50) { this.obstacles.splice(i, 1); continue; }
            if (Collision.check(this.player, obs)) { this.state = GameState.GAME_OVER; this.gameOverTimer = 0; Sound.gameOver(); return; }
        }

        // Update soccer balls
        for (let i = this.soccerBalls.length - 1; i >= 0; i--) {
            const b = this.soccerBalls[i];
            b.x += b.vx * dt / 1000; b.y += b.vy * dt / 1000;
            b.frameTimer += dt; if (b.frameTimer > 150) { b.frameTimer -= 150; b.frame = (b.frame + 1) % 2; }
            if (b.y > this.HEIGHT + 30 || b.x < -30 || b.x > this.WIDTH + 30) { this.soccerBalls.splice(i, 1); continue; }
            if (Collision.check(this.player, b)) { this.state = GameState.GAME_OVER; this.gameOverTimer = 0; Sound.gameOver(); return; }
        }
        // Check static obstacle collisions
        for (const so of this.staticObs) {
            const sy = this.HEIGHT - (so.worldY - this.distanceTraveled);
            if (sy < -100 || sy > this.HEIGHT + 50) continue;
            const screenObj = { x: so.x, y: sy, width: so.width, height: so.height };
            if (Collision.check(this.player, screenObj)) { this.state = GameState.GAME_OVER; this.gameOverTimer = 0; Sound.gameOver(); return; }
        }

        this.input.getClick(); // consume
    }

    updateGameOver(dt) {
        this.gameOverTimer += dt;
        if (this.gameOverTimer > 1000) {
            const c = this.input.getClick();
            if (c) {
                if (Collision.pointInRect(c.x, c.y, this.WIDTH/2-80, 310, 70, 35)) this.startStage(this.currentStage);
                else if (Collision.pointInRect(c.x, c.y, this.WIDTH/2+10, 310, 70, 35)) { this.state = GameState.STAGE_SELECT; this.input.clearClicks(); }
            } else if (this.input.consumeConfirm()) this.startStage(this.currentStage);
        }
    }

    updateStageClear(dt) {
        this.clearTimer += dt;
        if (this.clearTimer > 1500) {
            const c = this.input.getClick();
            if (c) {
                if (this.currentStage < 9 && Collision.pointInRect(c.x, c.y, this.WIDTH/2-80, 375, 70, 35)) {
                    this.startStage(this.currentStage + 1);
                } else if (this.currentStage === 9 && Collision.pointInRect(c.x, c.y, this.WIDTH/2-80, 375, 70, 35)) {
                    this._startEnding();
                } else if (Collision.pointInRect(c.x, c.y, this.WIDTH/2+10, 375, 70, 35)) {
                    this.state = GameState.STAGE_SELECT; this.input.clearClicks();
                }
            } else if (this.input.consumeConfirm()) {
                if (this.currentStage < 9) this.startStage(this.currentStage + 1);
                else this._startEnding();
            }
        }
    }

    _startEnding() {
        this.state = GameState.ENDING;
        this.endingTimer = 0;
        this.endingPhase = 0;
        this.endingScrollY = 0;
        // Calculate total score
        const totalScore = this.stageScores.reduce((sum, s) => sum + (s || 0), 0);
        // Submit total score
        LeaderboardService.submitTotalScore(this.playerName, totalScore, [...this.stageScores], this.customization);
        LeaderboardService.getTotalLeaderboard().then(lb => { this.cachedTotalLB = lb; });
        this.cachedTotalLB = LeaderboardService._getTotalLocal();
        Sound.stageClear();
    }

    updateEnding(dt) {
        this.endingTimer += dt;
        if (this.endingPhase === 0) {
            // Walking scene - 6 seconds
            if (this.endingTimer > 6000) { this.endingPhase = 1; this.endingTimer = 0; this.endingScrollY = 0; }
        } else if (this.endingPhase === 1) {
            // Credits scroll
            this.endingScrollY += dt * 0.03;
            const c = this.input.getClick();
            if (c && this.endingTimer > 2000) {
                // Skip to total ranking
                this._goToTotalRanking();
            }
            if (this.endingTimer > 12000) {
                this._goToTotalRanking();
            }
        }
    }

    _goToTotalRanking() {
        this.state = GameState.TOTAL_RANKING;
        this.totalRankTimer = 0;
        LeaderboardService.getTotalLeaderboard().then(lb => { this.cachedTotalLB = lb; });
    }

    updateTotalRanking(dt) {
        this.totalRankTimer += dt;
        if (this.totalRankTimer > 1500) {
            const c = this.input.getClick();
            if (c) {
                this.state = GameState.TITLE;
                this.titleBlink = 0;
                this.stageScores = [];
                this.input.clearClicks();
            }
        }
    }

    _checkSoundToggle(click) {
        if (Collision.pointInRect(click.x, click.y, this.WIDTH - 40, 5, 35, 22)) { Sound.init(); Sound.toggle(); return true; }
        return false;
    }

    // --- RENDER ---
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        switch (this.state) {
            case GameState.NAME_INPUT: this.renderNameInput(ctx); break;
            case GameState.TITLE: this.renderTitle(ctx); break;
            case GameState.STAGE_SELECT: this.renderStageSelect(ctx); break;
            case GameState.PLAYING: this.renderPlaying(ctx); break;
            case GameState.GAME_OVER: this.renderPlaying(ctx); this.renderGameOver(ctx); break;
            case GameState.STAGE_CLEAR: this.renderPlaying(ctx); this.renderStageClear(ctx); break;
            case GameState.ENDING: this.renderEnding(ctx); break;
            case GameState.TOTAL_RANKING: this.renderTotalRanking(ctx); break;
            case GameState.RANKING_VIEW: this.renderRankingView(ctx); break;
            case GameState.CHARACTER_CUSTOMIZE: this.renderCustomize(ctx); break;
        }
    }

    renderNameInput(ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        // Title
        ctx.fillStyle = '#FFDD44';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('이름을 입력하세요', this.WIDTH / 2, 60);
        // Character
        ctx.drawImage(this.titleCharFrames[0], this.WIDTH / 2 - 30, 75);
        // Name display
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px monospace';
        const nameStr = this.nameChars.join('') + (Math.floor(Date.now() / 500) % 2 === 0 ? '_' : '');
        ctx.fillText(nameStr, this.WIDTH / 2, 170);
        // Alphabet grid
        const cols = 7, cellW = 38, cellH = 32, startX = 15, startY = 200;
        ctx.font = 'bold 16px monospace';
        for (let i = 0; i < 26; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const cx = startX + col * cellW, cy = startY + row * cellH;
            ctx.fillStyle = '#2a2a4a';
            ctx.fillRect(cx, cy, cellW - 4, cellH - 4);
            ctx.strokeStyle = '#4466AA';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx, cy, cellW - 4, cellH - 4);
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.fillText(String.fromCharCode(65 + i), cx + (cellW - 4) / 2, cy + 22);
        }
        // Backspace
        ctx.fillStyle = '#664444';
        ctx.fillRect(15, 370, 80, 32);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DELETE', 55, 390);
        // OK
        ctx.fillStyle = this.nameChars.length >= 2 ? '#446644' : '#333333';
        ctx.fillRect(220, 370, 80, 32);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('OK', 260, 390);
        ctx.textAlign = 'left';
    }

    renderTitle(ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        // Decorative road
        ctx.fillStyle = '#777777';
        ctx.fillRect(80, 0, 160, this.HEIGHT);
        ctx.fillStyle = '#BBAA99';
        ctx.fillRect(65, 0, 15, this.HEIGHT);
        ctx.fillRect(240, 0, 15, this.HEIGHT);
        // Dashed line
        ctx.fillStyle = '#CCCC44';
        for (let y = ((this.titleBlink * 0.06) % 40) - 40; y < this.HEIGHT; y += 40) ctx.fillRect(157, y, 6, 18);
        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('미노가', this.WIDTH / 2, 55);
        ctx.fillStyle = '#FFDD44';
        ctx.font = 'bold 30px monospace';
        ctx.fillText('간다!', this.WIDTH / 2, 90);
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '11px monospace';
        ctx.fillText('위험한 골목길을 건너라!', this.WIDTH / 2, 112);
        // Character
        const cf = Math.floor(this.titleBlink / 250) % 3;
        ctx.drawImage(this.titleCharFrames[cf], this.WIDTH / 2 - 30, 140);
        // Dog near character
        const df = Math.floor(this.titleBlink / 600) % 2;
        ctx.drawImage(this.dogCanvases[df], this.WIDTH / 2 - 10, 215);
        // Player name
        ctx.fillStyle = '#88CCFF';
        ctx.font = '12px monospace';
        ctx.fillText('Player: ' + (this.playerName || '???'), this.WIDTH / 2, 280);
        // Ranking button
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(this.WIDTH/2-45, 295, 90, 28);
        ctx.strokeStyle = '#6688CC';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.WIDTH/2-45, 295, 90, 28);
        ctx.fillStyle = '#FFDD44';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('\u2605 RANKING', this.WIDTH / 2, 313);
        // Customize button
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(this.WIDTH/2-45, 330, 90, 28);
        ctx.strokeStyle = '#AA66CC';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.WIDTH/2-45, 330, 90, 28);
        ctx.fillStyle = '#CC88FF';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('CUSTOMIZE', this.WIDTH/2, 348);
        // Blink
        if (Math.floor(this.titleBlink / 500) % 2 === 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 15px monospace';
            ctx.fillText('TAP TO START', this.WIDTH / 2, 450);
        }
        this._renderSoundToggle(ctx);
        ctx.textAlign = 'left';
    }

    renderStageSelect(ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE SELECT', this.WIDTH / 2, 30);
        ctx.fillStyle = '#88CCFF';
        ctx.font = '10px monospace';
        ctx.fillText(this.playerName + ' 의 도전!', this.WIDTH / 2, 48);
        // Character
        ctx.drawImage(this.playerFrames[0], this.WIDTH / 2 - MAIN_CHARACTER.width, 55);
        this._renderSoundToggle(ctx);
        // Grid
        const gridX = 25, gridY = 100, cellW = 132, cellH = 58, gap = 6;
        for (let i = 0; i < 10; i++) {
            const col = i % 2, row = Math.floor(i / 2);
            const cx = gridX + col * (cellW + gap), cy = gridY + row * (cellH + gap);
            const unlocked = this.isStageUnlocked(i), cleared = this.clearedStages.includes(i);
            ctx.fillStyle = cleared ? '#2a4a2a' : unlocked ? '#2a2a4a' : '#222222';
            ctx.fillRect(cx, cy, cellW, cellH);
            ctx.strokeStyle = cleared ? '#44AA44' : unlocked ? '#4466AA' : '#444444';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx, cy, cellW, cellH);
            ctx.fillStyle = unlocked ? '#FFFFFF' : '#666666';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'left';
            ctx.fillText((i + 1) + '.', cx + 6, cy + 18);
            ctx.font = '9px monospace';
            ctx.fillStyle = unlocked ? '#CCCCCC' : '#555555';
            ctx.fillText(STAGES[i].subtitle, cx + 6, cy + 34);
            // Best score
            const best = this.getBestScore(i);
            if (best > 0) { ctx.fillStyle = '#FFDD44'; ctx.font = '9px monospace'; ctx.fillText('BEST:' + best, cx + 6, cy + 48); }
            // Icons
            if (cleared) ctx.drawImage(this.starCanvas, cx + cellW - 20, cy + 4);
            else if (!unlocked) ctx.drawImage(this.lockCanvas, cx + cellW - 20, cy + 4);
        }
        // Back button
        const bx = 10, by = this.HEIGHT - 40, bw = 60, bh = 30;
        ctx.fillStyle = '#3a3a5a';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#6688AA';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← BACK', bx + bw / 2, by + 20);
        ctx.textAlign = 'left';
    }

    renderPlaying(ctx) {
        const stage = STAGES[this.currentStage];
        const roadL = (this.WIDTH - this.WIDTH * stage.roadWidth) / 2;
        const roadR = roadL + this.WIDTH * stage.roadWidth;
        const ts = 16 * this.SP;
        const tOff = this.tileOffset % ts;

        // Grass background
        for (let y = -ts; y < this.HEIGHT + ts; y += ts)
            for (let x = 0; x < this.WIDTH; x += ts)
                ctx.drawImage(this.grassCanvas, x, y + tOff);

        // Sidewalk
        for (let y = -ts; y < this.HEIGHT + ts; y += ts) {
            ctx.drawImage(this.sidewalkCanvas, roadL - ts, y + tOff);
            ctx.drawImage(this.sidewalkCanvas, roadR, y + tOff);
        }

        // Road
        const roadType = stage.roadType || 'paved';
        for (let y = -ts; y < this.HEIGHT + ts; y += ts) {
            for (let x = roadL; x < roadR; x += ts) {
                if (roadType === 'dirt') ctx.drawImage(this.dirtCanvas, x, y + tOff);
                else if (roadType === 'mixed') {
                    const absY = Math.floor((y + this.tileOffset) / (ts * 6));
                    ctx.drawImage(absY % 2 === 0 ? this.roadCanvas : this.dirtCanvas, x, y + tOff);
                }
                else ctx.drawImage(this.roadCanvas, x, y + tOff);
            }
        }

        // Buildings on sides (drawn AFTER road so they're visible)
        for (const b of this.buildings) {
            const wrapLen = stage.levelLength + 600;
            let relY = ((b.worldY - this.distanceTraveled) % wrapLen + wrapLen) % wrapLen;
            const sy = this.HEIGHT - relY;
            if (sy < -100 || sy > this.HEIGHT + 50) continue;
            let bCanvas;
            switch (b.type) {
                case 'house': bCanvas = this.houseCanvas[0]; break;
                case 'building': bCanvas = this.buildingCanvas[0]; break;
                case 'playground': bCanvas = this.playgroundCanvas[0]; break;
                case 'school': bCanvas = this.schoolCanvas[0]; break;
                case 'fence': bCanvas = this.fenceCanvas[0]; break;
                case 'shop': bCanvas = this.shopCanvas[0]; break;
                case 'cafe': bCanvas = this.cafeCanvas[0]; break;
                case 'tall_apt': bCanvas = this.tallAptCanvas[0]; break;
                case 'lamp_post': bCanvas = this.lampCanvas[0]; break;
                case 'vending': bCanvas = this.vendingCanvas[0]; break;
                default: bCanvas = this.treeCanvases[0]; break;
            }
            if (bCanvas) {
                // Position buildings partially off-screen edge, that's OK - gives depth
                const bx = b.side === 'left' ? roadL - bCanvas.width + 4 : roadR - 4;
                ctx.drawImage(bCanvas, bx, sy);
            }
        }

        // Static road obstacles (carts, rocks, trash, pots)
        for (const so of this.staticObs) {
            const sy = this.HEIGHT - (so.worldY - this.distanceTraveled);
            if (sy < -100 || sy > this.HEIGHT + 50) continue;
            ctx.drawImage(this.staticObstacleCanvases[so.typeIdx], so.x, sy);
        }

        // Flag + Dog at end
        const flagDist = stage.levelLength - this.distanceTraveled;
        if (flagDist < this.HEIGHT * 3) {
            const flagY = -flagDist + this.HEIGHT * 0.3;
            for (let x = roadL; x < roadR; x += this.finishCanvas.width)
                ctx.drawImage(this.finishCanvas, x, flagY);
            const ff = Math.floor(Date.now() / 500) % 2;
            ctx.drawImage(this.flagCanvases[ff], this.WIDTH / 2 - 20, flagY - 50);
            // Dog sitting next to flag
            const dogF = Math.floor(Date.now() / 700) % 2;
            ctx.drawImage(this.dogCanvases[dogF], this.WIDTH / 2 - DOG.width, flagY - DOG.height * this.SP + 5);
        }

        // Draw coins
        for (const c of this.coins) ctx.drawImage(this.coinCanvases[c.frame], c.x, c.y);
        // Draw bombs and big stars
        if (this.bombs) for (const b of this.bombs) ctx.drawImage(this.bombCanvases[b.frame], b.x, b.y);
        if (this.bigStars) for (const s of this.bigStars) ctx.drawImage(this.bigStarCanvases[s.frame], s.x, s.y);

        // Draw obstacles sorted by Y
        const all = [...this.obstacles, ...this.soccerBalls];
        all.sort((a, b) => a.y - b.y);
        for (const e of all) {
            if (e.vx !== undefined) { ctx.drawImage(this.ballFrames[e.frame], e.x, e.y); continue; }
            let frames;
            switch (e.type) {
                case OBSTACLE_TYPES.WALKER:
                    if (e.personType < this.personTypeFrames.length) frames = this.personTypeFrames[e.personType];
                    else frames = this.personVariantFrames[(e.personType - this.personTypeFrames.length) % this.personVariantFrames.length];
                    break;
                case OBSTACLE_TYPES.PLAYING: frames = this.playingFrames; break;
                case OBSTACLE_TYPES.SOCCER: frames = this.soccerFrames; break;
                case OBSTACLE_TYPES.BICYCLE: frames = this.bicycleVariants[e.variant || 0]; break;
                case OBSTACLE_TYPES.MOTORCYCLE: frames = this.motorcycleVariants[e.variant || 0]; break;
            }
            if (frames) ctx.drawImage(frames[e.frame % frames.length], e.x, e.y);
        }

        // Player
        if (this.player && (this.state !== GameState.GAME_OVER || Math.floor(this.gameOverTimer / 100) % 2 === 0))
            ctx.drawImage(this.playerFrames[this.player.frame], this.player.x, this.player.y);

        // HUD
        this._renderHUD(ctx);
        // Mobile controls
        this._renderControls(ctx);
    }

    _renderHUD(ctx) {
        const stage = STAGES[this.currentStage];
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(3, 3, 80, 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(stage.name, 6, 16);
        // Score with coin icon
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(3, 24, 80, 16);
        ctx.drawImage(this.coinCanvases[0], 5, 25);
        ctx.fillStyle = '#FFDD44';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('' + this.score, 24, 36);

        // Item score guide (top center)
        const gx = this.WIDTH / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(gx - 62, 3, 124, 14);
        ctx.font = '7px monospace';
        ctx.textAlign = 'left';
        // Coin +100
        ctx.drawImage(this.coinCanvases[0], gx - 60, 4, 10, 10);
        ctx.fillStyle = '#FFDD44';
        ctx.fillText('+100', gx - 48, 13);
        // Star +1000
        ctx.drawImage(this.bigStarCanvases[0], gx - 18, 4, 10, 10);
        ctx.fillStyle = '#44DDFF';
        ctx.fillText('+1000', gx - 6, 13);
        // Bomb -500
        ctx.drawImage(this.bombCanvases[0], gx + 30, 4, 10, 10);
        ctx.fillStyle = '#FF5544';
        ctx.fillText('-500', gx + 42, 13);

        // Progress bar
        const bx = this.WIDTH - 90, by = 6, bw = 84, bh = 12;
        const prog = Math.min(1, this.distanceTraveled / stage.levelLength);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
        ctx.fillStyle = '#333';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = prog > 0.8 ? '#44DD44' : '#4488DD';
        ctx.fillRect(bx, by, bw * prog, bh);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(Math.floor(prog * 100) + '%', bx + bw / 2, by + 10);
        ctx.textAlign = 'left';
    }

    _renderControls(ctx) {
        const y = this.HEIGHT - 45;
        ctx.globalAlpha = this.input.touchLeft ? 0.45 : 0.2;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(38, y, 28, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.7;
        ctx.drawImage(this.arrowLCanvas, 38 - 18, y - 18);
        ctx.globalAlpha = this.input.touchRight ? 0.45 : 0.2;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(this.WIDTH - 38, y, 28, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.7;
        ctx.drawImage(this.arrowRCanvas, this.WIDTH - 38 - 18, y - 18);
        ctx.globalAlpha = 1;
    }

    renderGameOver(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        if (this.gameOverTimer < 300) { ctx.fillStyle = 'rgba(255,50,50,' + (0.3 - this.gameOverTimer/1000) + ')'; ctx.fillRect(0,0,this.WIDTH,this.HEIGHT); }
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.WIDTH / 2, 220);
        ctx.fillStyle = '#FFDD44';
        ctx.font = '14px monospace';
        ctx.fillText('Score: ' + this.score, this.WIDTH / 2, 255);
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '11px monospace';
        ctx.fillText(STAGES[this.currentStage].subtitle, this.WIDTH / 2, 280);
        if (this.gameOverTimer > 1000) {
            ctx.fillStyle = '#446688';
            ctx.fillRect(this.WIDTH/2-80, 310, 70, 35);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('RETRY', this.WIDTH/2-45, 332);
            ctx.fillStyle = '#664444';
            ctx.fillRect(this.WIDTH/2+10, 310, 70, 35);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('MENU', this.WIDTH/2+45, 332);
        }
        ctx.textAlign = 'left';
    }

    renderStageClear(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        // Sparkle
        if (this.clearTimer < 2000) {
            for (let i = 0; i < 8; i++) {
                const a = (this.clearTimer / 400 + i * 0.785) % (Math.PI * 2);
                const r = 35 + Math.sin(this.clearTimer / 200) * 12;
                ctx.fillStyle = 'hsl(' + ((this.clearTimer/4 + i*45) % 360) + ',100%,70%)';
                ctx.fillRect(this.WIDTH/2+Math.cos(a)*r-3, 155+Math.sin(a)*r-3, 6, 6);
            }
        }
        ctx.fillStyle = '#FFDD44';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE CLEAR!', this.WIDTH/2, 165);
        ctx.drawImage(this.starCanvas, this.WIDTH/2-7, 175);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '13px monospace';
        ctx.fillText(this.playerName + ': ' + this.score + ' pts', this.WIDTH/2, 208);
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '10px monospace';
        ctx.fillText(STAGES[this.currentStage].subtitle, this.WIDTH/2, 225);

        // Global Leaderboard
        const lb = this.cachedLeaderboard && this.cachedLeaderboard.length > 0
            ? this.cachedLeaderboard : this.loadLeaderboard(this.currentStage);
        if (lb.length > 0) {
            ctx.fillStyle = '#88CCFF';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('\u2605 STAGE RANKING \u2605', this.WIDTH/2, 248);
            // Header
            ctx.font = '8px monospace';
            ctx.fillStyle = '#888888';
            ctx.fillText('RANK    NAME       SCORE', this.WIDTH/2, 262);
            ctx.font = '9px monospace';
            for (let i = 0; i < Math.min(7, lb.length); i++) {
                const isMe = lb[i].name === this.playerName && lb[i].score === this.score;
                if (i === 0) ctx.fillStyle = '#FFD700';
                else if (i === 1) ctx.fillStyle = '#C0C0C0';
                else if (i === 2) ctx.fillStyle = '#CD7F32';
                else ctx.fillStyle = isMe ? '#88FF88' : '#CCCCCC';
                if (isMe) ctx.font = 'bold 9px monospace';
                else ctx.font = '9px monospace';
                const medal = i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : (i+1)+'.';
                const nameStr = lb[i].name.padEnd(8, ' ');
                const lbY = 276 + i * 13;
                if (lb[i].look) {
                    const mini = this._getMiniSprite(lb[i].look);
                    ctx.drawImage(mini[0], this.WIDTH/2 - 120, lbY - 10);
                }
                ctx.fillText(medal + ' ' + nameStr + '  ' + lb[i].score, this.WIDTH/2, lbY);
            }
        }

        if (this.clearTimer > 1500) {
            // Stage 10: show ENDING button instead of NEXT
            if (this.currentStage === 9) {
                ctx.fillStyle = '#886622';
                ctx.fillRect(this.WIDTH/2-80, 375, 70, 35);
                ctx.fillStyle = '#FFDD44';
                ctx.font = 'bold 10px monospace';
                ctx.fillText('ENDING', this.WIDTH/2-45, 396);
            } else {
                ctx.fillStyle = '#448844';
                ctx.fillRect(this.WIDTH/2-80, 375, 70, 35);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 11px monospace';
                ctx.fillText('NEXT', this.WIDTH/2-45, 397);
            }
            ctx.fillStyle = '#664444';
            ctx.fillRect(this.WIDTH/2+10, 375, 70, 35);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('MENU', this.WIDTH/2+45, 397);
        }
        ctx.textAlign = 'left';
    }

    renderEnding(ctx) {
        const W = this.WIDTH, H = this.HEIGHT;
        const t = this.endingTimer;

        if (this.endingPhase === 0) {
            // === SUNSET WALK SCENE ===
            // Sky gradient (sunset)
            const fadeIn = Math.min(1, t / 1500);
            const grd = ctx.createLinearGradient(0, 0, 0, H * 0.65);
            grd.addColorStop(0, '#1a0533');
            grd.addColorStop(0.25, '#4a1942');
            grd.addColorStop(0.5, '#c84b31');
            grd.addColorStop(0.75, '#ff8c42');
            grd.addColorStop(1, '#ffcf48');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, W, H);

            // Sun
            const sunY = H * 0.35 + Math.sin(t / 3000) * 8;
            const sunGrd = ctx.createRadialGradient(W/2, sunY, 5, W/2, sunY, 55);
            sunGrd.addColorStop(0, 'rgba(255,240,180,0.9)');
            sunGrd.addColorStop(0.4, 'rgba(255,180,80,0.5)');
            sunGrd.addColorStop(1, 'rgba(255,100,50,0)');
            ctx.fillStyle = sunGrd;
            ctx.beginPath(); ctx.arc(W/2, sunY, 55, 0, Math.PI*2); ctx.fill();
            // Sun core
            ctx.fillStyle = '#FFF0C0';
            ctx.beginPath(); ctx.arc(W/2, sunY, 18, 0, Math.PI*2); ctx.fill();

            // Ground
            ctx.fillStyle = '#2a1a0a';
            ctx.fillRect(0, H*0.65, W, H*0.35);
            // Path
            ctx.fillStyle = '#4a3520';
            ctx.fillRect(W*0.2, H*0.65, W*0.6, H*0.35);

            // Silhouette hills
            ctx.fillStyle = '#1a0a05';
            ctx.beginPath();
            ctx.moveTo(0, H*0.65);
            for (let x = 0; x <= W; x += 20) {
                ctx.lineTo(x, H*0.6 - Math.sin(x/80)*15 - Math.sin(x/40)*8);
            }
            ctx.lineTo(W, H*0.65); ctx.closePath(); ctx.fill();

            // Mino walking (silhouette style)
            const walkX = W * 0.35 + (t / 6000) * W * 0.15;
            const walkY = H * 0.58;
            const walkBob = Math.sin(t / 200) * 2;
            const minoFrame = Math.floor(t / 250) % 3;
            ctx.globalAlpha = fadeIn;
            ctx.drawImage(this.playerFrames[minoFrame], walkX, walkY + walkBob);

            // Bonggu walking next to Mino
            const dogFrame = Math.floor(t / 350) % 2;
            const dogX = walkX + 22;
            const dogBob = Math.sin(t / 220 + 1) * 2;
            ctx.drawImage(this.dogCanvases[dogFrame], dogX, walkY + 12 + dogBob);
            ctx.globalAlpha = 1;

            // Particles (fireflies/sparkles)
            for (let i = 0; i < 6; i++) {
                const px = W*0.2 + Math.sin(t/2000 + i*1.5) * W*0.3 + W*0.15;
                const py = H*0.3 + Math.cos(t/1800 + i*2) * H*0.15;
                const alpha = 0.3 + Math.sin(t/500 + i) * 0.3;
                ctx.fillStyle = 'rgba(255,220,120,' + alpha + ')';
                ctx.fillRect(px, py, 2, 2);
            }

            // Text
            if (t > 2000) {
                const textAlpha = Math.min(1, (t - 2000) / 1500);
                ctx.globalAlpha = textAlpha;
                ctx.fillStyle = '#FFEECC';
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('미노와 봉구의 산책', W/2, H*0.2);
                ctx.globalAlpha = 1;
            }
            if (t > 4000) {
                const textAlpha = Math.min(1, (t - 4000) / 1000);
                ctx.globalAlpha = textAlpha;
                ctx.fillStyle = '#FFDDAA';
                ctx.font = '11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('노을이 지는 하늘 아래...', W/2, H*0.26);
                ctx.globalAlpha = 1;
            }
        } else if (this.endingPhase === 1) {
            // === CREDITS ===
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(0, 0, W, H);

            // Stars background
            for (let i = 0; i < 30; i++) {
                const sx = (i * 73 + 17) % W;
                const sy = (i * 51 + 33) % H;
                const sa = 0.3 + Math.sin(t/800 + i) * 0.3;
                ctx.fillStyle = 'rgba(255,255,255,' + sa + ')';
                ctx.fillRect(sx, sy, 1, 1);
            }

            const scrollY = this.endingScrollY;
            const baseY = H - scrollY * 3;

            const credits = [
                { text: '\u2605 CONGRATULATIONS \u2605', color: '#FFDD44', font: 'bold 18px monospace', y: 0 },
                { text: '', y: 25 },
                { text: this.playerName + ', 모든 스테이지 클리어!', color: '#88CCFF', font: '12px monospace', y: 40 },
                { text: '', y: 60 },
                { text: '~  ~  ~', color: '#666666', font: '10px monospace', y: 80 },
                { text: '', y: 95 },
                { text: '봉구를 사랑한 미노는,', color: '#FFEECC', font: '13px monospace', y: 110 },
                { text: '봉구에게 메추리 간식을', color: '#FFEECC', font: '13px monospace', y: 130 },
                { text: '100개를 선물로 주었습니다.', color: '#FFEECC', font: '13px monospace', y: 150 },
                { text: '', y: 175 },
                { text: '봉구는 행복하게 꼬리를 흔들며', color: '#CCBBAA', font: '11px monospace', y: 190 },
                { text: '미노와 함께 집으로 돌아갔습니다.', color: '#CCBBAA', font: '11px monospace', y: 207 },
                { text: '', y: 230 },
                { text: '~  ~  ~', color: '#666666', font: '10px monospace', y: 245 },
                { text: '', y: 265 },
                { text: '- STAGE SCORES -', color: '#88CCFF', font: 'bold 11px monospace', y: 280 },
            ];

            // Add stage scores to credits
            let yOff = 300;
            let totalScore = 0;
            for (let i = 0; i < 10; i++) {
                const s = this.stageScores[i] || 0;
                totalScore += s;
                credits.push({
                    text: STAGES[i].name + ' ' + STAGES[i].subtitle + ': ' + s,
                    color: s > 0 ? '#DDDDDD' : '#666666',
                    font: '9px monospace',
                    y: yOff
                });
                yOff += 14;
            }
            credits.push({ text: '', y: yOff + 5 });
            credits.push({ text: 'TOTAL: ' + totalScore + ' pts', color: '#FFDD44', font: 'bold 14px monospace', y: yOff + 20 });
            credits.push({ text: '', y: yOff + 50 });
            credits.push({ text: 'Thank you for playing!', color: '#888888', font: '10px monospace', y: yOff + 65 });
            credits.push({ text: '\u2764 \uBBF8\uB178\uAC00 \uAC04\uB2E4! \u2764', color: '#FF8888', font: 'bold 13px monospace', y: yOff + 85 });

            ctx.textAlign = 'center';
            for (const c of credits) {
                const cy = baseY + c.y;
                if (cy < -20 || cy > H + 20) continue;
                ctx.fillStyle = c.color || '#FFFFFF';
                ctx.font = c.font || '10px monospace';
                ctx.fillText(c.text, W/2, cy);
            }

            // Skip hint
            if (t > 2000) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.font = '8px monospace';
                ctx.fillText('TAP TO CONTINUE', W/2, H - 15);
            }
            ctx.textAlign = 'left';
        }
    }

    renderTotalRanking(ctx) {
        const W = this.WIDTH, H = this.HEIGHT;
        ctx.fillStyle = '#0a0a2e';
        ctx.fillRect(0, 0, W, H);

        // Stars background
        for (let i = 0; i < 40; i++) {
            const sx = (i * 73 + 17) % W;
            const sy = (i * 51 + 33) % H;
            const sa = 0.3 + Math.sin(this.totalRankTimer/600 + i) * 0.3;
            ctx.fillStyle = 'rgba(255,255,255,' + sa + ')';
            ctx.fillRect(sx, sy, 1, 1);
        }

        ctx.textAlign = 'center';

        // Trophy
        ctx.fillStyle = '#FFDD44';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('\u2605 HALL OF FAME \u2605', W/2, 40);

        ctx.fillStyle = '#88CCFF';
        ctx.font = '10px monospace';
        ctx.fillText('\uC804\uCCB4 \uC2A4\uD14C\uC774\uC9C0 \uD569\uC0B0 \uB7AD\uD0B9', W/2, 58);

        // Current player total
        const myTotal = this.stageScores.reduce((sum, s) => sum + (s || 0), 0);
        ctx.fillStyle = '#FFEECC';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(this.playerName + ': ' + myTotal + ' pts', W/2, 80);

        // Separator
        ctx.fillStyle = '#333355';
        ctx.fillRect(W*0.15, 90, W*0.7, 1);

        // Total Leaderboard
        const lb = this.cachedTotalLB || [];
        if (lb.length > 0) {
            // Header
            ctx.fillStyle = '#777799';
            ctx.font = '8px monospace';
            ctx.fillText('RANK    PLAYER      TOTAL', W/2, 108);

            for (let i = 0; i < Math.min(10, lb.length); i++) {
                const entry = lb[i];
                const isMe = entry.name === this.playerName;
                const y = 124 + i * 18;

                // Highlight current player
                if (isMe) {
                    ctx.fillStyle = 'rgba(68,136,68,0.3)';
                    ctx.fillRect(W*0.1, y - 11, W*0.8, 16);
                }

                if (i === 0) ctx.fillStyle = '#FFD700';
                else if (i === 1) ctx.fillStyle = '#C0C0C0';
                else if (i === 2) ctx.fillStyle = '#CD7F32';
                else ctx.fillStyle = isMe ? '#88FF88' : '#CCCCCC';

                ctx.font = isMe ? 'bold 10px monospace' : '10px monospace';
                const medal = i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : (i+1)+'.';
                const name = entry.name.padEnd(8, ' ');
                ctx.fillText(medal + ' ' + name + '  ' + (entry.totalScore || 0), W/2, y);

                // Show stage breakdown on hover area (small text)
                if (entry.stageScores && i < 5) {
                    ctx.fillStyle = 'rgba(150,150,180,0.5)';
                    ctx.font = '7px monospace';
                    const stages = entry.stageScores.map((s, idx) => (s || 0)).join('/');
                    ctx.fillText(stages, W/2, y + 10);
                }
            }
        } else {
            ctx.fillStyle = '#666666';
            ctx.font = '10px monospace';
            ctx.fillText('\uB9AD\uD0B9 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4', W/2, 150);
        }

        // Back button
        if (this.totalRankTimer > 1500) {
            ctx.fillStyle = '#446688';
            ctx.fillRect(W/2-50, H-55, 100, 35);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('TITLE', W/2, H-33);
        }
        ctx.textAlign = 'left';
    }

    _openRankingView() {
        this.state = GameState.RANKING_VIEW;
        this.rankingViewTab = 0;
        this._loadRankingTab(0);
        this.input.clearClicks();
    }

    _loadRankingTab(tab) {
        this.rankingViewTab = tab;
        if (tab === 10) {
            this.rankingViewData = LeaderboardService._getTotalLocal();
            LeaderboardService.getTotalLeaderboard().then(lb => { this.rankingViewData = lb; });
        } else {
            this.rankingViewData = this.loadLeaderboard(tab);
            LeaderboardService.getStageLeaderboard(tab).then(lb => { this.rankingViewData = lb; });
        }
    }

    updateRankingView() {
        const click = this.input.getClick();
        if (!click) return;
        const W = this.WIDTH, H = this.HEIGHT;
        // Left arrow
        if (Collision.pointInRect(click.x, click.y, 10, 30, 35, 30)) {
            Sound.select();
            const newTab = this.rankingViewTab <= 0 ? 10 : this.rankingViewTab - 1;
            this._loadRankingTab(newTab);
            return;
        }
        // Right arrow
        if (Collision.pointInRect(click.x, click.y, W-45, 30, 35, 30)) {
            Sound.select();
            const newTab = this.rankingViewTab >= 10 ? 0 : this.rankingViewTab + 1;
            this._loadRankingTab(newTab);
            return;
        }
        // Back button
        if (Collision.pointInRect(click.x, click.y, W/2-50, H-50, 100, 35)) {
            Sound.select();
            this.state = GameState.TITLE;
            this.titleBlink = 0;
            this.input.clearClicks();
            return;
        }
        // Tab buttons (stage 1-10 + TOTAL)
        const tabY = 65;
        for (let i = 0; i < 11; i++) {
            const tx = 8 + i * 28;
            if (Collision.pointInRect(click.x, click.y, tx, tabY, 26, 18)) {
                Sound.select();
                this._loadRankingTab(i);
                return;
            }
        }
    }

    renderRankingView(ctx) {
        const W = this.WIDTH, H = this.HEIGHT;
        ctx.fillStyle = '#0a0a2e';
        ctx.fillRect(0, 0, W, H);

        // Stars background
        for (let i = 0; i < 30; i++) {
            const sx = (i * 73 + 17) % W;
            const sy = (i * 51 + 33) % H;
            const sa = 0.2 + Math.sin(Date.now()/800 + i) * 0.2;
            ctx.fillStyle = 'rgba(255,255,255,' + sa + ')';
            ctx.fillRect(sx, sy, 1, 1);
        }

        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#FFDD44';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('\u2605 RANKING \u2605', W/2, 25);

        // Left/Right arrows
        ctx.fillStyle = '#4466AA';
        ctx.fillRect(10, 30, 35, 30);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('\u25C0', 27, 51);

        ctx.fillStyle = '#4466AA';
        ctx.fillRect(W-45, 30, 35, 30);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('\u25B6', W-28, 51);

        // Current tab title
        const tab = this.rankingViewTab;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px monospace';
        if (tab < 10) {
            ctx.fillText(STAGES[tab].name + ' - ' + STAGES[tab].subtitle, W/2, 51);
        } else {
            ctx.fillText('TOTAL RANKING', W/2, 51);
        }

        // Tab bar
        const tabY = 65;
        for (let i = 0; i < 11; i++) {
            const tx = 8 + i * 28;
            const isActive = i === tab;
            ctx.fillStyle = isActive ? '#4466AA' : '#1a1a3e';
            ctx.fillRect(tx, tabY, 26, 18);
            ctx.strokeStyle = isActive ? '#88AAFF' : '#333355';
            ctx.lineWidth = 1;
            ctx.strokeRect(tx, tabY, 26, 18);
            ctx.fillStyle = isActive ? '#FFFFFF' : '#666688';
            ctx.font = '8px monospace';
            ctx.fillText(i < 10 ? '' + (i+1) : 'T', tx + 13, tabY + 13);
        }

        // Leaderboard data
        const lb = this.rankingViewData || [];
        const startY = 100;

        if (lb.length === 0) {
            ctx.fillStyle = '#555577';
            ctx.font = '11px monospace';
            ctx.fillText('\uB9AD\uD0B9 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4', W/2, 200);
            ctx.fillStyle = '#444466';
            ctx.font = '9px monospace';
            ctx.fillText('\uC2A4\uD14C\uC774\uC9C0\uB97C \uD074\uB9AC\uC5B4\uD558\uBA74 \uAE30\uB85D\uB429\uB2C8\uB2E4!', W/2, 220);
        } else {
            // Header
            ctx.fillStyle = '#555577';
            ctx.font = '8px monospace';
            if (tab < 10) {
                ctx.fillText('RANK    PLAYER      SCORE', W/2, startY);
            } else {
                ctx.fillText('RANK    PLAYER      TOTAL', W/2, startY);
            }

            for (let i = 0; i < Math.min(10, lb.length); i++) {
                const entry = lb[i];
                const y = startY + 18 + i * 22;
                const isMe = entry.name === this.playerName;

                // Highlight row
                if (isMe) {
                    ctx.fillStyle = 'rgba(68,136,68,0.2)';
                    ctx.fillRect(W*0.08, y - 12, W*0.84, 20);
                }

                // Medal/rank color
                if (i === 0) ctx.fillStyle = '#FFD700';
                else if (i === 1) ctx.fillStyle = '#C0C0C0';
                else if (i === 2) ctx.fillStyle = '#CD7F32';
                else ctx.fillStyle = isMe ? '#88FF88' : '#BBBBCC';

                ctx.font = isMe ? 'bold 10px monospace' : '10px monospace';
                const medal = i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : ' '+(i+1)+'.';
                const name = entry.name.padEnd(8, ' ');
                const score = tab < 10 ? entry.score : (entry.totalScore || 0);
                if (entry.look) {
                    const mini = this._getMiniSprite(entry.look);
                    ctx.drawImage(mini[0], W*0.08, y - 10);
                }
                ctx.fillText(medal + ' ' + name + '  ' + score, W/2, y);

                // Stage breakdown for total
                if (tab === 10 && entry.stageScores && i < 5) {
                    ctx.fillStyle = 'rgba(130,130,160,0.5)';
                    ctx.font = '7px monospace';
                    ctx.fillText(entry.stageScores.map(s => s || 0).join(' / '), W/2, y + 10);
                }
            }
        }

        // Back button
        ctx.fillStyle = '#664444';
        ctx.fillRect(W/2-50, H-50, 100, 35);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('BACK', W/2, H-28);

        ctx.textAlign = 'left';
    }

    updateCustomize() {
        const click = this.input.getClick();
        if (!click) return;
        const W = this.WIDTH;
        const c = this.customization;
        const optY = [168, 202, 236, 270, 304];
        const optStartX = 70;
        const optGap = 38;

        for (let row = 0; row < 5; row++) {
            for (let i = 0; i < 5; i++) {
                const ox = optStartX + i * optGap;
                const oy = optY[row];
                if (Collision.pointInRect(click.x, click.y, ox-14, oy-14, 28, 28)) {
                    Sound.select();
                    if (row === 0) c.hair = i;
                    else if (row === 1) c.body = i;
                    else if (row === 2) c.shirt = i;
                    else if (row === 3) c.pants = i;
                    else c.socks = i;
                    this.saveCustomization();
                    this._rebuildPlayerSprite();
                    return;
                }
            }
        }

        // OK button
        if (Collision.pointInRect(click.x, click.y, W/2-40, 365, 80, 32)) {
            Sound.select();
            this.state = GameState.TITLE;
            this.titleBlink = 0;
            this.input.clearClicks();
        }
        // Change name button
        if (Collision.pointInRect(click.x, click.y, W/2-40, 405, 80, 25)) {
            Sound.select();
            this.nameChars = this.playerName ? this.playerName.split('') : [];
            this.state = GameState.NAME_INPUT;
            this.input.clearClicks();
        }
    }

    renderCustomize(ctx) {
        const W = this.WIDTH, H = this.HEIGHT;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#CC88FF';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('CUSTOMIZE', W/2, 25);

        // Player name
        ctx.fillStyle = '#88CCFF';
        ctx.font = '10px monospace';
        ctx.fillText('Player: ' + this.playerName, W/2, 42);

        // Character preview (scale 3)
        const previewX = W/2 - 30;
        const previewY = 55;
        const pf = Math.floor(Date.now() / 250) % 3;
        ctx.drawImage(this.titleCharFrames[pf], previewX, previewY);

        const c = this.customization;
        const labels = ['HAIR', 'BODY', 'SHIRT', 'PANTS', 'SOCKS'];
        const optY = [168, 202, 236, 270, 304];
        const optStartX = 70;
        const optGap = 38;

        for (let row = 0; row < 5; row++) {
            // Label
            ctx.fillStyle = '#AAAAAA';
            ctx.font = '9px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(labels[row], 10, optY[row] + 4);

            const selected = row === 0 ? c.hair : row === 1 ? c.body : row === 2 ? c.shirt : row === 3 ? c.pants : c.socks;

            for (let i = 0; i < 5; i++) {
                const ox = optStartX + i * optGap;
                const oy = optY[row];
                const isSelected = (i === selected);

                if (row === 0 || row === 1) {
                    // Hair & Body: show style name
                    ctx.fillStyle = isSelected ? '#4a3a5a' : '#2a2a3a';
                    ctx.fillRect(ox-14, oy-14, 28, 28);
                    if (isSelected) { ctx.strokeStyle = '#CC88FF'; ctx.lineWidth = 2; ctx.strokeRect(ox-14, oy-14, 28, 28); }
                    ctx.fillStyle = '#AAAAAA';
                    ctx.font = '7px monospace';
                    ctx.textAlign = 'center';
                    const nameList = row === 0 ? HAIR_STYLES : BODY_STYLES;
                    ctx.fillText(nameList[i].name, ox, oy + 10);
                } else {
                    // Color swatch
                    let swatchColor;
                    if (row === 2) swatchColor = getShirtSwatch(i);
                    else if (row === 3) swatchColor = getPantsSwatch(i);
                    else swatchColor = getSockSwatch(i);

                    ctx.fillStyle = isSelected ? '#4a3a5a' : '#2a2a3a';
                    ctx.fillRect(ox-14, oy-14, 28, 28);
                    ctx.fillStyle = swatchColor;
                    ctx.fillRect(ox-8, oy-8, 16, 16);
                    if (isSelected) { ctx.strokeStyle = '#CC88FF'; ctx.lineWidth = 2; ctx.strokeRect(ox-14, oy-14, 28, 28); }
                }
            }
        }

        ctx.textAlign = 'center';

        // OK button
        ctx.fillStyle = '#446644';
        ctx.fillRect(W/2-40, 365, 80, 32);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('OK', W/2, 385);

        // Change name button
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(W/2-40, 405, 80, 25);
        ctx.strokeStyle = '#4466AA';
        ctx.lineWidth = 1;
        ctx.strokeRect(W/2-40, 405, 80, 25);
        ctx.fillStyle = '#88AACC';
        ctx.font = '9px monospace';
        ctx.fillText('\uC774\uB984 \uBCC0\uACBD', W/2, 421);

        ctx.textAlign = 'left';
    }

    _renderSoundToggle(ctx) {
        const bx = this.WIDTH - 40, by = 5;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(bx, by, 35, 22);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, 35, 22);
        ctx.fillStyle = Sound.enabled ? '#44DD44' : '#DD4444';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(Sound.enabled ? 'ON' : 'OFF', bx + 17, by + 15);
        ctx.textAlign = 'left';
    }
}
