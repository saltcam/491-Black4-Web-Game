class Entity {
    /**
     *
     * @param maxHP
     * @param currHP
     * @param atkPow
     * @param game game engine
     * @param worldX where the entity is on the map horizontally
     * @param worldY where the entity is on the map vertically
     * @param boxWidth width of the entity
     * @param boxHeight
     * @param speed
     * @param boxType 'player': take damage when colliding with 'enemy' or 'enemyAttack'.
     *             'enemy': take damage when colliding with 'playerAttack'.
     *             'enemyAttack': boxes labeled 'player' take damage upon collision.
     *             'playerAttack': boxes labeled 'enemy' take damage upon collision.
     * @param spritePath
     * @param animXStart
     * @param animYStart
     * @param animW
     * @param animH
     * @param animFCount
     * @param animFDur
     * @param scale The scale of the entity's sprite. 1.0 is normal size.
     * @param exp   the amount of exp the entity gives when killed
     */
    constructor(maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, exp){
        this.maxHP = maxHP;
        this.currHP = currHP;
        this.atkPow = atkPow;
        this.game = game;
        this.exp = exp;
        this.boundingBox = new BoundingBox(worldX, worldY, boxWidth * scale, boxHeight * scale, boxType);
        this.animator = new Animator(ASSET_MANAGER.getAsset(spritePath), animXStart, animYStart, animW, animH, animFCount, animFDur, scale);
        this.movementSpeed = speed;
        this.worldX = worldX;
        this.worldY = worldY;
        this.isDead = false;
    }

    update() {
        // Calculate the scaled center of the sprite
        const scaledCenterX = this.worldX + (this.animator.width) / 2;
        const scaledCenterY = this.worldY + (this.animator.height) / 2;

        // Update the bounding box to be centered around the scaled sprite
        this.boundingBox.updateCentered(scaledCenterX, scaledCenterY, this.boundingBox.width, this.boundingBox.height);
    }

    // Method to find the center of the entity
    calculateCenter() {
        return {
            x: this.worldX + this.animator.width / 2,
            y: this.worldY + this.animator.height / 2
        };
    }

    drawHealth(ctx) {
        // If this is a 0 health entity, we can ignore drawing the healthbar.
        if (this.maxHP === 0) {
            return;
        }
        //draw the max healthbar
        ctx.beginPath();
        ctx.fillStyle = "Black";
        ctx.fillRect(this.boundingBox.left - this.game.camera.x,
            this.boundingBox.top + this.boundingBox.height - this.game.camera.y,
            this.boundingBox.width, 10);
        ctx.closePath();

        //draw the current healthbar
        ctx.beginPath();
        ctx.fillStyle = "Red";
        ctx.fillRect(this.boundingBox.left - this.game.camera.x,
            this.boundingBox.top + this.boundingBox.height - this.game.camera.y,
            this.boundingBox.width * (this.currHP / this.maxHP), 10);
        ctx.closePath();
    }

    // Method to calculate the angle between the entity and a target (The player usually)
    calcTargetAngle(target) {
        if (target) {
            const targetCenter = target.calculateCenter();
            const selfCenter = this.calculateCenter();

            // Calculate direction vector towards the target's center
            const dirX = targetCenter.x + 16 - selfCenter.x;
            const dirY = targetCenter.y - selfCenter.y;

            // Normalize the direction
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            return {
                x: length > 0 ? dirX / length : 0,
                y: length > 0 ? dirY / length : 0
            };
        }
    }

    // This is used for collision made position changes
    updateBoundingBox() {
        const scaledCenterX = this.worldX + (this.animator.width) / 2;
        const scaledCenterY = this.worldY + (this.animator.height) / 2;
        this.boundingBox.updateCentered(scaledCenterX, scaledCenterY, this.boundingBox.width, this.boundingBox.height);
    }

    makeElite() {
        this.maxHP *= 2;
        this.currHP = this.maxHP;
        this.atkPow *= 2;
        this.scale *= 2;
        console.log(this.name + " has become an elite!");
    }

    takeDamage(amount) {
        this.currHP -= amount;
        if (this.currHP <= 0) {
            this.currHP = 0;
        }
    }
}