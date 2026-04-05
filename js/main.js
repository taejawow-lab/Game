// Main Entry Point
// Error-safe game loop with crash recovery

(function () {
    const canvas = document.getElementById('gameCanvas');
    const input = new InputHandler();

    let game;
    let lastError = null;

    try {
        game = new Game(canvas, input);
    } catch (e) {
        console.error('Game init failed:', e);
        const ctx = canvas.getContext('2d');
        canvas.width = 320;
        canvas.height = 480;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 320, 480);
        ctx.fillStyle = '#FF4444';
        ctx.font = '14px monospace';
        ctx.fillText('Init Error: ' + e.message, 10, 240);
        return;
    }

    // Resize canvas to fit screen
    function resize() {
        const ratio = game.WIDTH / game.HEIGHT;
        let w = window.innerWidth;
        let h = window.innerHeight;
        if (w / h > ratio) {
            w = h * ratio;
        } else {
            h = w / ratio;
        }
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
    }

    window.addEventListener('resize', resize);
    resize();

    // Error-safe game loop
    let lastTime = performance.now();

    function gameLoop(timestamp) {
        // Schedule next frame FIRST so loop never dies
        requestAnimationFrame(gameLoop);

        const dt = Math.min(timestamp - lastTime, 50);
        lastTime = timestamp;

        try {
            game.update(dt);
            game.render();
            lastError = null;
        } catch (e) {
            // Show error on canvas but keep loop alive
            if (lastError !== e.message) {
                console.error('Game error:', e);
                lastError = e.message;
            }
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, game.WIDTH, game.HEIGHT);
            ctx.fillStyle = '#FF4444';
            ctx.font = '12px monospace';
            ctx.fillText('Error: ' + e.message, 10, game.HEIGHT / 2);
            ctx.fillStyle = '#AAAAAA';
            ctx.font = '10px monospace';
            ctx.fillText('Tap to retry', 10, game.HEIGHT / 2 + 20);

            // Try to recover on click
            const click = input.getClick();
            if (click) {
                try {
                    game.state = 'title';
                    game.titleBlink = 0;
                } catch (e2) { /* ignore */ }
            }
        }
    }

    requestAnimationFrame(gameLoop);
})();
