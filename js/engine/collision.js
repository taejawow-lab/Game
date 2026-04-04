// Collision Detection
// AABB with reduced hitbox (60-70% of sprite size for fairness)

const Collision = {
    // hitbox ratio - smaller = more forgiving
    HITBOX_RATIO: 0.6,

    // Get hitbox for an entity (centered, reduced size)
    getHitbox(entity) {
        const w = entity.width * this.HITBOX_RATIO;
        const h = entity.height * this.HITBOX_RATIO;
        const offsetX = (entity.width - w) / 2;
        const offsetY = (entity.height - h) / 2;
        return {
            x: entity.x + offsetX,
            y: entity.y + offsetY,
            width: w,
            height: h
        };
    },

    // Check AABB overlap between two entities
    check(entityA, entityB) {
        const a = this.getHitbox(entityA);
        const b = this.getHitbox(entityB);
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    },

    // Check if a point is inside a rectangle
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }
};
