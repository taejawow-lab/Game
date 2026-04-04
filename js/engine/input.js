// Input Handler
// Keyboard (arrow keys, A/D) + Touch controls

class InputHandler {
    constructor() {
        this.keys = {};
        this.touchLeft = false;
        this.touchRight = false;
        this.touchStart = null;
        this.clicks = []; // for menu clicks

        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                const canvasX = (x / rect.width) * canvas.width;
                const canvasY = (y / rect.height) * canvas.height;

                this.clicks.push({ x: canvasX, y: canvasY });

                // Bottom portion = controls
                if (canvasY > canvas.height * 0.7) {
                    if (canvasX < canvas.width / 2) {
                        this.touchLeft = true;
                    } else {
                        this.touchRight = true;
                    }
                } else {
                    // Upper portion touch for left/right movement too
                    if (canvasX < canvas.width / 2) {
                        this.touchLeft = true;
                    } else {
                        this.touchRight = true;
                    }
                }
                this.touchStart = { x: touch.clientX, y: touch.clientY };
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchLeft = false;
            this.touchRight = false;
            this.touchStart = null;
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.touchStart) {
                for (const touch of e.changedTouches) {
                    const dx = touch.clientX - this.touchStart.x;
                    this.touchLeft = dx < -10;
                    this.touchRight = dx > 10;
                }
            }
        }, { passive: false });

        // Mouse click for menu
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width * canvas.width;
            const y = (e.clientY - rect.top) / rect.height * canvas.height;
            this.clicks.push({ x, y });
        });
    }

    isLeft() {
        return this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchLeft;
    }

    isRight() {
        return this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchRight;
    }

    isConfirm() {
        return this.keys['Enter'] || this.keys['Space'];
    }

    consumeConfirm() {
        if (this.keys['Enter']) { this.keys['Enter'] = false; return true; }
        if (this.keys['Space']) { this.keys['Space'] = false; return true; }
        return false;
    }

    getClick() {
        return this.clicks.shift() || null;
    }

    clearClicks() {
        this.clicks = [];
    }
}
