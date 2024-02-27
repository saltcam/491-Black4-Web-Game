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
     *             'enemyAttack': boxes labeled 'player' ttaake damage upon collision.
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
        this.debugName = "Entity("+boxType+")";
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
        this.outOfBoundsOffset = 250; // Buffer distance outside the camera view to consider for relocation
        this.lastMove = "right";

        // Follow entity stuff
        this.followedEntity = null;
        this.followXOffset = 0;
        this.followYOffset = 0;

        // Rotate to 'look at' entity stuff
        this.shouldLookAtEntity = false; // Flag to enable looking at the target entity
        this.rotationAngle = 0; // Rotation angle in radians
        this.rotationOffset = 0; // Offset for rotation angle adjustment

        this.lives = 0; // mostly for player, just works better with inheritance.
        this.reveal = false;

        this.hitSound = "./sounds/hit.mp3";
    }

    update() {
        if (this.followedEntity === null) {
            this.relocate();
        }

        if (this.followedEntity !== null) {
            // Follow the set entity
            this.worldX = this.followedEntity.worldX + this.followXOffset;
            this.worldY = this.followedEntity.worldY + this.followYOffset;

            // Very special occasion for boss #3
            if (this.reveal) {
                this.animator.pauseAtFrame(-1);
                this.reveal = false;
            }
        }

        // Calculate the scaled center of the sprite
        const scaledCenterX = this.worldX + (this.animator.width) / 2;
        const scaledCenterY = this.worldY + (this.animator.height) / 2;

        // Update the bounding box to be centered around the scaled sprite
        this.boundingBox.updateCentered(scaledCenterX, scaledCenterY, this.boundingBox.width, this.boundingBox.height);
    }

    // Call this to pass a separate entity for this entity to match the movement of. Good for god boss with the eyeball entity.
    followEntity(entity, xOffset, yOffset, reveal = false) {
        this.followedEntity = entity;
        this.followXOffset = xOffset;
        this.followYOffset = yOffset;

        this.reveal = reveal; // Very special occasion for boss #3
    }

    // // Call this to stop following an entity
    // unfollowEntity() {
    //     this.worldX = this.followedEntity.worldX + this.followXOffset;
    //     this.worldY = this.followedEntity.worldY + this.followYOffset;
    //     this.followedEntity = null;
    // }

    // Call this to have this entity 'try' to always rotate its sprite to look at the passed entity
    lookAtEntity(entity, rotationOffset = 0) {
        this.shouldLookAtEntity = true;
        this.rotationOffset = rotationOffset;

        // Calculate the angle towards the target entity
        const targetCenter = entity.calculateCenter();
        const selfCenter = this.calculateCenter();
        const dx = targetCenter.x - selfCenter.x;
        const dy = targetCenter.y - selfCenter.y;
        this.rotationAngle = Math.atan2(dy, dx) + this.rotationOffset;
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
            this.game.addEntity(new Floating_text(this.game, healHp, this.calculateCenter().x, this.calculateCenter().y, true, this instanceof Player || this.boundingBox.type.includes("ally")));
        }
        // If over-heal then just restore to max hp
        else {
            this.currHP = this.maxHP;
            this.game.addEntity(new Floating_text(this.game, healHp, this.calculateCenter().x, this.calculateCenter().y, true, this instanceof Player || this.boundingBox.type.includes("ally")));
        }
    }

    takeDamage(amount, attackType = "") {
        // Check if the entity taking damage is an enemy and if a critical hit happens
        let isCrit = false;
        let isBleed = false;

        if (!(this instanceof Player)) {
            const critRoll = Math.random();
            if (critRoll < this.game.player.critChance) {
                amount *= this.game.player.critDamage;
                isCrit = true;
            }
        } else {
            //console.log("lose score!");
            this.game.player.updateScore(-1 * amount);
        }

        // If bleed upgrade active, and the enemy is hit by a scythe attack
        this.game.player.weapons[0].upgrades.forEach(upgrade => {
            if (upgrade.name === "Bleeding Edge" && upgrade.active && !(this instanceof Player) && !this.boundingBox.type.includes("ally") && attackType === "playerAttack_ScytheAttack"
                && this.game.player.currentWeapon === 0) {
                isBleed = true;
                let bleed = (amount * 1.5) / 6;

                for (let i = 0; i < 6; i++) {
                    this.game.setManagedTimeout(() => {
                        if (!this.isDead) {
                            ASSET_MANAGER.playAsset(this.hitSound, isCrit ? 0.1/2 : 0.075/2);
                            this.currHP -= bleed;
                            this.game.player.updateScore(bleed);
                            this.game.addEntity(new Floating_text(this.game, bleed, this.calculateCenter().x, this.calculateCenter().y, false,
                                this instanceof Player || this.boundingBox.type.includes("ally"), isCrit));
                            this.animator.damageSprite(100);
                            if (!(this instanceof Player)) {
                                this.game.player.updateScore(bleed);
                            }
                            //this.game.addEntity(new Floating_text(this.game, bleed, this.worldX, this.worldY, false,


                            this.attemptDie();

                            this.recentDamage += bleed;
                            this.lastDamageTime = this.game.elapsedTime / 1000;
                        }
                    }, 500 * i);
                }
            }
        });

        if (!isBleed) {
            ASSET_MANAGER.playAsset(this.hitSound, isCrit ? 0.1 : 0.075);

            this.currHP -= amount;
            if (!(this instanceof Player)) {
                this.game.player.updateScore(amount);
            }
            // Spawn floating damage number
            this.game.addEntity(new Floating_text(this.game, amount, this.calculateCenter().x, this.calculateCenter().y,
                false, this instanceof Player || this.boundingBox.type.includes("ally"), isCrit));

            // Apply the damage sprite to this entity
            this.animator.damageSprite(250);

            this.recentDamage += amount;
            this.lastDamageTime = this.game.elapsedTime / 1000;
        }

        this.attemptDie(); // cool name
        // If crippling chill upgrade is active, slow this it is an enemy
        this.applySlow(attackType);
    }

    attemptDie() {
        if (this.currHP <= 0) {
            this.currHP = 0;
            // if there are any remaining lives, resurrect with half score (if player), max health, and a huge explosion
            if (this.lives > 0) {
                this.heal(this.maxHP);
                this.lives--;
                ASSET_MANAGER.playAsset("./sounds/SE_staff_secondary.mp3");
                if (this instanceof Player) {
                    this.game.player.updateScore(-1 * this.game.player.score / 2);
                }
            } else {
                this.isDead = true;
                // if this is an ally and we have "Explosive Finish" active, cause a small explosion on death
                if (this.boundingBox.type.includes("ally") && this.game.player.weapons[2].upgrades[7].active) {
                    let newProjectile = this.game.addEntity(new Projectile(this.game, this.atkPow,
                        this.worldX, this.worldY, 10, 10, "playerAttack_ExplosionAttack", 0,
                        "./sprites/transparent.png",
                        0, 0, 17, 17, 3, 0.2, 0.01, 0, 0,
                        this.game.player.weapons[2].secondaryAttackDuration, 2, 5, 0, 1));
                    newProjectile.attackCirc.drawCircle = true;
                    ASSET_MANAGER.playAsset("./sounds/SE_staff_primary.mp3");
                }
            }
        }
    }

    // Method to calculate and apply any cripple effects to the target from the crippling chill upgrade from scythe
    applySlow(attackType = "") {
        if (this.game.player.weapons[0].upgrades[7].active && !(this instanceof Player) && attackType === "playerAttack_ScytheAttack"
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

        if (this.shouldLookAtEntity) {
            // Save the current context state
            ctx.save();

            // Translate context to entity's position for rotation
            ctx.translate(screenX + this.animator.width / 2, screenY + this.animator.height / 2);

            // Rotate the context
            ctx.rotate(this.rotationAngle);

            // Draw the frame with adjusted coordinates
            this.animator.drawFrame(this.game.clockTick, ctx, -this.animator.width / 2, -this.animator.height / 2, this.lastMove);

            // Restore the context to its original state
            ctx.restore();
        } else {
            // Draw normally if not rotating
            this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);
        }

        // Draw bounding box if needed
        this.boundingBox.draw(ctx, game);
    }
}