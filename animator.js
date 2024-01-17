// This is the animator class for dude.js. It is used to animate the character spritesheet and allows the spritesheet to be changed on the fly.
class Animator {
    constructor(spritesheet, xStart, yStart, width, height, frameCount, frameDuration) {
        Object.assign(this, { spritesheet, xStart, yStart, width, height, frameCount, frameDuration }); // Copy the parameters into the object

        this.elapsedTime = 0;
        this.totalTime = this.frameCount * this.frameDuration;
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

        // Flip the canvas context horizontally if the direction is left
        if (direction === "left") {
            ctx.scale(-1, 1);   // Scale the context horizontally by -1 (flips horizontally)
            x = -x - (this.width * 1.5); // Adjust the x position when flipped
        }

        // Draw the current frame
        ctx.drawImage(this.spritesheet,
            this.xStart + (this.width * frame), this.yStart, 
            this.width, this.height,
            x, y,
            this.width * 1.5, this.height * 1.5);

        // Restore the context to its original state
        ctx.restore();
    };

    currentFrame() {
        return Math.floor(this.elapsedTime / this.frameDuration);
    };

    isDone() {
        return (this.elapsedTime >= this.totalTime);
    };

    // This method should be called when we want to change to a new spritesheet animation
    changeSpritesheet(newSpritesheet, newFrameCount, newFrameDuration) {
        this.spritesheet = newSpritesheet; // Change the spritesheet
        this.frameCount = newFrameCount; // Change the frame count
        this.frameDuration = newFrameDuration; // Change the frame duration
        this.totalTime = this.frameCount * this.frameDuration;  // Recalculate the total time
        this.elapsedTime = 0; // Reset animation timing
    }
};