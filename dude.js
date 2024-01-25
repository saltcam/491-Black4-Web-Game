var SPIN_ATTACK_RADIUS = 115; // Default value
var CONE_ATTACK_RADIUS = 135; // Default value

/* Dude is our main character. He can move up down left and right on the map.
   For unarmed walk, use width of 48, height of 55, frameCount of 4, and frameDuration of 0.2
   For scythe walk, use width of 92, height of 55, frameCount of 4, and frameDuration of 0.2
   For unarmed standing, use width of 48, height of 55, frameCount of 2, and frameDuration of 0.5
   For scythe standing, use width of 92, height of 55, frameCount of 2, and frameDuration of 0.5
 */
class Dude extends Entity {
    constructor(game) {
        super(1000, 1000, 10, game, 0, 0,
            38, 56.66, "player", 200,
            "./sprites/dude-spritesheet-stand-scythe.png",
            0, 0, 92, 55, 2, 0.5, 1.5);

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

        // If health hits 0 or below, this entity is declared dead
        if (this.currHP <= 0) {
            this.isDead = true;
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


    };

    // Sets the flag indicating a spin attack has happened
    performSpinAttack() {
        const currentTime = this.game.timer.gameTime;

        if (this.game.rightClick && currentTime - this.lastSpinAttackTime >= this.spinAttackCooldown) {
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
        if (this.game.leftClick && currentTime - this.lastPrimaryAttackTime >= this.primaryAttackCooldown) {
            const clickPos = this.game.leftClick;

            // Debug: Show left click position
            //console.log(clickPos);

            // Calculate the center of the character
            const center = this.calculateCenter();
            const screenXCenter = center.x - this.game.camera.x;
            const screenYCenter = center.y - this.game.camera.y;

            // Calculate the angle towards the click position
            let dx = clickPos.x - screenXCenter;
            let dy = clickPos.y - screenYCenter;
            this.attackAngle = Math.atan2(dy, dx);
            //
            const offsetDistance = PRIMARY_ATTACK_RADIUS * 0.6;
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;

            this.isAttacking = true; // Set the isAttacking flag to true
            this.attackDuration = 0.1; // Duration of the attack animation
            this.game.leftClick = null; // Reset the left-click
            this.lastPrimaryAttackTime = currentTime;
            this.game.addEntity(new AttackCirc(this.game, this,
                PRIMARY_ATTACK_RADIUS/2,
                'playerAttack',
                dx, dy,
                this.attackDuration));
        }
    }

    draw(ctx) {

        //this.animator.drawFrame(this.game.clockTick, ctx,this.worldX, this.worldY, this.lastMove);
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);

        this.boundingBox.draw(ctx, this.game);
        this.drawHealth(ctx);

        // Used to calculate the center of the screen from which attacks originate from
        let screenXCenter = this.calculateCenter().x - this.game.camera.x;
        let screenYCenter = this.calculateCenter().y - this.game.camera.y;

        // Draw the spin attack if the character is 'spinning'
        // This will just draw a circle around the player that will detect enemy collisions
        // if (this.isSpinning) {
        //     ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        //     ctx.beginPath();
        //     ctx.arc(screenXCenter, screenYCenter, SECONDARY_ATTACK_RADIUS, 0, Math.PI * 2);
        //     ctx.fill();
        //
        //     // Update spin attack duration
        //     this.spinAttackDuration -= this.game.clockTick;
        //     if (this.spinAttackDuration <= 0) {
        //         this.isSpinning = false;
        //     }
        // }
        //
        // // Draw the attack cone if the character is attacking
        // // This will draw a smaller circle with one side of the circle originating
        // // from the center of the player and the other side ending at the mouse click
        // // but only up to a specific diameter size
        // if (this.isAttacking) {
        //     // Set the offset distance from the player to spawn the circle attack
        //     const offsetDistance = PRIMARY_ATTACK_RADIUS * 0.6; // Adjust this to make the circle attack spawn farther from the player
        //
        //     // Calculate the center position of the attack circle
        //     let attackCircleX = screenXCenter + Math.cos(this.attackAngle) * offsetDistance;
        //     let attackCircleY = screenYCenter + Math.sin(this.attackAngle) * offsetDistance;
        //
        //     ctx.fillStyle = "rgba(255, 0, 0, 0.2)"; // Semi-transparent red color for the attack area
        //     ctx.beginPath();
        //     ctx.arc(attackCircleX, attackCircleY, PRIMARY_ATTACK_RADIUS / 2, 0, Math.PI * 2);
        //     ctx.fill();
        //
        //     // Update attack duration
        //     this.attackDuration -= this.game.clockTick;
        //     if (this.attackDuration <= 0) {
        //         this.isAttacking = false;
        //     }
        // }
    }
}