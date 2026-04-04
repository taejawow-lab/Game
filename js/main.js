// Main Entry Point
// Initialize game and start game loop

(function () {
    const canvas = document.getElementById('gameCanvas');
    const input = new InputHandler();
    const game = new Game(canvas, input);

    // Resize canvas to fit screen while maintaining aspect ratio
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

    // Game loop
    let lastTime = performance.now();

    function gameLoop(timestamp) {
        const dt = Math.min(timestamp - lastTime, 50); // cap dt at 50ms
        lastTime = timestamp;

        game.update(dt);
        game.render();

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
})();
