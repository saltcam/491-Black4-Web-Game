/** This is the first boss class entity (A Knight).
 * It's sprites/animations are:
 * Standing - "./sprites/boss_knight_stand.png" : animXStart(0), animYStart(0), animW(41), animH(84), animFCount(4), animFDur(0.25), scale(3.5)
 * Dash Preparation Stance - "./sprites/boss_knight_dash.png" : animXStart(0), animYStart(0), animW(61), animH(84), animFCount(1), animFDur(1), scale(3.5)
 * Dash - "./sprites/boss_knight_dash.png" : animXStart(61), animYStart(0), animW(61), animH(84), animFCount(2), animFDur(0.2), scale(3.5)
 */
class BossOne extends Entity {
    /** Default Constructor - Only needs to be passed the gameengine and worldX and Y coords. */
    constructor(game, worldX, worldY) {
        super(1500, 1500, 1,
            game, worldX, worldY,
            20, 35, "enemyBoss",
            600,
            "./sprites/boss_knight_stand.png",
            0, 0, 41, 84, 4, 0.25, 3.5,
            20);

        /** The name of this boss. */
        this.name = "Orange Bro";
        /** The last direction the boss moved (left or right). Default is right. */
        this.lastMove = "right"; // Default direction
        /** Tracks if the entity is currently moving (walking etc.) */
        this.isMoving = false;  // Is the character currently moving?
        /** Tracks what the current animation type is. */
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves
        /** For debugging purposes, default is off (false). */
        this.boundingBox.drawBoundingBox = false;
        /** The cooldown of how often this entity can damage the player with its attacks. */
        this.attackCooldown = 1;    // in seconds
        /** The time since this entity last damaged the player. */
        this.lastAttackTime = 0;    // time since last attack
        /** Controls whether this entity receives pushback force. */
        this.canBePushedBack = false;
        /** A multiplier applied to any pushback force on this entity. */
        this.pushbackMultiplier = 0.15; // Might want this < 1 to lessen pushback since this is a boss.
        /** The vector that tracks the force to apply to this entity. */
        this.pushbackVector = { x: 0, y: 0 };
        /** How fast the momentum from the pushback effect fades away. */
        this.pushbackDecay = 0.9; // Determines how quickly the pushback force decays
        /** Target direction marker. Tracks where the boss should be pathing to next. */
        this.targetMarker = this.game.addEntity(new Entity(1, 1, 0, this.game,
            0, 0, 15, 15, "marker",
            0,
            "./sprites/debug_marker.png",
            0, 0, 91, 91, 1, 1, 1, 0));
        /** Flag to track whether this boss is going to enter charge mode. */
        this.enterChargeMode = false;
        /** Last time we checked for enterChargeMode change (Preparation to enter charge mode when enterChargeMode is set to false). */
        this.lastCheckTime = 0;
        /** How often to check if we are going to enter charging mode. */
        this.checkInterval = 5;
        /** Flag to track whether we are still going to track the target marker to the player. */
        this.trackMode = true;
        /** Tracks what the initial default speed of this entity was. */
        this.defaultSpeed = this.movementSpeed;
        /** Set the move speed to zero as he will not be a walking type enemy, only move via charge. */
        this.movementSpeed = 0;

        // Stuff for boss health bar calculations
        /** The rate at which the recent damage decays per second after 1 sec of no new damage. */
        this.damageDecayRate = 7500;
        /** Game time when the last damage was taken. */
        this.lastDamageTime = 0;
        /** Time in seconds before recent damage (yellow HP) starts to decay. */
        this.damageDecayDelay = 0.1;
    }

    /** This is the method called when an outside force (usually an attack) is trying to push this entity around. */
    applyPushback(forceX, forceY) {
        if (this.canBePushedBack) {
            this.pushbackVector.x += forceX * this.pushbackMultiplier;
            this.pushbackVector.y += forceY * this.pushbackMultiplier;
        }
    }

