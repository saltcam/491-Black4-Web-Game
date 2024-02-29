class BoundingCircle {
    /**
     * @param centerX the center x-coordinate of the circle
     * @param centerY the center y-coordinate of the circle
     * @param radius the radius of the circle
     * @param type 'player', 'ally', 'enemy', etc. for collision handling purposes
     */
    constructor(centerX, centerY, radius, type) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.radius = radius;
        this.type = type;
    }

    // Check if this circle is colliding with a given BoundingBox
    isColliding(box) {
        // Find the closest point to the circle within the rectangle
        const closestX = Math.clamp(this.centerX, box.left, box.right);
        const closestY = Math.clamp(this.centerY, box.top, box.bottom);

        // Calculate the distance between the circle's center and this closest point
        const distanceX = this.centerX - closestX;
        const distanceY = this.centerY - closestY;

        // If the distance is less than the circle's radius, there's a collision
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (this.radius * this.radius);
    }

    // Update the center of the bounding circle
    updateCentered(newCenterX, newCenterY) {
        this.centerX = newCenterX;
        this.centerY = newCenterY;
    }

    // Utility method to draw the bounding circle for debugging
    draw(ctx, game) {
        if (!game || !game.debugMode) return;
        if (!game.camera) return;

        ctx.beginPath();
        ctx.arc(
            this.centerX - game.camera.x,
            this.centerY - game.camera.y,
            this.radius,
            0,
            2 * Math.PI,
            false
        );

        switch (this.type) {
            case "player":
            case "ally":
                ctx.strokeStyle = 'Blue';
                break;
            case "enemy":
                ctx.strokeStyle = 'Red';
                break;
            default:
                ctx.strokeStyle = 'White';
                break;
        }

        ctx.stroke();
        ctx.closePath();
    }
}

// Math.clamp function to clamp a value between a minimum and a maximum value
Math.clamp = function(value, min, max) {
    return Math.min(Math.max(value, min), max);
};
