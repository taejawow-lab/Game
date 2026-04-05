// Input Handler - Improved touch responsiveness
// Better swipe detection, faster response, continuous touch movement

class InputHandler {
    constructor() {
        this.keys = {};
        this.touchLeft = false;
        this.touchRight = false;
        this.clicks = [];
        this.activeTouches = {};

        const canvas = document.getElementById('gameCanvas');

        // Cache canvas rect, invalidate on resize
        this._cachedRect = canvas.getBoundingClientRect();
        this._canvas = canvas;
        window.addEventListener('resize', () => {
            this._cachedRect = canvas.getBoundingClientRect();
        });

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

        // Touch - improved continuous tracking
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this._cachedRect;
            for (const touch of e.changedTouches) {
                const canvasX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
                const canvasY = ((touch.clientY - rect.top) / rect.height) * canvas.height;

                this.activeTouches[touch.identifier] = {
                    startX: touch.clientX,
                    startY: touch.clientY,
                    currentX: touch.clientX,
                    canvasX: canvasX,
                    canvasY: canvasY,
                };

                this.clicks.push({ x: canvasX, y: canvasY });
            }
            this._updateTouchDirection();
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (this.activeTouches[touch.identifier]) {
                    this.activeTouches[touch.identifier].currentX = touch.clientX;
                }
            }
            this._updateTouchDirection();
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                delete this.activeTouches[touch.identifier];
            }
            this._updateTouchDirection();
        }, { passive: false });

        canvas.addEventListener('touchcancel', (e) => {
            for (const touch of e.changedTouches) {
                delete this.activeTouches[touch.identifier];
            }
            this._updateTouchDirection();
        }, { passive: false });

        // Mouse click for menu
        canvas.addEventListener('click', (e) => {
            const rect = this._cachedRect;
            const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
            const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
            this.clicks.push({ x, y });
        });
    }

    _updateTouchDirection() {
        this.touchLeft = false;
        this.touchRight = false;

        const rect = this._cachedRect;
        const centerX = rect.left + rect.width / 2;

        for (const id in this.activeTouches) {
            const t = this.activeTouches[id];
            // Use swipe offset from start for more responsive feel
            const dx = t.currentX - t.startX;

            if (dx < -8) {
                this.touchLeft = true;
            } else if (dx > 8) {
                this.touchRight = true;
            } else {
                // If no significant swipe, use screen half
                if (t.currentX < centerX) {
                    this.touchLeft = true;
                } else {
                    this.touchRight = true;
                }
            }
        }
    }

    isLeft() {
        return this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchLeft;
    }

    isRight() {
        return this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchRight;
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
