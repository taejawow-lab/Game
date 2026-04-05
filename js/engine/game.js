const GameState = {
    NAME_INPUT: 'name_input',
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
        this.WIDTH = 320;
        this.HEIGHT = 480;
        this.SCALE = 2;
        canvas.width = this.WIDTH;
        canvas.height = this.HEIGHT;

        // Player name
        this.playerName = this.loadName();
        this.nameChars = this.playerName ? this.playerName.split('') : [];
        this.state = this.playerName ? GameState.TITLE : GameState.NAME_INPUT;

        this.currentStage = 0;
        this.clearedStages = this.loadProgress();
        this.score = 0;
        this.coins = [];
        this.titleBlink = 0;
        this.gameOverTimer = 0;
        this.clearTimer = 0;
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
        this.playerFrames = SpriteRenderer.prerenderSprite(MAIN_CHARACTER, this.SP);
        this.titleCharFrames = SpriteRenderer.prerenderSprite(MAIN_CHARACTER, 4);

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
    addToLeaderboard(stage, name, score) {
        const lb = this.loadLeaderboard(stage);
        lb.push({ name, score });
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
        const roadL = (this.WIDTH - this.WIDTH * stage.roadWidth) / 2;
        const roadR = roadL + this.WIDTH * stage.roadWidth;
        const bTypes = stage.buildings || ['tree'];
        const numBuildings = Math.ceil(stage.levelLength / 60);
        for (let i = 0; i < numBuildings; i++) {
            const side = i % 2 === 0 ? 'left' : 'right';
            const bType = bTypes[Math.floor(Math.random() * bTypes.length)];
            this.buildings.push({
                type: bType, side,
                x: side === 'left' ? Math.max(0, roadL - 40 + Math.random() * 10) : roadR + 2 + Math.random() * 10,
                worldY: i * 80 + Math.random() * 40,
            });
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
        Sound.startBGM();
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
            this.state = GameState.TITLE;
            this.titleBlink = 0;
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
            Sound.init(); Sound.select(); this.state = GameState.STAGE_SELECT; this.input.clearClicks();
        }
    }

    updateStageSelect() {
        const click = this.input.getClick();
        if (!click) return;
        if (this._checkSoundToggle(click)) return;
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
            return;
        }

        // Spawn obstacles
        this.spawnTimer += dt;
        if (this.spawnTimer >= stage.spawnInterval) { this.spawnTimer -= stage.spawnInterval; this.spawnObstacle(); }

        // Spawn coins (frequent, in clusters)
        this.coinSpawnTimer += dt;
        if (this.coinSpawnTimer > 200) {
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
                if (this.currentStage < 9 && Collision.pointInRect(c.x, c.y, this.WIDTH/2-80, 350, 70, 35)) this.startStage(this.currentStage + 1);
                else if (Collision.pointInRect(c.x, c.y, this.WIDTH/2+10, 350, 70, 35)) { this.state = GameState.STAGE_SELECT; this.input.clearClicks(); }
            } else if (this.input.consumeConfirm()) { if (this.currentStage < 9) this.startStage(this.currentStage + 1); else { this.state = GameState.STAGE_SELECT; this.input.clearClicks(); } }
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
        ctx.drawImage(this.titleCharFrames[0], this.WIDTH / 2 - 28, 75);
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
        ctx.drawImage(this.titleCharFrames[cf], this.WIDTH / 2 - 28, 140);
        // Dog near character
        const df = Math.floor(this.titleBlink / 600) % 2;
        ctx.drawImage(this.dogCanvases[df], this.WIDTH / 2 + 10, 210);
        // Player name
        ctx.fillStyle = '#88CCFF';
        ctx.font = '12px monospace';
        ctx.fillText('Player: ' + (this.playerName || '???'), this.WIDTH / 2, 280);
        // Blink
        if (Math.floor(this.titleBlink / 500) % 2 === 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 15px monospace';
            ctx.fillText('TAP TO START', this.WIDTH / 2, 430);
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
        ctx.drawImage(this.playerFrames[0], this.WIDTH / 2 - 14, 55);
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
                else if (roadType === 'mixed') ctx.drawImage(((y + tOff) % (ts * 4) < ts * 2) ? this.roadCanvas : this.dirtCanvas, x, y + tOff);
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
            ctx.drawImage(this.dogCanvases[dogF], this.WIDTH / 2 + 10, flagY - DOG.height * this.SP);
        }

        // Draw coins
        for (const c of this.coins) ctx.drawImage(this.coinCanvases[c.frame], c.x, c.y);

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
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        // Sparkle
        if (this.clearTimer < 2000) {
            for (let i = 0; i < 8; i++) {
                const a = (this.clearTimer / 400 + i * 0.785) % (Math.PI * 2);
                const r = 35 + Math.sin(this.clearTimer / 200) * 12;
                ctx.fillStyle = 'hsl(' + ((this.clearTimer/4 + i*45) % 360) + ',100%,70%)';
                ctx.fillRect(this.WIDTH/2+Math.cos(a)*r-3, 185+Math.sin(a)*r-3, 6, 6);
            }
        }
        ctx.fillStyle = '#FFDD44';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE CLEAR!', this.WIDTH/2, 195);
        ctx.drawImage(this.starCanvas, this.WIDTH/2-7, 205);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '13px monospace';
        ctx.fillText('Score: ' + this.score, this.WIDTH/2, 240);
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '10px monospace';
        ctx.fillText(STAGES[this.currentStage].subtitle, this.WIDTH/2, 260);
        // Leaderboard
        const lb = this.loadLeaderboard(this.currentStage);
        if (lb.length > 0) {
            ctx.fillStyle = '#88CCFF';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('- RANKING -', this.WIDTH/2, 280);
            ctx.font = '9px monospace';
            for (let i = 0; i < Math.min(5, lb.length); i++) {
                ctx.fillStyle = i === 0 ? '#FFDD44' : '#CCCCCC';
                ctx.fillText((i+1) + '. ' + lb[i].name + ' - ' + lb[i].score, this.WIDTH/2, 295 + i * 14);
            }
        }
        if (this.clearTimer > 1500) {
            if (this.currentStage < 9) {
                ctx.fillStyle = '#448844';
                ctx.fillRect(this.WIDTH/2-80, 350, 70, 35);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 11px monospace';
                ctx.fillText('NEXT', this.WIDTH/2-45, 372);
            }
            ctx.fillStyle = '#664444';
            ctx.fillRect(this.WIDTH/2+10, 350, 70, 35);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('MENU', this.WIDTH/2+45, 372);
        }
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
