// This is the animator class for player.js. It is used to animate the character spritesheet and allows the spritesheet to be changed on the fly.
class Animator {
    constructor(game, spritesheet, xStart, yStart, width, height, frameCount, frameDuration, scale) {
        this.game = game;
        this.spritesheet = spritesheet;
        this.xStart = xStart;
        this.yStart = yStart;
        this.width = width;
        this.height = height;
        this.frameCount = frameCount;
        this.frameDuration = frameDuration;

        this.elapsedTime = 0;
        this.totalTime = this.frameCount * this.frameDuration;
        this.scale = scale;
        this.pauseFrame = -1;
        this.beingDamaged = false; // Is the sprite currently in damaged mode?
        this.damageStartTime = 0; // Start time of the damage effect
        this.damageDuration = 0; // Duration of the damage effect

        // Outline stuff
        this.outlineMode = false;
        this.outlineColor = 'yellow';
        this.outlineBlur = 10; // Adjust for desired glow size

        // Rotation properties
        this.isRotating = false;
        this.rotationSpeed = 50; // Degrees per frame
        this.currentRotationAngle = 0;
    };

    // Call this to tell the animator to pause at the given frame.
    // Pass this method a -1 to unpause.
    pauseAtFrame(frameNumber) {
        this.pauseFrame = frameNumber;
    }

    // Method to pause animation at a specific frame
    pauseAtSpecificFrame(frameNumber) {
        this.specificPauseFrame = frameNumber;
    }

    drawFrame(tick, ctx, x, y, direction) {
        // Update the elapsed time (only if we are not paused)
        if (!this.game.isGamePaused) {
            this.elapsedTime += tick;
            // Update the current rotation angle
            this.currentRotationAngle += this.rotationSpeed * tick;
            this.currentRotationAngle = this.currentRotationAngle % 360;
        }

        // Check if the damage effect should still be applied
        if (this.beingDamaged && (this.game.elapsedTime - this.damageStartTime < this.damageDuration)) {
            // Continue showing the damaged sprite
        } else {
            this.beingDamaged = false;
        }

        // If the elapsed time is greater than the total time, reset the elapsed time
        if (this.elapsedTime > this.totalTime) this.elapsedTime -= this.totalTime;


        // Get the current frame
        const frame = this.currentFrame();

        // Check if current frame matches the specific pause frame
        if (this.specificPauseFrame !== null && frame === this.specificPauseFrame) {
            this.pauseAtFrame(this.specificPauseFrame); // Pause at the specific frame
            this.specificPauseFrame = null; // Reset specificPauseFrame to avoid repeated pausing in future loops
        }

        // Save the current context state
        ctx.save();

        // Calculate scale adjustments
        const scaledWidth = this.width * this.scale;
        const scaledHeight = this.height * this.scale;

        // Adjust x and y to center the sprite based on the new scaled size
        x = x - (scaledWidth - this.width) / 2;
        y = y - (scaledHeight - this.height) / 2;

        // Flip the canvas context horizontally if the direction is left
        if (direction === "left") {
            ctx.scale(-1, 1);   // Scale the context horizontally by -1 (flips horizontally)
            x = -x - (this.width * this.scale); // Adjust the x position when flipped
        }

        // Apply an outline glow effect (if on)
        if (this.outlineMode) {
            ctx.shadowBlur = this.outlineBlur;
            ctx.shadowColor = this.outlineColor; // Adjust for desired glow color
        }

        // Apply rotation if enabled
        if (this.isRotating) {
            ctx.translate(x + scaledWidth / 2, y + scaledHeight / 2);
            ctx.rotate(this.currentRotationAngle * Math.PI / 180);
            x = -scaledWidth / 2;
            y = -scaledHeight / 2;
        }

        // If flag is set to true, pause the animation to the first frame
        // Apply scaling, flipping, and drawing logic...
        if (this.pauseFrame >= 0) {
            // Draw only the specified pause frame
            ctx.drawImage(this.spritesheet,
                this.xStart + (this.width * this.pauseFrame),
                this.yStart,
                this.width,
                this.height,
                x,
                y,
                this.width * this.scale,
                this.height * this.scale);
            ctx.restore();
        } else {
            // Determine the path for the spritesheet
            let newSpritesheetPath = this.spritesheet.src;
            // Find the index of "/sprites/"
            const spritesIndex = newSpritesheetPath.indexOf("/sprites/");
            // Ensure the path starts with "./sprites/" by reconstructing it if "/sprites/" is found
            if (spritesIndex !== -1) {
                newSpritesheetPath = "." + newSpritesheetPath.substring(spritesIndex);
            }

            // Apply "_DAMAGED" suffix if in damaged mode
            if (this.beingDamaged) {
                newSpritesheetPath = newSpritesheetPath.replace(".png", "_DAMAGED.png");
            }

            // Draw the current frame with scaling
            ctx.drawImage(ASSET_MANAGER.getAsset(newSpritesheetPath),
                this.xStart + (this.width * frame),
                this.yStart,
                this.width,
                this.height,
                x,
                y,
                scaledWidth,
                scaledHeight);

            // Restore highlight properties
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'white';

            // Restore the context to its original state
            ctx.restore();
        }
    }

    currentFrame() {
        return Math.floor(this.elapsedTime / this.frameDuration);
    }

    isDone() {
        return (this.elapsedTime >= this.totalTime);
    }

    changeSpritesheet(newSpritesheet, newXStart, newYStart, newWidth, newHeight, newFrameCount, newFrameDuration) {
        this.spritesheet = newSpritesheet;  // Change the spritesheet
        this.xStart = newXStart;            // Change the starting X position on the spritesheet
        this.yStart = newYStart;            // Change the starting Y position on the spritesheet
        this.width = newWidth;              // Change the width of each frame
        this.height = newHeight;            // Change the height of each frame
        this.frameCount = newFrameCount;    // Change the frame count
        this.frameDuration = newFrameDuration;  // Change the frame duration
        this.totalTime = this.frameCount * this.frameDuration; // Recalculate the total time
        this.elapsedTime = 0;  // Reset animation timing
    }

    // Method to switch to the damaged sprite and then switch back after a duration
    // Method to switch to the damaged sprite and then switch back after a duration
    damageSprite(damageDuration) {
        this.beingDamaged = true;
        this.damageStartTime = this.game.elapsedTime; // Record the start time of the damage
        this.damageDuration = damageDuration; // Set the duration of the damage effect
    }
}