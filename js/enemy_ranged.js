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
     * @param animXStart
     * @param animYStart
     * @param animW
     * @param animH
     * @param animFCount
     * @param animFDur
     * @param scale
     * @param exp
     * @param projectileFreq how often the entity fires its attack pattern
     * @param projectileSpeed speed of the projectile
     * @param projectileSize how big each bullet is
     * @param projectilePulse if the projectile should be pulsating
     * @param projectileCount number of projectiles fired in an attack cycle
     * @param projectileSpread complete range for projectiles to be fired. the projectiles will be shot evenly within this range (0 means no difference and they fire in a straight line)
     */
    constructor(name, maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, exp,
                projectileFreq, projectileSpeed, projectileSize, projectilePulse, projectileCount, projectileSpread) {
        super(maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, exp);

        this.name = name;
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves
        this.boundingBox.drawBoundingBox = false;

        // Properties to track cooldown of being able to damage the player
        this.attackCooldown = projectileFreq;    // in seconds
        this.lastAttackTime = 0;    // time since last attack

        this.pushbackVector = { x: 0, y: 0 };
        this.pushbackDecay = 0.9; // Determines how quickly the pushback force decays

        this.projectileSpeed = projectileSpeed;

        this.projectileSize = projectileSize;
        this.pulse = projectilePulse;
        this.projectileCount = projectileCount;
        this.projectileSpread = projectileSpread;
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
        if (player.worldX < this.worldX) {
            // Player is to the left, face left
            this.lastMove = "left";
        } else if (player.worldX > this.worldX) {
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
        this.castProjectile();

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

        if (dist > 400) {
            // console.log("approach");
            spacing = 1;
        } else if (dist < 300) {
            // console.log("flee");
            spacing = -2;
        } else if (dist > 300 && dist < 400) {
            // console.log("stay put");
            spacing = 0;
        }
        // console.log(spacing);
        return spacing;
    }

    checkCollisionAndDealDamage() {
        const player = this.game.player;
        const currentTime = this.game.timer.gameTime;

        // Check collision and cooldown
        if (this.boundingBox.isColliding(player.boundingBox) && currentTime - this.lastAttackTime >= this.attackCooldown) {
            player.takeDamage(1);
            this.lastAttackTime = currentTime; // Update last attack time
        }
    }

    castProjectile(){
        // if it has been enough time since last attack, shoot an orb
        let currentTime = this.game.timer.gameTime;
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
            const playerCenter = this.game.player.calculateCenter();
            const thisCenter = this.calculateCenter();
            // Calculate the angle towards the mouse position
            let dx = playerCenter.x - thisCenter.x;
            let dy = playerCenter.y - thisCenter.y;
            let attackAngle = Math.atan2(dy, dx);

            const offsetDistance = (20) * 0.6;

            for (let i = 0; i < this.projectileCount; i++) {
                // trying to convert this to an angle
                // odd -> i - 1     (mod 2 = 1)
                // even -> i - 0.5 (mod 2 = 0)
                let adjust = this.projectileCount % 2;
                if (adjust !== 1) {
                    adjust += 0.5;
                }

                let angle = (attackAngle + Math.PI/(180/360) * (((i-adjust) * (this.projectileSpread/this.projectileCount))/360));
                dx = Math.cos(angle) * offsetDistance;
                dy = Math.sin(angle) * offsetDistance;

                let newProjectile = this.game.addEntity(new Projectile(this.game, this.atkPow,
                    this.worldX, this.worldY, 10, 10, "enemyAttack", this.projectileSpeed,
                    "./sprites/MagicBall.png",
                    0, 0, 30, 30, 2, 0.2, 2, dx, dy,
                    3, this.projectileSize, 1, 0, 0.3));
                newProjectile.pulsatingDamage = this.pulse;
            }
            this.lastAttackTime = currentTime; // Update last attack time
        }
    }
}