// Dude is our main character. He can move up down left and right on the map.
class Dude {
    constructor(game) {
        this.game = game;

        // Define the animator for the character. The parameters are: spritesheet, xStart, yStart, width, height, frameCount, frameDuration
        this.animator = new Animator(ASSET_MANAGER.getAsset("./sprites/dude-spritesheet-walk.png"), 0, 0, 48, 55, 4, 0.2);

        this.yOffset = -25; // Offsets the character upwards from the center of the canvas (you see this used in the draw() method below)

        // Calculate the middle of the canvas, then adjust by half of the character's width and height to center the character
        this.x = (game.ctx.canvas.width / 2) - (this.animator.width * 1.5 / 2); 
        this.y = (game.ctx.canvas.height / 2) - (this.animator.height * 1.5 / 2); 

        this.movementSpeed = 200; // Movement Speed
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "walking"; // Can be "walking" or "standing" for now
    };

    update() {
        // Calculate the delta time which is defined as the time passed in seconds since the last frame.
        // We will use this to calculate how much we should move the character on this frame.
        const delta = this.game.clockTick * this.movementSpeed;

        this.isMoving = false; // Reset the isMoving flag to false

        // Update the world position based on key presses
        if (this.game.keys["w"]) {
            this.isMoving = true; // Set the isMoving flag to true
            this.game.worldY -= delta;
        }
        if (this.game.keys["s"]) {
            this.isMoving = true; // Set the isMoving flag to true
            this.game.worldY += delta;
        }
        if (this.game.keys["a"]) {
            this.isMoving = true; // Set the isMoving flag to true
            this.game.worldX -= delta;
            this.lastMove = "left"; // Set the lastMove to left
        }
        if (this.game.keys["d"]) {
            this.isMoving = true; // Set the isMoving flag to true
            this.game.worldX += delta;
            this.lastMove = "right"; // Set the lastMove to right
        }

        // Check if the animation state needs to be switched
        if (this.isMoving && this.currentAnimation !== "walking") {
            this.currentAnimation = "walking";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/dude-spritesheet-walk.png"), 4, 0.2);
        } else if (!this.isMoving && this.currentAnimation !== "standing") {
            this.currentAnimation = "standing";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/dude-spritesheet-stand.png"), 2, 0.5);    // We use 2 and 0.5 here because the standing spritesheet only has 2 frames and we want them to last 0.5 sec each
        }
    };

    draw(ctx) {
        // Draw the character in the center of the canvas with the direction and offset the character up or down via the yOffset
        this.animator.drawFrame(this.game.clockTick, ctx,
            ctx.canvas.width / 2 - this.animator.width * 1.5 / 2,
            ctx.canvas.height / 2 - this.animator.height * 1.5 / 2 + this.yOffset,
            this.lastMove); // Pass the lastMove as direction
    };
};