var SPIN_ATTACK_RADIUS = 115; // Default value
var CONE_ATTACK_RADIUS = 135; // Default value
// Dude is our main character. He can move up down left and right on the map.
class Dude extends Entity{
    constructor(game) {
        super(game, 720, 405, 57, 85, "player", 200,
            "./sprites/dude-spritesheet-stand-scythe.png",
            0, 0, 92, 55, 2, 0.5);
        // this.game = game;

        // Define the animator for the character. The parameters are: spritesheet, xStart, yStart, width, height, frameCount, frameDuration
        // For unarmed walk, use width of 48, height of 55, frameCount of 4, and frameDuration of 0.2
        // For scythe walk, use width of 92, height of 55, frameCount of 4, and frameDuration of 0.2
        // For unarmed standing, use width of 48, height of 55, frameCount of 2, and frameDuration of 0.5
        // For scythe standing, use width of 92, height of 55, frameCount of 2, and frameDuration of 0.5
        // this.animator = new Animator(ASSET_MANAGER.getAsset("./sprites/dude-spritesheet-stand-scythe.png"), 0, 0, 92, 55, 2, 0.5);
        this.yOffset = -25; // Offsets the character upwards from the center of the canvas (you see this used in the draw() method below)

        // Calculate the middle of the canvas, then adjust by half of the character's width and height to center the character
        // this.x = (game.ctx.canvas.width / 2) - (this.animator.width * 1.5 / 2);
        // this.y = (game.ctx.canvas.height / 2) - (this.animator.height * 1.5 / 2);
        // initializing the player's bounding box
        //TODO find a better way of getting height and width values for player
        // this.box = new BoundingBox(this.x + 40, this.y - 20, 57, 85, "player");

        // this.movementSpeed = 200; // Movement Speed
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves

        //Attack cooldown and Last time the attack was used
        this.primaryAttackCooldown = 1;
        this.spinAttackCooldown = 2;
        this.lastPrimaryAttackTime = -10000;
        this.lastSpinAttackTime = -10000;

        // Initialize the player worldX and Y to the center of the canvas
        // this.worldX = this.game.ctx.canvas.width / 2 - this.animator.width * 1.5 / 2;
        // this.worldY = this.game.ctx.canvas.height / 2 - this.animator.height * 1.5 / 2 + this.yOffset;
    };

    update() {
        console.log(this.worldX);
        console.log(this.worldY);

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

        if (this.game.rightClick) {
            this.performSpinAttack();
            this.game.rightClick = false; // Reset the right-click flag
        }

        if (this.game.leftClick) {
            this.performPrimaryAttack();
            this.game.leftClick = false; // Reset the right-click flag
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
        this.worldX += moveX * delta;
        this.worldY += moveY * delta;

        // Check if the animation state needs to be switched
        // TODO: Check if the player has the scythe or a different weapon equipped and change the spritesheet accordingly
        if (this.isMoving && this.currentAnimation !== "walking") {
            this.currentAnimation = "walking";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/dude-spritesheet-walk-scythe.png"), 0, 0, 92, 55, 4, 0.2);
        } else if (!this.isMoving && this.currentAnimation !== "standing") {
            this.currentAnimation = "standing";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/dude-spritesheet-stand-scythe.png"), 0, 0, 92, 55, 2, 0.5);    // We use 2 and 0.5 here because the standing spritesheet only has 2 frames and we want them to last 0.5 sec each
        }

        this.boundingBox.update(this.worldX + 39, this.worldY);
    };

    // Sets the flag indicating a spin attack has happened
    performSpinAttack() {
        const currentTime = this.game.timer.gameTime;

        if (this.game.rightClick && currentTime - this.lastSpinAttackTime >= this.spinAttackCooldown) {
            this.isSpinning = true; // Set the isSpinning flag to true
            this.spinAttackDuration = 0.25; // Duration of the spin attack in seconds
            this.lastSpinAttackTime = currentTime;
        }
    }

    /* Calculates the angle toward the mouse click position and sets the attack angle
     Sets the flag indicating a primary attack has happened */
    performPrimaryAttack() {
        const currentTime = this.game.timer.gameTime;
        if (this.game.leftClick && currentTime - this.lastPrimaryAttackTime >= this.primaryAttackCooldown) {
            const clickPos = this.game.leftClick;

            let screenXCenter = this.worldX - this.game.camera.x + this.animator.width * 1.5 / 2;
            let screenYCenter = this.worldY - this.game.camera.y + this.animator.height * 1.5 / 2;

            // Calculate the angle towards the click position
            const dx = clickPos.x - screenXCenter;
            const dy = clickPos.y - screenYCenter;
            this.attackAngle = Math.atan2(dy, dx);

            this.isAttacking = true; // Set the isAttacking flag to true
            this.attackDuration = 0.25; // Duration of the attack animation
            this.game.leftClick = null; // Reset the left-click
            this.lastPrimaryAttackTime = currentTime;
        }
    }

    draw(ctx, game) {
        // Draw the character in the center of the canvas with the direction and offset the character up or down via the yOffset
        // this.animator.drawFrame(this.game.clockTick, ctx,
        //     ctx.canvas.width / 2 - this.animator.width * 1.5 / 2,
        //     ctx.canvas.height / 2 - this.animator.height * 1.5 / 2 + this.yOffset,
        //     this.lastMove); // Pass the lastMove as direction

        //this.animator.drawFrame(this.game.clockTick, ctx,this.worldX, this.worldY, this.lastMove);
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);

        this.boundingBox.draw(ctx, this.game);

        // Calculate the screen position for the center of the player
        let screenXCenter = this.worldX - this.game.camera.x + this.animator.width * 1.5 / 2;
        let screenYCenter = this.worldY - this.game.camera.y + this.animator.height * 1.5 / 2;

        // Draw the spin attack if the character is 'spinning'
        if (this.isSpinning) {
            const spinAttackRadius = SPIN_ATTACK_RADIUS; // Adjust this value to change size of attack

            // Placeholder for attacking sprite. A red see through circle is drawn for now. (could be used for damage later?)
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
            ctx.beginPath();
            ctx.arc(screenXCenter, screenYCenter, spinAttackRadius, 0, Math.PI * 2);
            ctx.fill();

            // Update spin attack duration
            this.spinAttackDuration -= this.game.clockTick;
            if (this.spinAttackDuration <= 0) {
                this.isSpinning = false;
            }
        }

        // Draw the attack cone if the character is attacking
        if (this.isAttacking) {

            // Placeholder for attacking sprite. A red see through cone is drawn for now. (could be used for damage later?)
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
            ctx.beginPath();
            ctx.moveTo(screenXCenter, screenYCenter);

            // Draw the attack cone
            const coneRadius = CONE_ATTACK_RADIUS; // Fixed radius for the attack cone
            const coneAngle = Math.PI / 3; // Defines the spread of the attack cone
            ctx.arc(screenXCenter, screenYCenter, coneRadius, this.attackAngle - coneAngle / 2, this.attackAngle + coneAngle / 2); // Draw a consistent arc for the attack cone
            ctx.closePath();
            ctx.fill();

            // Update attack duration
            this.attackDuration -= this.game.clockTick;
            if (this.attackDuration <= 0) {
                this.isAttacking = false;
            }
        }
    }
}