    /** Called every tick to do movement updates and other various calculations like boss health bar math. */
    update() {
        super.update();

        // Early exit if the player does not exist or enemy is dead
        if (!this.game.player || this.isDead) {
            return;
        }

        // If health hits 0 or below, this entity is declared dead
        if (this.currHP <= 0) {
            this.isDead = true;
        }

        // Decrease recent damage over time (for boss health bar calculations)
        const currentTime = this.game.timer.gameTime;
        if (currentTime - this.lastDamageTime > this.damageDecayDelay && this.recentDamage > 0) {
            const timeSinceLastDamage = currentTime - this.lastDamageTime - this.damageDecayDelay;
            const decayAmount = this.damageDecayRate * (timeSinceLastDamage / 1000); // Calculate decay based on time passed
            this.recentDamage = Math.max(0, this.recentDamage - decayAmount); // Ensure recentDamage does not go negative
            if (this.recentDamage === 0) {
                this.lastDamageTime = currentTime; // Reset last damage time to prevent continuous decay
            }
        }

        // Apply pushback (if there is any)
        this.worldX += this.pushbackVector.x;
        this.worldY += this.pushbackVector.y;

        // Decay the pushback force
        this.pushbackVector.x *= this.pushbackDecay;
        this.pushbackVector.y *= this.pushbackDecay;

        // If pushback is very small, reset it to 0 to stop movement
        if (Math.abs(this.pushbackVector.x) < 0.1) this.pushbackVector.x = 0;
        if (Math.abs(this.pushbackVector.y) < 0.1) this.pushbackVector.y = 0;

        // Determine the direction to face based on the player's position
        if (this.targetMarker.worldX < this.worldX) {
            // Player is to the left, face left
            this.lastMove = "left";
        } else if (this.targetMarker.worldX > this.worldX) {
            // Player is to the right, face right
            this.lastMove = "right";
        }

        // Check if it's time to potentially change enterChargeMode
        if (this.currentAnimation === "standing" && currentTime - this.lastCheckTime >= this.checkInterval) {
            // Perform RNG check
            if (Math.random() < 0.75) { // decimal is the % chance (0.5 = 50%)
                this.enterChargeMode = true;
            }

            // Regardless of the outcome, update lastCheckTime to schedule next check
            this.lastCheckTime = currentTime;
        }

        const targetDirection = this.calcTargetAngle(this.targetMarker);

        if (this.enterChargeMode) {
            // Stop boss's movement
            this.movementSpeed = 0;

            // Set dash preparation stance sprite
            this.currentAnimation = "preparingCharge";

            // // After 2 seconds stop tracking for the target marker.
            // setTimeout(() => {
            //     this.trackMode = false;
            // }, 2000);

            // After 1 second CHARGE the player
            setTimeout(() => {
                // Give the entity it's charge speed
                this.movementSpeed = this.defaultSpeed;

                // Set dash sprite
                this.currentAnimation = "charging";

                this.enterChargeMode = false;
            }, 3000);
        }

        // Track marker location to player's center location
        if (this.trackMode && this.targetMarker) {
            this.targetMarker.worldX = this.game.player.worldX - (this.game.player.animator.width);
            this.targetMarker.worldY = this.game.player.worldY - (this.game.player.animator.height);
        }

        // Apply proper animation sprites depending on currentAnimation
        if (this.currentAnimation === "standing") {
            if (this.animator.spritesheet !== ASSET_MANAGER.getAsset("./sprites/boss_knight_stand.png")) {
                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/boss_knight_stand.png"), 0, 0, 41, 84, 4, 0.25);
            }

            this.trackMode = true;
            this.movementSpeed = 0;
        }
        if (this.currentAnimation === "preparingCharge") {
            if (this.animator.spritesheet !== ASSET_MANAGER.getAsset("./sprites/boss_knight_dash.png") || this.animator.frameCount !== 1) {
                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/boss_knight_dash.png"), 0, 0, 61, 84, 1, 1);
            }

            this.trackMode = true;
            this.movementSpeed = 0;
        }
        if (this.currentAnimation === "charging") {
            if (this.animator.spritesheet !== ASSET_MANAGER.getAsset("./sprites/boss_knight_dash.png")) {
                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/boss_knight_dash.png"), 61, 0, 61, 84, 2, 0.2);
            }

            this.trackMode = false;

            // Set him back to standing if he arrives at the target marker
            const distanceX = Math.abs(this.worldX - this.targetMarker.worldX);
            const distanceY = Math.abs(this.worldY - this.targetMarker.worldY);
            const proximity = 50;

            // Check if in proximity
            console.log("If distX(" + distanceX + ") AND distY(" + distanceY + ") < prox(" + proximity + ")");
            if (distanceX < proximity && distanceY < proximity) {
                console.log("STOPPING BOSS CHARGE!");

                this.currentAnimation = "standing";
            }
        }

        // Set him back to standing if he arrives at the target marker
        // if ((this.worldX >= this.targetMarker.worldX - 25 && this.worldX <= this.targetMarker.worldX + 25) &&
        //     (this.worldY >= this.targetMarker.worldY - 25 && this.worldY <= this.targetMarker.worldY + 25) &&
        //     this.movementSpeed > 0) {
        //     console.log("STOPPING BOSS CHARGE!");
        //     // Make sure he's not moving/charging anymore.
        //     this.movementSpeed = 0;
        //
        //     // Enable tracking mode again, look for a chance to charge again
        //     this.trackMode = true;
        //
        //     // Set him back to standing
        //     this.currentAnimation = "standing";
        // }


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

        this.checkCollisionAndDealDamage();
    }

