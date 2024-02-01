class BoundingBox {
    /**
     * @param x the top left of the box
     * @param y the top of the box
     * @param width the distance from the left to right sides of box
     * @param height the distance from top to bottom of box
     * @param type 'player': take damage when colliding with 'enemy' or 'enemyAttack'.
     *             'enemy': take damage when colliding with 'playerAttack'.
     */
    constructor(x, y, width, height, type) {
        this.left = x;
        this.top = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    get right() {
        return this.left + this.width;
    }

    get bottom() {
        return this.top + this.height;
    }

    isColliding(other) {
        return this.left < other.right &&
            this.right > other.left &&
            this.top < other.bottom &&
            this.bottom > other.top;
    }
    
    // Update the bounding box to be centered around a given point
    updateCentered(centerX, centerY, width, height) {
        this.left = centerX - width / 2;
        this.top = centerY - height / 2;
        this.width = width;
        this.height = height;
    }

    draw(ctx, game) {
        // Check if the game instance is valid and if debug mode is enabled
        if (!game || !game.debugMode) {
            return; // If game instance is not valid or debug mode is off, do nothing
        }

        // If camera is not initialized, do nothing because we need it here.
        if (!game.camera) {
            return;
        }

        // draws the box for you to see
        ctx.beginPath();
        switch (this.type) {
            case "player":
                ctx.strokeStyle = 'Blue';
                break;
            case "enemy":
                ctx.strokeStyle = 'Red';
                break;
            default:
                ctx.strokeStyle = 'White';
                break;
        }

        ctx.strokeRect(
            this.left - game.camera.x,
            this.top - game.camera.y,
            this.width,
            this.height);
        ctx.closePath();
    }
}