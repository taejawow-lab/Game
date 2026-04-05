// Sprite Renderer Engine
// Palette-indexed sprite system with pre-rendering for performance

// Precomputed hex char to int lookup (avoids parseInt per pixel)
const _hexToInt = {};
for (let i = 0; i < 16; i++) _hexToInt[i.toString(16)] = i;
for (let i = 10; i < 16; i++) _hexToInt[i.toString(16).toUpperCase()] = i;

const SpriteRenderer = {
    // Draw a sprite directly on canvas (used for pre-rendering)
    drawSprite(ctx, sprite, frameIndex, x, y, scale) {
        const frame = sprite.frames[frameIndex % sprite.frames.length];
        const palette = sprite.palette;
        for (let row = 0; row < sprite.height; row++) {
            const line = frame[row];
            if (!line) continue;
            for (let col = 0; col < sprite.width; col++) {
                const ch = line[col];
                if (!ch || ch === '0') continue;
                const pi = _hexToInt[ch];
                if (!pi || !palette[pi]) continue;
                ctx.fillStyle = palette[pi];
                ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
            }
        }
    },

    // Pre-render all frames of a sprite to offscreen canvases
    prerenderSprite(sprite, scale) {
        const palette = sprite.palette;
        const w = sprite.width;
        const h = sprite.height;
        return sprite.frames.map(frame => {
            const offscreen = document.createElement('canvas');
            offscreen.width = w * scale;
            offscreen.height = h * scale;
            const octx = offscreen.getContext('2d');
            octx.imageSmoothingEnabled = false;
            for (let row = 0; row < h; row++) {
                const line = frame[row];
                if (!line) continue;
                // Batch consecutive pixels with same color into single fillRect
                let runStart = -1;
                let runColor = null;
                for (let col = 0; col <= w; col++) {
                    const ch = col < w ? line[col] : null;
                    let color = null;
                    if (ch && ch !== '0') {
                        const pi = _hexToInt[ch];
                        if (pi) color = palette[pi] || null;
                    }
                    if (color === runColor && color !== null) continue;
                    // Flush previous run
                    if (runColor !== null && runStart >= 0) {
                        octx.fillStyle = runColor;
                        octx.fillRect(runStart * scale, row * scale, (col - runStart) * scale, scale);
                    }
                    runStart = col;
                    runColor = color;
                }
            }
            return offscreen;
        });
    },

    // Pre-render with color override (for variant obstacles)
    prerenderSpriteWithColors(sprite, scale, colorOverrides) {
        const modifiedPalette = [...sprite.palette];
        for (const [index, color] of Object.entries(colorOverrides)) {
            modifiedPalette[parseInt(index)] = color;
        }
        const modifiedSprite = { ...sprite, palette: modifiedPalette };
        return this.prerenderSprite(modifiedSprite, scale);
    }
};

// Sprite Animator class
class SpriteAnimator {
    constructor(prerenderedFrames, frameDuration) {
        this.frames = prerenderedFrames;
        this.frameDuration = frameDuration; // ms per frame
        this.elapsed = 0;
        this.currentFrame = 0;
    }

    update(dt) {
        this.elapsed += dt;
        if (this.elapsed >= this.frameDuration) {
            this.elapsed -= this.frameDuration;
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        }
    }

    draw(ctx, x, y) {
        ctx.drawImage(this.frames[this.currentFrame], x, y);
    }

    reset() {
        this.elapsed = 0;
        this.currentFrame = 0;
    }
}
