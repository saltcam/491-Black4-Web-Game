/**
 * Player is our main character. He can move up down left and right on the map.
 * Player will be able to perform primary (left click) attacks, and secondary (right click) attacks.
 * Player can also dash using spacebar.
 * For dude-spritesheet-walk.png, use width of 48, height of 55, frameCount of 4, and frameDuration of 0.2, scale 1.5
 * For dude-spritesheet-walk-scythe.png, use width of 92, height of 55, frameCount of 4, and frameDuration of 0.2, scale 1.5
 * For dude-spritesheet-stand.png, use width of 48, height of 55, frameCount of 2, and frameDuration of 0.5, scale 1.5
 * For dude-spritesheet-stand-scythe.png, use width of 92, height of 55, frameCount of 2, and frameDuration of 0.5, scale 1.5
 * For McIdle.png, use width of 32, height of 28, frameCount of 2, and frameDuration of 0.5, scale 2.2
 * For McWalk.png, use width of 32, height of 28, frameCount of 8, and frameDuration of 0.1, scale 2.2
 */
class Player extends Entity {
    constructor(game) {
        super(100, 100, 0, game, 0, 0,
            17, 29, "player", 200,
            "./sprites/McIdle.png",
            0, 0, 32, 28, 2, 0.5, 2.2, 0);

        // Animation settings
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves

        // Dash implementation
        this.defaultDashCooldown = 1;   // This is the actual cooldown of dash that will be used each time we dash
        this.currentDashCooldown = this.defaultDashCooldown;    // This holds the current time left till we can dash again
        this.dashSpeedMultiplier = 3;
        this.dashDuration = .5;

        this.level = 1;
        // weapon handling
        this.weapons = [new Weapon_scythe(game, "Scythe", 1, 2),
                        new Weapon_tome(game, "Tome", 1, 10)];
        // index for current weapon: Weapon_scythe = 0; Weapon_tome = 1; Tome = 2;
        this.currentWeapon = 0;
        this.weaponSwitchCooldown = 0.5; // Cooldown time in seconds to prevent rapid switching
        this.lastWeaponSwitchTime = 0;
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

        // Perform attacks if mouse buttons are held down and the attacks are off cooldown.
        // To achieve this store the current game time and subtract it to the time since last attack to see
        // if we are ready to trigger another attack.
        const currentTime = this.game.timer.gameTime;

        // Allows the user to switch weapons on a cooldown
        if (this.game.keys["q"] && currentTime - this.lastWeaponSwitchTime >= this.weaponSwitchCooldown) {
            this.currentWeapon = (this.currentWeapon + 1) % this.weapons.length;
            this.lastWeaponSwitchTime = currentTime;
        }

        //asks current weapon if it can attack
        if (this.game.leftMouseDown && currentTime - this.weapons[this.currentWeapon].lastPrimaryAttackTime >= this.weapons[this.currentWeapon].primaryCool) {
            this.weapons[this.currentWeapon].performPrimaryAttack(this);
        }

        // Perform the secondary attack off cooldown as long as right click is held.
        if (this.game.rightMouseDown && currentTime - this.weapons[this.currentWeapon].lastSecondAttackTime >= this.weapons[this.currentWeapon].secondCool) {
            this.weapons[this.currentWeapon].performSecondaryAttack(this);
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

        // Calculate intended new position
        let intendedX = this.worldX + moveX * delta;
        let intendedY = this.worldY + moveY * delta;

        // We are now going to detect X and Y collisions of map objects so that the player can still 'slide' on the surface of their bounding boxes.
        // Without doing it this way, the player kind of just got 'stuck' in place when colliding with map objects.
        // Check collisions with map objects for X-axis
        let collisionX = this.game.objects.some(mapObject =>
            this.checkCollisionWithMapObject(intendedX, this.worldY, mapObject));

        // Check collisions with map objects for Y-axis
        let collisionY = this.game.objects.some(mapObject =>
            this.checkCollisionWithMapObject(this.worldX, intendedY, mapObject));

        // Update position based on collision detection
        if (!collisionX) {
            this.worldX = Math.max(this.game.mapBoundaries.left, Math.min(this.game.mapBoundaries.right, intendedX));
        }
        if (!collisionY) {
            this.worldY = Math.max(this.game.mapBoundaries.top, Math.min(this.game.mapBoundaries.bottom, intendedY));
        }

        // Check if the animation state needs to be switched
        // TODO: Check if the player has the scythe or a different weapon equipped and change the spritesheet accordingly (Consider using the weapons classes!)
        if (this.isMoving && this.currentAnimation !== "walking") {
            this.currentAnimation = "walking";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/McWalk.png"), 0, 0, 32, 28, 8, 0.1);
        } else if (!this.isMoving && this.currentAnimation !== "standing") {
            this.currentAnimation = "standing";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/McIdle.png"), 0, 0, 32, 28, 2, 0.5);
        }

        // decrements dash cooldown
        this.currentDashCooldown -= this.game.clockTick;
        if (this.currentDashCooldown < 0) {
            this.currentDashCooldown = 0;
        }
        // checks if space bar has been pressed and the dash is not on cooldown
        if (this.game.keys[" "] && this.currentDashCooldown === 0) {
            this.performDash();
        }
    };

    checkCollisionWithMapObject(intendedX, intendedY, mapObject) {
        // Create a temporary bounding box for the intended position
        let tempBoundingBox = new BoundingBox(intendedX, intendedY, this.boundingBox.width, this.boundingBox.height, this.boundingBox.type);

        // Check if this temporary bounding box collides with the map object's bounding box
        return tempBoundingBox.isColliding(mapObject.boundingBox);
    }

    // called when the user has a valid dash and presses space bar
    performDash() {
        this.currentDashCooldown = this.defaultDashCooldown; // reset dash cooldown to the default

        this.movementSpeed *= this.dashSpeedMultiplier; // increase movement speed

        // timeout function to reset movement speed after desired time
        setTimeout(() => {
            this.movementSpeed /= this.dashSpeedMultiplier;
        }, this.dashDuration * 1000); // convert dashDuration from seconds to milliseconds for accurate timeout

    }

    gainExp(exp) {
        //console.log("Exp: " + this.exp + " + " + exp + " = " + (this.exp + exp));
        this.exp += exp;

        // level up!
        if (this.exp >= (this.level * 10)) {
            //console.log("level");
            this.exp -= (this.level * 10);
            this.level++;
        }
    }

    drawExp(ctx) {
        ctx.beginPath();
        ctx.fillStyle = "Black";
        ctx.fillRect(this.boundingBox.left - this.game.camera.x,
            this.boundingBox.top + this.boundingBox.height - this.game.camera.y + 10,
            this.boundingBox.width, 10);
        ctx.closePath();

        //draw the current exp value
        ctx.beginPath();
        ctx.fillStyle = "Yellow";
        let meter = ((this.exp) / (this.level * 10));
        // prevents exp bar from going too far in any direction
        if (meter > 1) {
            meter = 1;
        }
        ctx.fillRect(this.boundingBox.left - this.game.camera.x,
            this.boundingBox.top + this.boundingBox.height - this.game.camera.y + 10,
            this.boundingBox.width * meter, 10);
        ctx.closePath();
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
        this.drawExp(ctx);
        this.boundingBox.draw(ctx, game);
    }
}