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
        this.animator = new Animator(game, ASSET_MANAGER.getAsset(spritePath), animXStart, animYStart, animW, animH, animFCount, animFDur, scale);
        this.movementSpeed = speed;
        this.worldX = worldX;
        this.worldY = worldY;
        this.isDead = false;

        // This stuff is really just for boss health bar calculations
        this.recentDamage = 0;
        this.lastDamageTime = 0;
        this.isElite = false;

        // If -1 exp was given, that means we calculate the exp automatically based off entity's supposed difficulty
        if (this.exp === -1) {
            this.exp = (this.maxHP/20) + (this.atkPow/6);
        }

        this.relocateMode = true; // Does this entity 'relocate' to opposite parts of screen when player gets too far.
        this.buffer = 100; // Buffer distance outside the camera view to consider for relocation
    }

    update() {
        this.relocate();

        // Calculate the scaled center of the sprite
        const scaledCenterX = this.worldX + (this.animator.width) / 2;
        const scaledCenterY = this.worldY + (this.animator.height) / 2;

        // Update the bounding box to be centered around the scaled sprite
        this.boundingBox.updateCentered(scaledCenterX, scaledCenterY, this.boundingBox.width, this.boundingBox.height);
    }

    // Call this on update to re-locate this entity to the opposite side of the screen of the player if the player moves too far from this enemy)
    // This should only be used for enemy entities, not the player, and not attacks
    relocate() {
        // Exit if this is a player, or if this has relocation turned off.
        if (!this.relocateMode || this.boundingBox.type.includes("player")) return;

        // Only proceed for entities marked as "enemy"
        if (this.boundingBox.type.includes("enemy")) {
            const camera = this.game.camera;

            // Calculate entity's position relative to the camera
            const relativeX = this.worldX - camera.x;
            const relativeY = this.worldY - camera.y;

            let outsideHorizontalBounds = relativeX < -this.buffer || relativeX > camera.width + this.buffer;
            let outsideVerticalBounds = relativeY < -this.buffer || relativeY > camera.height + this.buffer;

            // Check if the entity is outside the bounds of the camera, plus a buffer
            if (outsideHorizontalBounds || outsideVerticalBounds) {
                // Generate new coordinates for relocation
                let newCoords = this.game.randomOffscreenCoords();

                // Update entity's position
                this.worldX = newCoords.x;
                this.worldY = newCoords.y;

                // Immediately update the entity's bounding box with the new position
                this.updateBoundingBox();
            }
        }
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

    // Call this to heal entities/give them more currHP (without over-healing)
    heal(healHp) {
        if (this.currHP + healHp <= this.maxHP) {
            this.currHP += healHp;
            // Spawn floating healing number
            this.game.addEntity(new Floating_text(this.game, healHp, this.worldX, this.worldY, true, this instanceof Player));
        }
    }

    takeDamage(amount) {
        // Check if the entity taking damage is an enemy and if a critical hit happens
        let isCrit = false;
        if (!(this instanceof Player)) {
            console.log("it got here");
            const critRoll = Math.random();
            if (critRoll < this.game.player.critChance) {
                amount *= this.game.player.critDamage;
                isCrit = true;
            }
        }

        this.currHP -= amount;
        if (this.currHP <= 0) {
            this.currHP = 0;
            this.isDead = true;
        }
        // Apply the damage sprite to this entity
        this.animator.damageSprite(250);

        // Spawn floating damage number
        this.game.addEntity(new Floating_text(this.game, amount, this.worldX, this.worldY, false, this instanceof Player, isCrit));

        this.recentDamage += amount;
        this.lastDamageTime = this.game.timer.gameTime;
    }

    // Method to calculate the angle between the entity and a target (The player usually)
    calcTargetAngle(target) {
        if (target) {
            const targetCenter = target.calculateCenter();
            const selfCenter = this.calculateCenter();

            // Calculate direction vector towards the target's center
            const dirX = targetCenter.x - selfCenter.x;
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

    draw(ctx, game) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);

        this.boundingBox.draw(ctx, game);
    }
}