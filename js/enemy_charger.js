class Enemy_Charger extends Entity {

    // chargeTimer: the amount of seconds it takes while this enemy is stationary/running away before it enters charge mode
    constructor(name, maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed,
                spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale,
                chargeSpritePath, chargeAnimXStart, chargeAnimYStart, chargeAnimW, chargeAnimH, chargeAnimFCount, chargeAnimFDur, chargeScale,
                exp, fleeDist, approachDist) {
        super(maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, exp);

        this.name = name;
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves
        this.boundingBox.drawBoundingBox = false;

        // Properties to track cooldown of being able to damage the player
        this.lastAttackTime = 0;    // time since last attack

        this.pushbackVector = {x: 0, y: 0};
        this.pushbackDecay = 0.9; // Determines how quickly the pushback force decays

        // false: move like a ranged enemy
        // true: stay put until charge timer finishes, then lunge forward to player's coordinates (+ some more) at time of charge
        this.enterChargeMode = false; // enterChargeMode
        // this.maxChargeTimer = chargeTimer * 200;
        // this.chargeCooldown = chargeCooldown; // How long between charges
        this.chargeCooldown = 5; // How long between charges

        /** Target direction marker. Tracks where the entity should be pathing to next. */
        this.targetMarker = this.game.addEntity(new Entity(1, 1, 0, this.game,
            0, 0, 5, 5, "attackMarker",
            0,
            "./sprites/attack_targeting.png",
            0, 0, 92, 92, 4, 0.25, 2, 0));
        this.targetMarker.animator.pauseAtFrame(10); // Sets the tracker invisible

        /** The cooldown of how often this entity can damage the player with its bounding box collision attacks. */
        this.attackCooldown = 1;    // in seconds
        /** Controls whether this entity receives pushback force. */
        this.canBePushedBack = false;
        /** Last time we checked for an attack to possibly happen. */
        this.lastAttackCheckTime = 0;
        /** The time in seconds before the entity actually charges its target once entering charge mode. */
        this.chargeDelayTime = 1.75;
        /** Flag that tracks if we are ready to perform another attack (ex: charge, ground smash). */
        this.readyForNextAttack = true;

        this.tempTimer = -1;
        this.attackStatus = "none";
        this.chargeDamage = this.atkPow * 2;
        this.initialMovementSpeed = this.movementSpeed;

        this.fleeDist = fleeDist;
        this.approachDist = approachDist;

        this.spritePath = spritePath;
        this.animXStart = animXStart;
        this.animYStart = animYStart;
        this.animW = animW;
        this.animH = animH;
        this.animFCount = animFCount;
        this.animFDur = animFDur;
        this.scale = scale;

        this.chargeSpritePath = chargeSpritePath;
        this.chargeAnimXStart = chargeAnimXStart;
        this.chargeAnimYStart = chargeAnimYStart
        this.chargeAnimW = chargeAnimW;
        this.chargeAnimH = chargeAnimH;
        this.chargeAnimFCount = chargeAnimFCount;
        this.chargeAnimFDur = chargeAnimFDur;
        this.chargeScale = chargeScale;
    }

    /** This is the method called when an outside force (usually an attack) is trying to push this entity around. */
    applyPushback(forceX, forceY) {
        if (this.canBePushedBack && this.attackStatus !== "Charging" && this.attackStatus !== "Preparing to Charge") {
            this.pushbackVector.x += forceX * this.pushbackMultiplier;
            this.pushbackVector.y += forceY * this.pushbackMultiplier;
        }
    }

    // this is the movement pattern for enemies that just approach the player
    update() {
        super.update();

        // Early exit if the player does not exist for some reason at this point
        if (!this.game.player) {
            return;
        }

        // If health hits 0 or below, this entity is declared dead
        if (this.isDead) {
            // Be sure to send the target marker entity to the garbage collector
            this.targetMarker.removeFromWorld = true;
            this.removeFromWorld = true;
            return;
        }

        const currentTime = this.game.elapsedTime / 1000;

        // Apply pushback (if there is any)
        this.worldX += this.pushbackVector.x;
        this.worldY += this.pushbackVector.y;

        // Decay the pushback force
        this.pushbackVector.x *= this.pushbackDecay;
        this.pushbackVector.y *= this.pushbackDecay;

        // If pushback is very small, reset it to 0 to stop movement
        if (Math.abs(this.pushbackVector.x) < 0.1) this.pushbackVector.x = 0;
        if (Math.abs(this.pushbackVector.y) < 0.1) this.pushbackVector.y = 0;

        const player = this.game.player;

        // Determine the direction to face based on the player's position
        if (this.targetMarker.worldX < this.worldX + this.animator.width/2) {
            // Player is to the left, face left
            this.lastMove = "left";
        } else if (this.targetMarker.worldX > this.worldX + this.animator.width/2) {
            // Player is to the right, face right
            this.lastMove = "right";
        }

        const targetDirection = this.calcTargetAngle(this.targetMarker);

        // If we are in any of the attack modes, then we are not ready to start new attack
        if (this.attackStatus !== "none" || this.enterChargeMode) {
            this.readyForNextAttack = false;
        } else {
            this.readyForNextAttack = true;
        }

        // If entity is not ready to charge again, make sure we don't allow the timer to tick
        if (this.readyForNextAttack) {
            // We are ready for a new attack decision so enable the marker tracking again
            this.trackMode = true;
            this.relocateMode = true;
        } else {
            this.lastAttackCheckTime = currentTime;
            this.relocateMode = false;
        }

        // Track the marker an offset amount behind the player (this way the entity charges 'through' where the player was)
        if (this.trackMode && this.targetMarker) {
            const playerCenter = this.game.player.calculateCenter();
            const selfCenter = this.calculateCenter();

            // Calculate direction vector towards the player's center
            const dirX = playerCenter.x - selfCenter.x;
            const dirY = playerCenter.y - selfCenter.y;

            // Calculate distance to normalize the vector
            const dist = Math.sqrt(dirX * dirX + dirY * dirY);

            // Normalize direction vector
            const normX = dirX / dist;
            const normY = dirY / dist;

            // Determine the offset distance behind the player
            // This value can be adjusted to place the marker closer or further from the player
            const offsetDistance = -250; // Negative value to place marker behind the player

            // Calculate new position for the marker
            // Subtracting because we're moving in the opposite direction of the normalized vector
            this.targetMarker.worldX = playerCenter.x - (normX * offsetDistance) - 50;
            this.targetMarker.worldY = playerCenter.y - (normY * offsetDistance) - 50;
        }

        // START of Handle Charge Attack
        if (this.enterChargeMode) {
            if (this.attackStatus === "none") {
                this.attackStatus = "Preparing to Charge";
                this.movementSpeed = 0;
                // First, we need to enter the prepare to charge stance animation
                if (this.chargeSpritePath !== null) {
                    this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.chargeSpritePath), this.chargeAnimXStart,
                        this.chargeAnimYStart, this.chargeAnimW, this.chargeAnimH, this.chargeAnimFCount, this.chargeAnimFDur);
                    this.animator.pauseAtFrame(0);
                }
            }

            // After this.chargeDelayTime has passed we need to actually enter the charge sprite animation and give the entity its charge movement speed.
            // If the tempTimer is === -1 then we need to set it to current time to start the timer
            if (this.tempTimer === -1) {
                this.tempTimer = currentTime;
            }

            // If we are preparing to charge, and it's now time to charge
            if (this.attackStatus === "Preparing to Charge" && (currentTime - this.chargeDelayTime >= this.tempTimer)) {
                this.trackMode = false;
                if (this.chargeSpritePath !== null) {
                    this.animator.pauseAtFrame(1);
                }
                this.tempTimer = -1; // Reset the timer for later use
                this.attackStatus = "Charging";
                this.movementSpeed = this.initialMovementSpeed * 7.5;
            }

            // After we reach the target destination, turn off charge mode, return the entity back to normal
            if (this.attackStatus === "Charging") {
                const centerX = this.worldX + this.animator.width / 2;
                const centerY = this.worldY + this.animator.height / 2;

                const markerCenterX = this.targetMarker.worldX + this.targetMarker.animator.width / 2;
                const markerCenterY = this.targetMarker.worldY + this.targetMarker.animator.height / 2;

                const distanceX = Math.abs(Math.abs(centerX - markerCenterX) - 15);
                const distanceY = Math.abs(centerY - markerCenterY);
                const proximity = 20;

                // Check if in proximity of target yet, if so then stop the charge and return to normal stance
                if (distanceX < proximity && distanceY < proximity) {
                    if (this.chargeSpritePath !== null) {
                        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.spritePath), this.animXStart, this.animYStart, this.animW, this.animH, this.animFCount, this.chargeAnimFDur);
                        this.animator.pauseAtFrame(-1);
                    }
                    this.tempTimer = -1;
                    this.attackStatus = "none";
                    this.enterChargeMode = false;
                    this.movementSpeed = this.initialMovementSpeed;
                    //this.targetMarker.animator.pauseAtFrame(10);
                }
            }
        }
        // END of Handle Charge Attack

        // Apply movement based on the direction and this' speed
        this.worldX += targetDirection.x * (this.movementSpeed * this.calcSpacing()) * this.game.clockTick;
        this.worldY += targetDirection.y * (this.movementSpeed * this.calcSpacing()) * this.game.clockTick;

        this.checkCollisionAndDealDamage();
    }

    /*
    calculates whether movement speed should be:
    positive (approach because too far away/default)
    zero     (stay put because in sweet spot)
    negative (flee because too close to player)
    much more lenient than ranged enemies, so they can stay put for longer
    */
    calcSpacing() {
        let spacing = 1;
        // if not charging, take steps to get into charge position
        if (!this.enterChargeMode && !(this.attackStatus === "Charging")) {
            const bossCenterX = this.worldX + this.animator.width / 2;
            const bossCenterY = this.worldY + this.animator.height / 2;

            const markerCenterX = this.targetMarker.worldX + this.targetMarker.animator.width / 2;
            const markerCenterY = this.targetMarker.worldY + this.targetMarker.animator.height / 2;

            const distanceX = Math.abs(bossCenterX - markerCenterX);
            const distanceY = Math.abs(bossCenterY - markerCenterY);

            // const fleeProximity = 250; // Adjusted proximity threshold
            // const chargeProximity = 500

            if (distanceX > this.approachDist || distanceY > this.approachDisty) {
                spacing = 1;
            } else if (distanceX < this.fleeDist || distanceY < this.fleeDist) {
                spacing = -0.75;
            } else if (distanceX < this.approachDist || distanceY < this.approachDist) {
                const currentTime = this.game.elapsedTime / 1000;
                if (this.readyForNextAttack && currentTime - this.lastAttackCheckTime >= this.chargeCooldown) {
                    this.enterChargeMode = true;

                    // Regardless of the outcome, update lastCheckTime to schedule next check
                    this.lastAttackCheckTime = currentTime;
                }
            }
        }
        return spacing;
    }

    checkCollisionAndDealDamage() {
        const player = this.game.player;
        const currentTime = this.game.elapsedTime / 1000;

        // Check collision and cooldown
        if (this.boundingBox.isColliding(player.boundingBox) && (currentTime - this.lastAttackTime >= this.attackCooldown)) {
            if (this.attackStatus === "Charging") {
                player.takeDamage(this.chargeDamage);
            } else {
                player.takeDamage(this.atkPow);
            }

            this.lastAttackTime = currentTime; // Update last attack time
        }
    }

    draw(ctx, game) {
        if (this.attackStatus === "Charging" || this.attackStatus === "Preparing to Charge") {
            const targetCenter = {
                x: this.targetMarker.worldX + (this.targetMarker.animator.width / 2),
                y: this.targetMarker.worldY + (this.targetMarker.animator.height / 2),
            };

            const startPoint = {
                x: this.worldX + (this.animator.width / 2),
                y: this.worldY + (this.animator.height / 2),
            };

            const chargeDirection = {
                x: targetCenter.x - startPoint.x,
                y: targetCenter.y - startPoint.y,
            };

            const chargeMagnitude = Math.sqrt(chargeDirection.x ** 2 + chargeDirection.y ** 2);

            // Normalize the charge direction vector
            chargeDirection.x /= chargeMagnitude;
            chargeDirection.y /= chargeMagnitude;

            // Use the actual distance to the target marker center as the charge distance
            const actualChargeDistance = chargeMagnitude;

            // Calculate angle for rotation
            const angle = Math.atan2(chargeDirection.y, chargeDirection.x);

            // Draw rotated shaded area
            ctx.save(); // Save the current state of the canvas
            ctx.translate(startPoint.x - this.game.camera.x, startPoint.y - this.game.camera.y); // Move the origin to the starting point of the charge
            ctx.rotate(angle); // Rotate the canvas to align with the charge direction

            // If charging, use red fill
            if (this.attackStatus === "Charging") {
                // Draw the shaded area (now aligned with the charge direction)
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            }
            // Otherwise grey as we prepare to charge
            else {
                // Draw the shaded area (now aligned with the charge direction)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            }

            const shadedHeight = 100; // Height for the shaded area
            ctx.fillRect(0, -shadedHeight / 2, actualChargeDistance, shadedHeight); // Draw the rectangle

            ctx.restore(); // Restore the canvas to its original state
        }

        super.draw(ctx, game);
    }
}
