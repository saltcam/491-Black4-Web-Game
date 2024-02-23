class Enemy_Contact extends Entity {
    constructor(name, maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, exp) {
        super(maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, exp);

        this.name = name;
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves
        this.boundingBox.drawBoundingBox = false;

        // Properties to track cooldown of being able to damage the player
        this.attackCooldown = 1;    // in seconds
        this.lastAttackTime = 0;    // time since last attack

        this.pushbackVector = { x: 0, y: 0 };
        this.pushbackDecay = 0.9; // Determines how quickly the pushback force decays
    }

    applyPushback(forceX, forceY) {
        this.pushbackVector.x += forceX;
        this.pushbackVector.y += forceY;
    }

    // this is the movement pattern for enemies that just approach the player
    update() {
        super.update();

        // Apply pushback
        this.worldX += this.pushbackVector.x;
        this.worldY += this.pushbackVector.y;

        // Decay the pushback force
        this.pushbackVector.x *= this.pushbackDecay;
        this.pushbackVector.y *= this.pushbackDecay;

        // If pushback is very small, reset it to 0 to stop movement
        if (Math.abs(this.pushbackVector.x) < 0.1) this.pushbackVector.x = 0;
        if (Math.abs(this.pushbackVector.y) < 0.1) this.pushbackVector.y = 0;

        // Early exit if the player does not exist or enemy is dead
        if (!this.game.player || this.isDead) {
            return;
        }

        // If health hits 0 or below, this entity is declared dead
        if (this.currHP <= 0)
        {
            this.isDead = true;
        }

        const player = this.game.player;

        // Determine the direction to face based on the player's position
        if (player.worldX < this.worldX + this.animator.width/2) {
            // Player is to the left, face left
            this.lastMove = "left";
        } else if (player.worldX > this.worldX + this.animator.width/2) {
            // Player is to the right, face right
            this.lastMove = "right";
        }

        const targetDirection = this.calcTargetAngle(player);

        // Apply movement based on the direction and the zombie's speed
        this.worldX += targetDirection.x * this.movementSpeed * this.game.clockTick;
        this.worldY += targetDirection.y * this.movementSpeed * this.game.clockTick;

        // Calculate the scaled center of the sprite
        const scaledCenterX = this.worldX + (this.animator.width) / 2;
        const scaledCenterY = this.worldY + (this.animator.height) / 2;

        // Update the bounding box to be centered around the scaled sprite
        const boxWidth = this.boundingBox.width;
        const boxHeight = this.boundingBox.height;
        this.boundingBox.updateCentered(scaledCenterX, scaledCenterY, boxWidth, boxHeight);

        this.checkCollisionAndDealDamage();
    }

    checkCollisionAndDealDamage() {
        const player = this.game.player;
        const currentTime = this.game.elapsedTime / 1000;

        // Check collision and cooldown
        if (this.boundingBox.isColliding(player.boundingBox) && currentTime - this.lastAttackTime >= this.attackCooldown) {
            player.takeDamage(this.atkPow);
            this.lastAttackTime = currentTime; // Update last attack time
        }
    }
}