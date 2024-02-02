// This is the animator class for player.js. It is used to animate the character spritesheet and allows the spritesheet to be changed on the fly.
class Animator {
    constructor(spritesheet, xStart, yStart, width, height, frameCount, frameDuration, scale) {
        Object.assign(this, { spritesheet, xStart, yStart, width, height, frameCount, frameDuration }); // Copy the parameters into the object

        this.elapsedTime = 0;
        this.totalTime = this.frameCount * this.frameDuration;
        this.scale = scale;
    };

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

        // Draw the current frame with scaling
        ctx.drawImage(this.spritesheet,
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
};