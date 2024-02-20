class Exp_Orb extends Entity {
    constructor(game, worldX, worldY, exp) {
        let size = 0.3 * exp;
        if (size < 1) {
            size = 1;
        }
        if (size > 15) {
            size = 15;
        }
        super(1, 1, 0, game, worldX, worldY,
            17, 17, "orb", 0,
            "./sprites/exp_orb.png",
            0, 0, 17, 17, 3, 0.2, size, exp);
        this.dist = this.game.player.pickupRange;
        this.removeFromWorld = false;
    }

    updateMoveSpeed() {

        const targetCenter = this.game.player.calculateCenter();
        const selfCenter = this.calculateCenter();

        // Calculate direction vector towards the target's center
        const dirX = targetCenter.x + 16 - selfCenter.x;
        const dirY = targetCenter.y - selfCenter.y;

        this.dist = Math.sqrt(dirX * dirX + dirY * dirY);
        let speed = 350 - this.dist;
        if (this.game.enemies.length === 0) {
            speed = 750;
        }

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

        if (this.dist <= 25) {
            this.removeFromWorld = true;
            this.game.player.gainExp(this.exp);
        }

    }
}