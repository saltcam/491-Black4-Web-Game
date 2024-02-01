class Exp_Orb extends Entity {
    constructor(game, worldX, worldY, exp) {
        let size = 0.3 * exp;
        super(1, 1, 0, game, worldX, worldY,
            5, 5, "orb", 0,
            "./sprites/exp_orb.png",
            0, 0, 17, 17, 3, 0.2, size, exp);
        this.dist = 350;
        this.removeFromWorld = false;
    }

    updateMoveSpeed() {

        const targetCenter = this.game.player.calculateCenter();
        const selfCenter = this.calculateCenter();

        // Calculate direction vector towards the target's center
        const dirX = targetCenter.x + 16 - selfCenter.x;
        const dirY = targetCenter.y - selfCenter.y;

        this.dist = Math.sqrt(dirX * dirX + dirY * dirY);
        const speed = 350 - this.dist;

        if (speed > 0) {
            this.movementSpeed = speed;
        }

    }
    update() {
        super.update();

        if (!this.game.player || this.isDead) {
            return;
        }

        const targetDirection = this.calcTargetAngle(this.game.player);

        this.updateMoveSpeed();

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

        if (this.dist <= 5) {
            this.removeFromWorld = true;
            this.game.player.gainExp(this.exp);
        }

    }


    draw(ctx, game) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);

        this.boundingBox.draw(ctx, game);
    }
}