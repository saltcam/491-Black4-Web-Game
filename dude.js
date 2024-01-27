const SECONDARY_ATTACK_RADIUS = 115; // Default value
const PRIMARY_ATTACK_RADIUS = 135; // Default value

/**
 * Dude is our main character. He can move up down left and right on the map.
 * Dude will be able to perform primary (left click) attacks, and secondary (right click) attacks.
 * Dude can also dash using spacebar.
 * For dude-spritesheet-walk.png, use width of 48, height of 55, frameCount of 4, and frameDuration of 0.2, scale 1.5
 * For dude-spritesheet-walk-scythe.png, use width of 92, height of 55, frameCount of 4, and frameDuration of 0.2, scale 1.5
 * For dude-spritesheet-stand.png, use width of 48, height of 55, frameCount of 2, and frameDuration of 0.5, scale 1.5
 * For dude-spritesheet-stand-scythe.png, use width of 92, height of 55, frameCount of 2, and frameDuration of 0.5, scale 1.5
 * For McIdle.png, use width of 32, height of 28, frameCount of 2, and frameDuration of 0.5, scale 2.2
 * For McWalk.png, use width of 32, height of 28, frameCount of 8, and frameDuration of 0.1, scale 2.2
 */
class Dude extends Entity {
    constructor(game) {
        super(1000, 1000, 10, game, 0, 0,
            17, 29, "player", 200,
            "./sprites/McIdle.png",
            0, 0, 32, 28, 2, 0.5, 2.2);

        // Animation settings
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves

        // Attack cooldown and Last time the attack was used
        this.primaryAttackCooldown = 1;
        this.spinAttackCooldown = 2;
        this.lastPrimaryAttackTime = -1;
        this.lastSpinAttackTime = -2;
    };

    update() {
        super.update();

        // If player is dead, do nothing
        if (this.isDead) {
            return;
        }

        // If health hits 0 or below, this entity is declared dead
        if (this.currHP <= 0) {
            this.isDead = true;
            this.currentAnimation = "Dead";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/McDead.png"),
                0, 0, 32, 40, 8, 0.1);
        }

        // Debug World Coordinates
        //console.log(this.worldX);
        //console.log(this.worldY);

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

        // NOTE from Nick: I've changed the left and right click detection to instead detect for holding the clickers
        // down, so we can hold click and attack off cooldown (good for not having to spam click when attack speed
        // gets higher).

        // Perform attacks if mouse buttons are held down and the attacks are off cooldown.
        // To achieve this store the current game time and subtract it to the time since last attack to see
        // if we are ready to trigger another attack.
        const currentTime = this.game.timer.gameTime;

        // Perform the primary attack off cooldown as long as left click is held.
        if (this.game.leftMouseDown && currentTime - this.lastPrimaryAttackTime >= this.primaryAttackCooldown) {
            this.performPrimaryAttack();
        }

        // Perform the secondary attack off cooldown as long as right click is held.
        if (this.game.rightMouseDown && currentTime - this.lastSpinAttackTime >= this.spinAttackCooldown) {
            this.performSpinAttack();
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

        // Check and adjust the position to stay within the map boundaries
        let newWorldX = this.worldX + moveX * delta;
        let newWorldY = this.worldY + moveY * delta;

        // Constrain to map boundaries
        newWorldX = Math.max(this.game.mapBoundaries.left, Math.min(this.game.mapBoundaries.right, newWorldX));
        newWorldY = Math.max(this.game.mapBoundaries.top, Math.min(this.game.mapBoundaries.bottom, newWorldY));

        // Update the world position
        this.worldX = newWorldX;
        this.worldY = newWorldY;

        // Check if the animation state needs to be switched
        // TODO: Check if the player has the scythe or a different weapon equipped and change the spritesheet accordingly
        if (this.isMoving && this.currentAnimation !== "walking") {
            this.currentAnimation = "walking";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/McWalk.png"), 0, 0, 32, 28, 8, 0.1);
        } else if (!this.isMoving && this.currentAnimation !== "standing") {
            this.currentAnimation = "standing";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/McIdle.png"), 0, 0, 32, 28, 2, 0.5);
        }
    };

    // Sets the flag indicating a spin attack has happened
    performSpinAttack() {
        const currentTime = this.game.timer.gameTime;

        // Removed the click check and just use the cooldown check
        if (currentTime - this.lastSpinAttackTime >= this.spinAttackCooldown) {
            this.isSpinning = true; // Set the isSpinning flag to true
            this.spinAttackDuration = 0.1; // Duration of the spin attack in seconds
            this.lastSpinAttackTime = currentTime;
            this.game.addEntity(new AttackCirc(this.game, this,
                SECONDARY_ATTACK_RADIUS,
                'playerAttack',
                0, 0,
                this.spinAttackDuration));
        }
    }

    /* Calculates the angle toward the mouse click position and sets the attack angle
     Sets the flag indicating a primary attack has happened */
    performPrimaryAttack() {
        const currentTime = this.game.timer.gameTime;

        // Removed the click check and just use the cooldown check
        if (currentTime - this.lastPrimaryAttackTime >= this.primaryAttackCooldown) {
            const clickPos = this.game.mouse; // Use the current mouse position instead of the click position

            // Calculate the center of the character
            const center = this.calculateCenter();
            const screenXCenter = center.x - this.game.camera.x;
            const screenYCenter = center.y - this.game.camera.y;

            // Calculate the angle towards the mouse position
            let dx = clickPos.x - screenXCenter;
            let dy = clickPos.y - screenYCenter;
            this.attackAngle = Math.atan2(dy, dx);

            const offsetDistance = PRIMARY_ATTACK_RADIUS * 0.6;
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;

            this.isAttacking = true; // Set the isAttacking flag to true
            this.attackDuration = 0.1; // Duration of the attack animation
            this.lastPrimaryAttackTime = currentTime;
            this.game.addEntity(new AttackCirc(this.game, this,
                PRIMARY_ATTACK_RADIUS/2,
                'playerAttack',
                dx, dy,
                this.attackDuration));
        }
    }

    draw(ctx, game) {
        // Check if the camera is initialized.
        // This is necessary as it is needed for this method, but may not be initialized on the first few calls
        // at the start of the game.
        if (!this.game.camera) {
            console.log("dude.draw(): Camera not found! Not drawing player!");
            return; // Skip drawing the player if the camera is not initialized
        }

        //this.animator.drawFrame(this.game.clockTick, ctx,this.worldX, this.worldY, this.lastMove);
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);

        // Force the super class to draw the health bar for our player
        this.drawHealth(ctx);

        this.boundingBox.draw(ctx, game);
    }
}