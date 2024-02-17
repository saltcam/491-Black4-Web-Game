class Floating_text {
    constructor(game, value, worldX, worldY, isHealing, isPlayer) {
        this.game = game;
        this.value = value;
        this.worldX = worldX;
        this.worldY = worldY;
        this.isHealing = isHealing;
        this.isPlayer = isPlayer;
        this.opacity = 1;
        this.duration = 1.5 * 1000; // Duration in milliseconds
        this.startTime = Date.now();
        this.boundingBox = new BoundingBox(0, 0, 0, 0, "damageNumber");
    }

    update() {
        // Calculate the elapsed time
        const elapsedTime = Date.now() - this.startTime;

        if (elapsedTime > this.duration) {
            this.opacity = 0; // Fully transparent
            this.removeFromWorld = true; // Mark for removal
        } else {
            // Update position to move up
            this.worldY -= 0.25;

            // Only start fading away after a certain % of the duration has passed
            if (elapsedTime > this.duration / 1.5) {
                // Calculate opacity based on the second half of the duration
                const fadeElapsedTime = elapsedTime - this.duration / 2;
                const fadeDuration = this.duration / 2;
                this.opacity = 1 - (fadeElapsedTime / fadeDuration);
            } else {
                // Maintain full opacity during the first half of the duration
                this.opacity = 1;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Set text font properties
        ctx.font = '24px Helvetica';
        ctx.textAlign = 'center';

        // Set shadow properties
        ctx.shadowColor = 'rgba(0, 0, 0, 1)'; // Shadow color (black with some transparency)
        ctx.shadowBlur = 0; // How much the shadow should be blurred
        ctx.shadowOffsetX = 2; // Horizontal shadow offset
        ctx.shadowOffsetY = 2; // Vertical shadow offset
        ctx.fillStyle = this.isHealing ? 'green' : (this.isPlayer ? 'red' : 'white');

        ctx.fillText(Math.floor(this.value), this.worldX - this.game.camera.x, this.worldY - this.game.camera.y);
        ctx.restore();

        // Reset shadow properties to avoid affecting other drawings
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}
