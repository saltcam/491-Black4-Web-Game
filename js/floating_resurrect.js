class Floating_resurrect {
    constructor(game, value, worldX, worldY, isHealing, isPlayer, isCrit = false) {
        this.game = game;
        this.value = value;
        this.worldX = worldX + (Math.random() - 0.5) * 50; // Random number between -25 and 25
        this.worldY = worldY + (Math.random() - 0.5) * 50; // Random number between -25 and 25
        this.isHealing = isHealing;
        this.isPlayer = isPlayer;
        this.isCrit = isCrit;
        this.growsOverTime = isCrit; // New property to control behavior
        this.opacity = 1;
        this.duration = 1.5 * 1000; // Duration in milliseconds
        this.startTime = Date.now();
        this.boundingBox = new BoundingBox(0, 0, 0, 0, "damageNumber");
        this.debugName = "Floating_Text"+this.boundingBox.type+")";
        this.initialFontSize = 24; // Initial font size
        this.maxFontSize = 36; // Maximum font size when growsOverTime is true
    }

    update() {
        // Calculate the elapsed time
        const elapsedTime = Date.now() - this.startTime;

        if (elapsedTime > this.duration) {
            this.opacity = 0; // Fully transparent
            this.removeFromWorld = true; // Mark for removal
        } else {
            if (this.growsOverTime) {
                // Maintain position, but update font size and opacity for growing effect
                const growthProgress = elapsedTime / this.duration;
                const fontSizeIncrease = (this.maxFontSize - this.initialFontSize) * growthProgress;
                this.currentFontSize = this.initialFontSize + fontSizeIncrease;

                // Update opacity to fade out during the last half of the duration
                if (elapsedTime > this.duration / 2) {
                    const fadeElapsedTime = elapsedTime - this.duration / 2;
                    const fadeDuration = this.duration / 2;
                    this.opacity = 1 - (fadeElapsedTime / fadeDuration);
                }
            } else {
                // Scroll up and fade out as originally designed
                this.worldY -= 0.25;
                if (elapsedTime > this.duration / 2) {
                    const fadeElapsedTime = elapsedTime - this.duration / 2;
                    const fadeDuration = this.duration / 2;
                    this.opacity = 1 - (fadeElapsedTime / fadeDuration);
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Set text font properties based on whether text grows over time
        const fontSize = this.growsOverTime ? this.currentFontSize : this.initialFontSize;
        if (!this.isCrit) {
            ctx.font = `${fontSize}px Helvetica`;
        } else {
            ctx.font = `bold ${fontSize}px Helvetica`;
        }
        ctx.textAlign = 'center';

        // Set shadow properties
        ctx.shadowColor = 'rgba(0, 0, 0, 1)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Set text color based on the type of text
        if (this.isHealing) {
            ctx.fillStyle = "rgb(27, 255, 0)";
        } else if (this.isCrit) {
            ctx.fillStyle = 'red';
        } else {
            ctx.fillStyle = this.isPlayer ? 'red' : 'white';
        }

        // Draw the text

            ctx.fillText(this.value, this.worldX - this.game.camera.x, this.worldY - this.game.camera.y);

        ctx.restore();
    }
}
