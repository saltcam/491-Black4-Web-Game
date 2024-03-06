class Enemy_Ranged extends Entity {
    /**
     *
     * @param name
     * @param maxHP
     * @param currHP
     * @param atkPow
     * @param game
     * @param worldX
     * @param worldY
     * @param boxWidth
     * @param boxHeight
     * @param boxType
     * @param speed
     * @param spritePath
     * @param shootSpritePath
     * @param animXStart
     * @param animYStart
     * @param animW
     * @param animH
     * @param animFCount
     * @param animFDur
     * @param scale
     * @param shootAnimXStart
     * @param shootAnimYStart
     * @param shootAnimW
     * @param shootAnimH
     * @param shootAnimFCount
     * @param shootAnimFDur
     * @param shootScale
     * @param exp
     * @param projectileFreq how often the entity fires its attack pattern
     * @param projectileSpeed speed of the projectile
     * @param projectileSize how big each bullet is
     * @param projectilePulse if the projectile should be pulsating
     * @param projectileCount number of projectiles fired in an attack cycle
     * @param projectileSpread complete range for projectiles to be fired. the projectiles will be shot evenly within this range (0 means no difference and they fire in a straight line)
     * @param shootRange
     */
    constructor(name, maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath,
                shootSpritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale,
                shootAnimXStart, shootAnimYStart, shootAnimW,
                shootAnimH, shootAnimFCount, shootAnimFDur,
                shootScale, exp, projectileFreq, projectileSpeed, projectileSize, projectilePulse,
                projectileCount, projectileSpread, fleeDist, approachDist, projectileSprite,
                projectileAnimX, projectileAnimY, projectileAnimW, projectileAnimH,
                projectileAnimCount, projectileAnimDur, projectileAnimScale,
                shootRange = 375) {
        super(maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, exp);

        this.name = name;
        this.shootRange = shootRange;
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves
        this.boundingBox.drawBoundingBox = false;

        // Properties to track cooldown of being able to damage the player
        this.projectileAttackCooldown = projectileFreq;    // in seconds
        this.attackCooldown = 1;
        this.lastAttackTime = 0;    // time since last attack

        this.pushbackVector = { x: 0, y: 0 };
        this.pushbackDecay = 0.9; // Determines how quickly the pushback force decays

        this.projectileSpeed = projectileSpeed;

        this.projectileSize = projectileSize;
        this.pulse = projectilePulse;
        // how many projectiles are shot in a single attack. odds directly target at player, evens target around player.
        this.projectileCount = projectileCount;
        // how wide the angle the shots are distributed.
        // if 1 projectile, aims like normal.
        // Any more shoots one shot at the edges of the range and everything else is distributed evenly in between.
        this.projectileSpread = projectileSpread;

        // For shooting sprite change
        this.spritePath = spritePath;
        this.animXStart = animXStart;
        this.animYStart = animYStart;
        this.animW = animW;
        this.animH = animH;
        this.animFCount = animFCount;
        this.animFDur = animFDur;
        this.shootingSpritePath = shootSpritePath;
        this.shootingAnimXStart = shootAnimXStart;
        this.shootingAnimYStart = shootAnimYStart;
        this.shootingAnimW = shootAnimW;
        this.shootingAnimH = shootAnimH;
        this.shootingAnimFCount = shootAnimFCount;
        this.shootingAnimFDur = shootAnimFDur;
        this.isShooting = false; // Flag to indicate if shooting animation is active

        this.fleeDist = fleeDist;
        this.approachDist = approachDist;
        this.projectileSprite = projectileSprite;

        this.projectileAnimX = projectileAnimX;
        this.projectileAnimY = projectileAnimY;
        this.projectileAnimW = projectileAnimW;
        this.projectileAnimH = projectileAnimH;
        this.projectileAnimCount = projectileAnimCount;
        this.projectileAnimDur = projectileAnimDur;
        this.projectileAnimScale = projectileAnimScale;

        this.mode = "idle"; // idle = moving normally; attacking = shooting projectile
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

        // Apply movement based on the direction and this' speed
        this.worldX += targetDirection.x * (this.movementSpeed * this.calcSpacing()) * this.game.clockTick;
        this.worldY += targetDirection.y * (this.movementSpeed * this.calcSpacing()) * this.game.clockTick;

        // Calculate the scaled center of the sprite
        const scaledCenterX = this.worldX + (this.animator.width) / 2;
        const scaledCenterY = this.worldY + (this.animator.height) / 2;

        // Update the bounding box to be centered around the scaled sprite
        const boxWidth = this.boundingBox.width;
        const boxHeight = this.boundingBox.height;
        this.boundingBox.updateCentered(scaledCenterX, scaledCenterY, boxWidth, boxHeight);

        this.checkCollisionAndDealDamage();

        // Check if the player is within shooting range
        const playerCenter = this.game.player.calculateCenter();
        const selfCenter = this.calculateCenter();
        const distanceToPlayer = Math.hypot(playerCenter.x - selfCenter.x, playerCenter.y - selfCenter.y);

        if (distanceToPlayer <= this.shootRange) {
            // this.changeMode("attacking");
            this.castProjectile();
        } else {
            this.changeMode("idle");
        }

        // if (distanceToPlayer <= this.shootRange){
        //     this.changeMode("attacking");
        //     this.castProjectile();
        // } else {
        //     this.changeMode("idle");
        // }
    }

    /*
    calculates whether movement speed should be:
    positive (approach because too far away/default)
    zero     (stay put because in sweet spot)
    negative (flee because too close to player)
    */
    calcSpacing(){
        let spacing = 1;

        const targetCenter = this.game.player.calculateCenter();
        const selfCenter = this.calculateCenter();

        // Calculate direction vector towards the target's center
        const dirX = targetCenter.x + 16 - selfCenter.x;
        const dirY = targetCenter.y - selfCenter.y;

        let dist = Math.sqrt(dirX * dirX + dirY * dirY);
        // console.log("dist: " + dist);

        if (dist > this.approachDist) {
            // console.log("approach");
            spacing = 1;
        } else if (dist < this.fleeDist) {
            // console.log("flee");
            spacing = -2;
        } else if (dist > this.fleeDist && dist < this.approachDist) {
            // console.log("stay put");
            spacing = 0;
        }
        // console.log(spacing);
        return spacing;
    }

    checkCollisionAndDealDamage() {
        const player = this.game.player;
        const currentTime = this.game.elapsedTime / 1000;

        // Check collision and cooldown
        if (this.boundingBox.isColliding(player.boundingBox) && currentTime - this.lastAttackTime >= this.attackCooldown) {
            //console.log("Collision!");
            player.takeDamage(this.atkPow / 3);
            this.lastAttackTime = currentTime; // Update last attack time
        }
    }
    castProjectile() {
        let currentTime = this.game.elapsedTime / 1000;
        if (currentTime - this.lastAttackTime >= this.projectileAttackCooldown) {
            this.changeMode("attacking");
            // console.log("SHOOTING");
            // Switch to shooting animation
            // this.isShooting = true;

            // Switch to shoot animation sprite if this enemy has one, otherwise ignore and shoot the projectile
            // if (this.shootingSpritePath !== null && this.animator.spritesheet !== ASSET_MANAGER.getAsset(this.shootingSpritePath)) {
            //     console.log("Attempting change!");
            //
            // }

            const centerOfEntity = this.calculateCenter();

            // Define the frame at which the projectile should be spawned
            const shootingFrame = 3; // for example, spawn projectile on the 4th frame of the animation

            // let currentTime = this.game.elapsedTime / 1000;
            // Check if the current frame is the shooting frame and if enough time has passed since the last attack
            // if ((this.animator.currentFrame() >= shootingFrame || !this.shootingSpritePath)) {
            //     console.log ("Did this work?");
            // }

            if (this.animator.currentFrame() >= shootingFrame) {
                const playerCenter = this.game.player.calculateCenter();
                const thisCenter = this.calculateCenter();
                // Calculate the angle towards the mouse position
                let dx = playerCenter.x - thisCenter.x;
                let dy = playerCenter.y - thisCenter.y;
                let attackAngle = Math.atan2(dy, dx);
                let angle = Math.atan2(dy, dx);

                const offsetDistance = (20) * 0.6;
                if (this.projectileCount > 1) {
                    // if we have to distribute projectiles, aim at half of range from player
                    attackAngle += Math.PI/(1/2) * (this.projectileSpread/2/360)
                }

                for (let i = 0; i < this.projectileCount; i++) {

                    if (this.projectileCount > 1) {
                        angle = (attackAngle -
                            0.01745329 * (((this.projectileSpread/(this.projectileCount-1))* i))
                        );
                    }

                    //let angle = (attackAngle + Math.PI/(180/360) * (((i-adjust) * (this.projectileSpread/this.projectileCount))/360));
                    dx = Math.cos(angle) * offsetDistance;
                    dy = Math.sin(angle) * offsetDistance;

                    // Adjust the projectile's starting position to be the center of the entity
                    let projectileX = centerOfEntity.x - this.projectileSize / 2; // Center the projectile on the X axis
                    let projectileY = centerOfEntity.y - this.projectileSize / 2; // Center the projectile on the Y axis



                    let newProjectile = this.game.addEntity(new Projectile(this.game, this.atkPow,
                        projectileX, projectileY, 10, 10, "enemyAttack_Projectile", this.projectileSpeed,
                        this.projectileSprite,
                        this.projectileAnimX, this.projectileAnimY, this.projectileAnimW, this.projectileAnimH,
                        this.projectileAnimCount, this.projectileAnimDur, this.projectileAnimScale, dx, dy,
                        3, this.projectileSize, 1, 0, 0.3));
                    newProjectile.attackCirc.pulsatingDamage = this.pulse;
                }
                this.lastAttackTime = currentTime; // Update last attack time

                // Set a timeout to revert to original animation after shooting ends
                this.game.setManagedTimeout(() => {
                    this.movementSpeed = this.initialMovementSpeed;
                    this.changeMode("idle");
                }, this.shootingAnimFCount * this.shootingAnimFDur * 1000); // Duration of the entire shooting animation
                // this.changeMode("idle");
            }
        }
    }

    // revertToOriginalSprite() {
    //     this.isShooting = false; // Reset shooting flag
    //
    //     //console.log("Reverting...");
    //
    //     //this.animator = new Animator(this.game, this.spritePath, this.animXStart)
    //     // Switch back to original animation
    //     this.animator.changeSpritesheet(
    //         ASSET_MANAGER.getAsset(this.spritePath),
    //         this.animXStart,
    //         this.animYStart,
    //         this.animW,
    //         this.animH,
    //         this.animFCount,
    //         this.animFDur
    //     );
    // }

    changeMode(mode) {
        if (this.mode !== mode) {
            // console.log("changing from " + this.mode + " to: " + mode);
            switch (mode) {
                case "attacking":
                    if (this.shootingSpritePath) {

                        this.animator.changeSpritesheet(
                            ASSET_MANAGER.getAsset(this.shootingSpritePath),
                            this.shootingAnimXStart,
                            this.shootingAnimYStart,
                            this.shootingAnimW,
                            this.shootingAnimH,
                            this.shootingAnimFCount,
                            this.shootingAnimFDur
                        );
                    }
                    this.movementSpeed = 0;
                    this.mode = mode;
                    break;
                case "idle":
                        this.animator.changeSpritesheet(
                            ASSET_MANAGER.getAsset(this.spritePath),
                            this.animXStart,
                            this.animYStart,
                            this.animW,
                            this.animH,
                            this.animFCount,
                            this.animFDur
                        );
                    this.movementSpeed = this.initialMovementSpeed;
                    this.mode = mode;
                    break;
            }
        }
    }
}