    checkCollisionAndDealDamage() {
        const player = this.game.player;
        const currentTime = this.game.timer.gameTime;

        // Check collision and cooldown
        if (this.boundingBox.isColliding(player.boundingBox) && currentTime - this.lastAttackTime >= this.attackCooldown) {
            player.takeDamage(this.atkPow);
            this.lastAttackTime = currentTime; // Update last attack time
        }
    }

    drawBossHealthBar(ctx) {
        // Current game time
        const currentTime = this.game.timer.gameTime;

        // Check if more than 1 second has passed since the last damage
        if (currentTime - this.lastDamageTime > this.damageDecayDelay && this.recentDamage > 0) {
            // Gradually decrease recentDamage over time here
            // This is a simplified example, you might want to decrease it more smoothly
            this.recentDamage -= 1; // Adjust this rate as needed
        }

        // Prevent recentDamage from going negative
        if (this.recentDamage < 0) {
            this.recentDamage = 0;
        }

        const barWidth = 750;
        const barHeight = 15;
        const xOffset = (ctx.canvas.width - barWidth) / 2;
        const yOffset = 750; // Adjust for your game's UI layout

        // Draw the black background
        ctx.fillStyle = "black";
        ctx.fillRect(xOffset-3, yOffset-3, barWidth+6, barHeight+6);

        // Draw the red current health
        const currentHealthWidth = (this.currHP / this.maxHP) * barWidth;
        ctx.fillStyle = "red";
        ctx.fillRect(xOffset, yOffset, currentHealthWidth, barHeight);

        // Draw the yellow recent damage
        const recentDamageWidth = (this.recentDamage / this.maxHP) * barWidth;
        if (recentDamageWidth > 0) {
            ctx.fillStyle = "yellow";
            ctx.fillRect(xOffset + currentHealthWidth, yOffset, recentDamageWidth, barHeight);
        }

        // Draw boss' name
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.font = '32px Arial';
        ctx.fillText(this.name, ctx.canvas.width / 2, (yOffset - barHeight));
    }

    draw(ctx, game) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);

        this.boundingBox.draw(ctx, game);
    }
}