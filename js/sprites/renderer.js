// Sprite Renderer Engine
// Palette-indexed sprite system with pre-rendering for performance

const SpriteRenderer = {
    // Draw a sprite directly on canvas (used for pre-rendering)
    drawSprite(ctx, sprite, frameIndex, x, y, scale) {
        const frame = sprite.frames[frameIndex % sprite.frames.length];
        for (let row = 0; row < sprite.height; row++) {
            const line = frame[row];
            if (!line) continue;
            for (let col = 0; col < sprite.width; col++) {
                const ch = line[col];
                if (!ch || ch === '0') continue;
                const paletteIndex = parseInt(ch, 16);
                if (paletteIndex === 0 || !sprite.palette[paletteIndex]) continue;
                ctx.fillStyle = sprite.palette[paletteIndex];
                ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
            }
        }
    },

    // Pre-render all frames of a sprite to offscreen canvases
    prerenderSprite(sprite, scale) {
        return sprite.frames.map(frame => {
            const offscreen = document.createElement('canvas');
            offscreen.width = sprite.width * scale;
            offscreen.height = sprite.height * scale;
            const octx = offscreen.getContext('2d');
            octx.imageSmoothingEnabled = false;
            for (let row = 0; row < sprite.height; row++) {
                const line = frame[row];
                if (!line) continue;
                for (let col = 0; col < sprite.width; col++) {
                    const ch = line[col];
                    if (!ch || ch === '0') continue;
                    const paletteIndex = parseInt(ch, 16);
                    if (paletteIndex === 0 || !sprite.palette[paletteIndex]) continue;
                    octx.fillStyle = sprite.palette[paletteIndex];
                    octx.fillRect(col * scale, row * scale, scale, scale);
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
