class Ally_Contact extends Entity {
    constructor(name, maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, exp) {
        super(maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, exp);

        this.name = name;
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves
        this.boundingBox.drawBoundingBox = false;

        // Properties to track cooldown of being able to damage the player
        this.attackCooldown = 1;    // in seconds
        this.lastAttackTime = 0;    // time since last attack

        this.pushbackVector = { x: 0, y: 0 };
        this.pushbackDecay = 0.9; // Determines how quickly the pushback force decays
        this.empower = 1;
        this.lastEmpowerTick = 0;
    }

    // changes the empower multiplier to 2, resets buff timer
    powerUp() {
        this.empower = 2;
        this.lastEmpowerTick = this.game.elapsedTime / 1000;
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
        // change target to nearest enemy on the field
        const target = this.closestTarget();

        // Determine the direction to face based on the player's position
        if (target.worldX < this.worldX) {
            // Player is to the left, face left
            this.lastMove = "left";
        } else if (target.worldX > this.worldX) {
            // Player is to the right, face right
            this.lastMove = "right";
        }

        const targetDirection = this.calcTargetAngle(target);

        let magnitude = (this.movementSpeed + (this.movementSpeed * (1.33*(this.empower-1)))) * this.game.clockTick;

        // Apply movement based on the direction and the zombie's speed
        this.worldX += targetDirection.x * magnitude;
        this.worldY += targetDirection.y * magnitude;

        // Calculate the scaled center of the sprite
        const scaledCenterX = this.worldX + (this.animator.width) / 2;
        const scaledCenterY = this.worldY + (this.animator.height) / 2;

        // Update the bounding box to be centered around the scaled sprite
        const boxWidth = this.boundingBox.width;
        const boxHeight = this.boundingBox.height;
        this.boundingBox.updateCentered(scaledCenterX, scaledCenterY, boxWidth, boxHeight);

        this.checkCollisionAndDealDamage();
        // if 1 second has passed while buffed, reset.
         if (this.game.elapsedTime / 1000 - this.lastEmpowerTick >= 1) {
             this.empower = 1;
         }
    }

    checkCollisionAndDealDamage() {

        const currentTime = this.game.elapsedTime / 1000;

        this.game.enemies.forEach((enemy) => {

        // Check collision and cooldown
        if (this.boundingBox.isColliding(enemy.boundingBox) && (currentTime - this.lastAttackTime >= this.attackCooldown/this.empower)) {
            enemy.takeDamage(this.atkPow * this.empower);
            this.takeDamage(5);
            this.lastAttackTime = currentTime; // Update last attack time
        }
        });
    }

    draw(ctx, game) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);

        if (this.empower > 1) {
            this.animator.outlineMode = true;
            // this.animator.outlineColor = 'rgb()'
        } else {
            this.animator.outlineMode = false;
        }

        this.drawHealth(ctx);
        this.boundingBox.draw(ctx, game);
    }

    closestTarget(){
        // default to player so they try to stay close if no threats nearby
        let target = this.game.player;
        let dist = 100000;

        this.game.enemies.forEach(enemy => {
            // if not an ally and closer than previously targeted enemy, change target to that.
            if (this.calcDist(enemy) < dist) {
                dist = this.calcDist(enemy);
                target = enemy;
            }
        });

        return target;
    }

    calcDist(target){

        const targetCenter = target.calculateCenter();
        const selfCenter = this.calculateCenter();

        // Calculate direction vector towards the target's center
        const dirX = targetCenter.x - selfCenter.x;
        const dirY = targetCenter.y - selfCenter.y;

        return Math.sqrt(dirX * dirX + dirY * dirY);

    }
}