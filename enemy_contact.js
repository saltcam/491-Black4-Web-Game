class Enemy_Contact extends Entity {
    constructor(name, maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur) {
        super(maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur);

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
        const player = this.game.player;
        const targetDirection = this.calcTargetAngle(player);

        // Apply movement based on the direction and the zombie's speed
        this.worldX += targetDirection.x * this.movementSpeed * this.game.clockTick;
        this.worldY += targetDirection.y * this.movementSpeed * this.game.clockTick;

        // Update the bounding box
        this.boundingBox.update(this.worldX, this.worldY);
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