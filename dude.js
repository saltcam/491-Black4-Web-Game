// Dude is our main character. He can move up down left and right on the map.
class Dude{
    constructor(game) {
        this.game = game;

        // Define the animator for the character. The parameters are: spritesheet, xStart, yStart, width, height, frameCount, frameDuration
        // For unarmed walk, use width of 48, height of 55, frameCount of 4, and frameDuration of 0.2
        // For scythe walk, use width of 92, height of 55, frameCount of 4, and frameDuration of 0.2
        // For unarmed standing, use width of 48, height of 55, frameCount of 2, and frameDuration of 0.5
        // For scythe standing, use width of 92, height of 55, frameCount of 2, and frameDuration of 0.5
        this.animator = new Animator(ASSET_MANAGER.getAsset("./sprites/dude-spritesheet-stand-scythe.png"), 0, 0, 92, 55, 2, 0.5);
        this.yOffset = -25; // Offsets the character upwards from the center of the canvas (you see this used in the draw() method below)

        // Calculate the middle of the canvas, then adjust by half of the character's width and height to center the character
        this.x = (game.ctx.canvas.width / 2) - (this.animator.width * 1.5 / 2); 
        this.y = (game.ctx.canvas.height / 2) - (this.animator.height * 1.5 / 2);

        // initializing the player's bounding box
        //TODO find a better way of getting height and width values for player
        this.box = new BoundingBox(this.x + 40, this.y - 20, 57, 85, "player");

        this.movementSpeed = 200; // Movement Speed
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves
    };

    update() {
        // Calculate the delta time which is defined as the time passed in seconds since the last frame.
        // We will use this to calculate how much we should move the character on this frame.
        const delta = this.game.clockTick * this.movementSpeed;

        this.isMoving = false; // Reset the isMoving flag to false

        // Initialize movement vector components, we will use this to normalize the movement vector (so diagonal movement isn't faster than horizontal or vertical movement)
        let moveX = 0;
        let moveY = 0;

        // Update movement vector based on key presses
        if (this.game.keys["w"]) moveY -= 1;
        if (this.game.keys["s"]) moveY += 1;
        if (this.game.keys["a"]) {
            moveX -= 1;
            this.lastMove = "left";     // Remember the last direction the character moved
        }
        if (this.game.keys["d"]) {
            moveX += 1;
            this.lastMove = "right";    // Remember the last direction the character moved
        }

        // Check if the character is moving
        this.isMoving = (moveX !== 0 || moveY !== 0);

        // Normalize the movement vector by calculating the length of the vector and dividing the components by the length
        // If this confuses you, just know that all this is doing is preventing diagonal movement from being faster than horizontal or vertical movement
        let length = Math.sqrt(moveX * moveX + moveY * moveY);
        if (length > 0) {
            moveX /= length;
            moveY /= length;
        }

        // Apply movement to the character's world position in the game engine
        this.game.worldX += moveX * delta;
        this.game.worldY += moveY * delta;

        // Check if the animation state needs to be switched
        // TODO: Check if the player has the scythe or a different weapon equipped and change the spritesheet accordingly
        if (this.isMoving && this.currentAnimation !== "walking") {
            this.currentAnimation = "walking";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/dude-spritesheet-walk-scythe.png"), 0, 0, 92, 55, 4, 0.2);
        } else if (!this.isMoving && this.currentAnimation !== "standing") {
            this.currentAnimation = "standing";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/dude-spritesheet-stand-scythe.png"), 0, 0, 92, 55, 2, 0.5);    // We use 2 and 0.5 here because the standing spritesheet only has 2 frames and we want them to last 0.5 sec each
        }
    };

    draw(ctx, game) {
        // Draw the character in the center of the canvas with the direction and offset the character up or down via the yOffset
        this.animator.drawFrame(this.game.clockTick, ctx,
            ctx.canvas.width / 2 - this.animator.width * 1.5 / 2,
            ctx.canvas.height / 2 - this.animator.height * 1.5 / 2 + this.yOffset,
            this.lastMove); // Pass the lastMove as direction
        this.box.draw(ctx, this.game);
    }
}