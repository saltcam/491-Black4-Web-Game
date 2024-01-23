class Enemy_Contact extends Entity {
    constructor(name, maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale) {
        super(maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale);

        this.name = name;
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves
    }

    checkCollisionAndDealDamage() {
        const player = this.game.player;
        if (this.boundingBox.isColliding(player.boundingBox)) {
            player.takeDamage(this.atkPow);
        }

    }

    // this is the movement pattern for enemies that just approach the player
    update() {
        // If health hits 0 or below, this entity is declared dead
        if (this.currHP <= 0)
        {
            this.isDead = true;
        }

        const player = this.game.player;

        // Determine the direction to face based on the player's position
        if (player.worldX < this.worldX) {
            // Player is to the left, face left
            this.lastMove = "left";
        } else if (player.worldX > this.worldX) {
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
        const boxWidth = this.boundingBox.width; // You might want to scale these too
        const boxHeight = this.boundingBox.height; // You might want to scale these too
        this.boundingBox.updateCentered(scaledCenterX, scaledCenterY, boxWidth, boxHeight);

        this.checkCollisionAndDealDamage();
    }

    draw(ctx, game) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);
        this.boundingBox.draw(ctx, this.game);
        this.drawHealth(ctx);
    }

}