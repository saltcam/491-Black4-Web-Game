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
    constructor(maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, exp) {
        this.maxHP = maxHP;
        this.currHP = currHP;
        this.atkPow = atkPow;
        this.game = game;
        this.exp = exp;
        this.boundingBox = new BoundingBox(worldX, worldY, boxWidth * scale, boxHeight * scale, boxType);
        this.animator = new Animator(game, ASSET_MANAGER.getAsset(spritePath), animXStart, animYStart, animW, animH, animFCount, animFDur, scale);
        this.movementSpeed = speed;
        this.initialMovementSpeed = speed;
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
        this.outOfBoundsOffset = 150; // Buffer distance outside the camera view to consider for relocation
    }

    update() {
        this.relocate();

        // Calculate the scaled center of the sprite
        const scaledCenterX = this.worldX + (this.animator.width) / 2;
        const scaledCenterY = this.worldY + (this.animator.height) / 2;

        // Update the bounding box to be centered around the scaled sprite
        this.boundingBox.updateCentered(scaledCenterX, scaledCenterY, this.boundingBox.width, this.boundingBox.height);
    }

    // Call this on update to re-locate this entity to the opposite side of the screen of the player if the player moves too far from this enemy
    // This should only be used for enemy entities, not the player, and not attacks
    relocate() {
        // Exit if this is a player, or if this has relocation turned off.
        if (!this.relocateMode || this.boundingBox.type.includes("player")) return;

        // Only proceed for entities marked as "enemy"
        if (this.boundingBox.type.includes("enemy") || this.boundingBox.type.includes("ally")) {
            const camera = this.game.camera;

            // Calculate entity's position relative to the camera
            const relativeX = this.worldX - camera.x;
            const relativeY = this.worldY - camera.y;

            let outsideHorizontalBounds = relativeX < -this.outOfBoundsOffset || relativeX > camera.width + this.outOfBoundsOffset;
            let outsideVerticalBounds = relativeY < -this.outOfBoundsOffset || relativeY > camera.height + this.outOfBoundsOffset;

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
        // If this is a non-health entity, we can ignore drawing the healthbar.
        if (this.maxHP <= 0) {
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
            this.game.addEntity(new Floating_text(this.game, healHp, this.worldX, this.worldY, true, this instanceof Player || this.boundingBox.type.includes("ally")));
        }
        // If over-heal then just restore to max hp
        else {
            this.currHP = this.maxHP;
            this.game.addEntity(new Floating_text(this.game, healHp, this.worldX, this.worldY, true, this instanceof Player || this.boundingBox.type.includes("ally")));
        }
    }

    takeDamage(amount) {
        // Check if the entity taking damage is an enemy and if a critical hit happens
        let isCrit = false;
        let isBleed = false;

        if (!(this instanceof Player)) {
            const critRoll = Math.random();
            if (critRoll < this.game.player.critChance) {
                amount *= this.game.player.critDamage;
                isCrit = true;
            }
        }

        this.game.player.weapons[0].upgrades.forEach(upgrade => {
            if (upgrade.name === "Bleeding Edge" && upgrade.active && !(this instanceof Player) && !this.boundingBox.type.includes("ally")
                && this.game.player.currentWeapon === 0) {
                isBleed = true;
                let bleed = (amount * 1.5) / 6;

                for (let i = 0; i < 6; i++) {
                    this.game.setManagedTimeout(() => {
                        if (!this.isDead) {
                            this.currHP -= bleed;
                            this.game.addEntity(new Floating_text(this.game, bleed, this.worldX, this.worldY, false,
                                this instanceof Player || this.boundingBox.type.includes("ally"), isCrit));
                            this.animator.damageSprite(100);

                            if (this.currHP <= 0) {
                                this.currHP = 0;
                                this.isDead = true;
                            }

                            this.recentDamage += bleed;
                            this.lastDamageTime = this.game.timer.gameTime;
                        }
                    }, 500 * i);
                }
            }
        });

        if(!isBleed) {
            this.currHP -= amount;
            // Spawn floating damage number
            this.game.addEntity(new Floating_text(this.game, amount, this.worldX, this.worldY,
                false, this instanceof Player || this.boundingBox.type.includes("ally"), isCrit));

            // Apply the damage sprite to this entity
            this.animator.damageSprite(250);

            this.recentDamage += amount;
            this.lastDamageTime = this.game.timer.gameTime;
        }

        if (this.currHP <= 0) {
            this.currHP = 0;
            this.isDead = true;
        }

        this.game.player.weapons[0].upgrades.forEach(upgrade => {
            if (upgrade.name === "Crippling Chill" && upgrade.active && !(this instanceof Player)
                && !this.boundingBox.type.includes("ally")
                && !this.boundingBox.type.includes("boss") && this.game.player.currentWeapon === 0) {
                // Only apply the actual slow if their faster than what we are slowing them to.
                if (this.movementSpeed > 30) {
                    this.movementSpeed = 30;

                    // Apply the visual chill effect outline
                    this.animator.outlineMode = true;
                    this.animator.outlineColor = 'lightblue';

                    this.game.setManagedTimeout(() => {
                        this.animator.outlineColor = 'yellow';  // Back to default
                        if (!this.isElite) {
                            this.animator.outlineMode = false;
                        }
                        this.movementSpeed = this.initialMovementSpeed
                    }, 1000);
                }
                // If was slower or already had 30 speed, then just apply the visual chill outline.
                else if (this.movementSpeed <= 30) {
                    // Apply the visual chill effect outline
                    this.animator.outlineMode = true;
                    this.animator.outlineColor = 'lightblue';

                    this.game.setManagedTimeout(() => {
                        this.animator.outlineColor = 'yellow';  // Back to default
                        if (!this.isElite) {
                            this.animator.outlineMode = false;
                        }
                    }, 1000);
                }
            }
        });
    }

    // Method to calculate the angle between the entity and a target
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