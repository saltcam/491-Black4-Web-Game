// This is the animator class for player.js. It is used to animate the character spritesheet and allows the spritesheet to be changed on the fly.
class Animator {
    constructor(spritesheet, xStart, yStart, width, height, frameCount, frameDuration, scale) {
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
        this.beingDamaged = false;  // Is the sprite currently in damaged mode?
    };

    // Call this to tell the animator to pause at the given frame.
    // Pass this method a -1 to unpause.
    pauseAtFrame(frameNumber) {
        this.pauseFrame = frameNumber;
    }

    drawFrame(tick, ctx, x, y, direction) {
        // Update the elapsed time
        this.elapsedTime += tick;

        // If the elapsed time is greater than the total time, reset the elapsed time
        if (this.elapsedTime > this.totalTime) this.elapsedTime -= this.totalTime;

        // Get the current frame
        const frame = this.currentFrame();

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

        // If flag is set to true, pause the animation to the first frame
        if (this.pauseFrame >= 0) {
            // Draw only the last frame
            ctx.drawImage(this.spritesheet,
                this.xStart + (this.width * this.pauseFrame),
                this.yStart,
                this.width,
                this.height,
                x,
                y,
                scaledWidth,
                scaledHeight);

                ctx.restore();

            return;
        }
        else {
            if (!this.beingDamaged) {
                let newSpritesheetPath = this.spritesheet.src;
                newSpritesheetPath = newSpritesheetPath.replace("http://localhost:63342/491-Black4-Web-Game", "."); // Uhh not sure if this will be the case on everyone else's machine?
                newSpritesheetPath = newSpritesheetPath.replace("https://saltcam.github.io/491-Black4-Web-Game", ".");

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

                // Restore the context to its original state
                ctx.restore();
            } else {
                let newSpritesheetPath = this.spritesheet.src;
                newSpritesheetPath = newSpritesheetPath.replace("http://localhost:63342/491-Black4-Web-Game", ".");
                newSpritesheetPath = newSpritesheetPath.replace("https://saltcam.github.io/491-Black4-Web-Game", ".");
                newSpritesheetPath = newSpritesheetPath.replace(".png", "_DAMAGED.png");

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

                // Restore the context to its original state
                ctx.restore();
            }
        }
    };

    currentFrame() {
        return Math.floor(this.elapsedTime / this.frameDuration);
    };

    isDone() {
        return (this.elapsedTime >= this.totalTime);
    };

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
    damageSprite(damageDuration) {
        if (!this.beingDamaged) {
            this.beingDamaged = true;

            setTimeout(() => {
                this.beingDamaged = false;
            }, damageDuration);
        }
    }
}