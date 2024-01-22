class Zombie extends Entity{
    constructor(game) {
        super(game, 600, 300, 57, 85, "enemy", 200,
            "./sprites/zombie-spritesheet-stand-.png",
            0, 0, 48, 55, 4, 0.2);
        this.game = game;

        this.animator = new Animator(ASSET_MANAGER.getAsset("./sprites/zombie-spritesheet-stand.png"), 0, 0, 48, 55, 2, 0.5);
        this.yOffset = -25; // Offsets the character upwards from the center of the canvas (you see this used in the draw() method below)

        // Calculate the middle of the canvas, then adjust by half of the character's width and height to center the character
        this.x = 10;
        this.y = 10;

        // initializing the player's bounding box
        this.box = new BoundingBox(this.x + 40, this.y - 20, 57, 85, "enemy");

        this.movementSpeed = 50; // Movement Speed
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves
    }

    update() {
        const player = this.game.player;
        const targetDirection = this.calcTargetAngle(player);

        // Apply movement based on the direction and the zombie's speed
        this.worldX += targetDirection.x * this.movementSpeed * this.game.clockTick;
        this.worldY += targetDirection.y * this.movementSpeed * this.game.clockTick;

        // Update the bounding box
        this.boundingBox.update(this.worldX, this.worldY);
    }

    draw(ctx, game) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);
        this.boundingBox.draw(ctx, this.game);
    }

}