/** This is the first boss class entity (A Knight).
 * It's sprites/animations are:
 * Standing - "./sprites/boss_knight_stand.png" : animXStart(0), animYStart(0), animW(40), animH(84), animFCount(4), animFDur(0.25), scale(3.5)
 * Dash Preparation Stance - "./sprites/boss_knight_dash.png" : animXStart(0), animYStart(0), animW(60), animH(84), animFCount(1), animFDur(1), scale(3.5)
 * Dash - "./sprites/boss_knight_dash.png" : animXStart(60), animYStart(0), animW(60), animH(84), animFCount(2), animFDur(0.2), scale(3.5)
 * Ground Smash - "./sprites/boss_knight_groundsmash.png" : animXStart(0), animYStart(0), animW(109), animH(100), animFCount(6), animFDur(0.35), scale(3.5)
 * Back Dash - "./sprites/boss_knight_backdash.png" : animXStart(0), animYStart(0), animW(62), animH(82), animFCount(1), animFDur(1), scale(3.5)
 */
class BossOne extends Entity {
    /** Default Constructor - Only needs to be passed the gameengine and worldX and Y coords. */
    constructor(game, worldX, worldY) {
        super(1, 1, 20,
            game, worldX, worldY,
            20, 35, "enemyBoss",
            600,
            "./sprites/boss_knight_stand.png",
            0, 0, 40, 84, 4, 0.25, 3.5,
            20);

        /** The name of this boss. */
        this.name = "Orange Bro";
        /** Tracks what the initial default speed of this entity was. */
        this.defaultSpeed = this.movementSpeed;
        /** Set the move speed to zero as he will not be a walking type enemy, only move via charge. */
        this.movementSpeed = 0;
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
            0, 0, 1, 1, "marker",
            0,
            "./sprites/debug_marker.png",
            0, 0, 91, 91, 1, 1, 1, 0));

        // Attack Variables
        /** Flag that tracks if we are ready to perform another attack (ex: charge, ground smash). */
        this.readyForNextAttack = true;
        /** Last time we checked for an attack to possibly happen. */
        this.lastAttackCheckTime = 0;
        /** How often to check if we are going to enter an attack mode. DO NOT SET THIS BELOW 1.4 (Or stuff will break) */
        this.attackCheckInterval = 1.5;
        /** This is a temporary timer that we will use in various parts of this class' code. Default setting is -1. */
        this.tempTimer = -1;
        /** This tracks what the status of the boss attacks are. */
        this.attackStatus = "none";

        // Charge Attack Variables
        /** Flag to track whether this boss is going to enter charge mode. */
        this.enterChargeMode = false;
        /** The time in seconds before the entity actually charges its target once entering charge mode. */
        this.chargeDelayTime = 1.23;
        /** Tracks how many seconds after stopping a charge that a new attack decision is allowed. */
        this.timeDelayAfterCharge = 1.15;
        /** Probability we charge on each chargeCheckInterval. */
        this.chargeChance = 0.44;

        // Ground Smash Attack Variables
        /** Tracks if we are entering ground smash attack mode. */
        this.enterGroundSmashMode = false;
        /** The time in seconds the boss has his hammer stuck in the ground after a smash. */
        this.groundSmashDelayTime = 1.33;
        /** Probability we charge on each chargeCheckInterval. */
        this.groundSmashChance = 0.51;
        /** How long the boss will dash backwards after a ground smash. */
        this.backDashTime = 0.75;
        /** Tracks the main attack circle that spawns on a ground smash attack. */
        this.groundSmashMainAttackCircle = null;

        /** Flag to track whether we are still going to track the target marker to the player. 0.75 = 75% chance. */
        this.trackMode = true;
        /** Flag to decide if we should invert the target movement direction. */
        this.invertMovementDirection = false;


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

            // Spawn a portal to rest area (because map is completed once boss is dead)
            this.game.spawnPortal(this.worldX, this.worldY,0);

            // Set the gameengine to roundOver
            this.game.roundOver = true;

            // Be sure to send the target marker entity to the garbage collector
            this.targetMarker.removeFromWorld = true;
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

        // Determine the direction to face based on the target's position
        if (this.targetMarker.worldX < this.worldX) {
            // Target is to the left, face left
            this.lastMove = "left";
        } else if (this.targetMarker.worldX > this.worldX) {
            // Target is to the right, face right
            this.lastMove = "right";
        }

        const targetDirection = this.calcTargetAngle(this.targetMarker);

        // If we are in any of the attack modes, then we are not ready to start new attack
        if (this.attackStatus !== "none" || (this.enterChargeMode || this.enterGroundSmashMode)) {
            this.readyForNextAttack = false;
        }
        else {
            this.readyForNextAttack = true;
        }

        // If entity is not ready to charge again, make sure we don't allow the timer to tick
        if (!this.readyForNextAttack) {
            this.lastAttackCheckTime = currentTime;
        }
        else {
            // We are ready for a new attack decision so enable the marker tracking again
            this.trackMode = true;
        }

        // Track marker location to player's center location
        if (this.trackMode && this.targetMarker) {
            this.targetMarker.worldX = this.game.player.worldX - (this.game.player.animator.width);
            this.targetMarker.worldY = this.game.player.worldY - (this.game.player.animator.height);
        }

        // Check if it's time to potentially enter an attack mode
        if ((!this.enterChargeMode && !this.enterGroundSmashMode) && currentTime - this.lastAttackCheckTime >= this.attackCheckInterval) {
            const bossCenterX = this.worldX + this.animator.width/2;
            const bossCenterY = this.worldY + this.animator.height/2;

            const markerCenterX = this.targetMarker.worldX + this.targetMarker.animator.width/2;
            const markerCenterY = this.targetMarker.worldY + this.targetMarker.animator.height/2;

            const distanceX = Math.abs(bossCenterX - markerCenterX);
            const distanceY = Math.abs(bossCenterY - markerCenterY);
            const proximity = 300; // Adjusted proximity threshold

            console.log("DISTX: " + distanceX + ". DISTY: " + distanceY);

            // Check if in proximity of target yet, if not, then charge to get closer
            // Adjusted condition to allow for charge if far enough in either X or Y direction
            if (distanceX > proximity || distanceY > proximity) {
                this.enterChargeMode = true;
            }
            // If not, then perform ground smash attack
            else {
                this.enterGroundSmashMode = true;
            }

            // Regardless of the outcome, update lastCheckTime to schedule next check
            this.lastAttackCheckTime = currentTime;
        }

        // START of Handle Charge Attack
        if (this.enterChargeMode) {
            if (this.attackStatus === "none") {
                this.attackStatus = "Preparing to Charge";

                // First, we need to enter the prepare to charge stance animation
                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/boss_knight_dash.png"), 0, 0, 60, 84, 1, 1);
            }

            // After this.chargeDelayTime has passed we need to actually enter the charge sprite animation and give the boss its charge movement speed.
            // If the tempTimer is === -1 then we need to set it to current time to start the timer
            if (this.tempTimer === -1) {
                this.tempTimer = currentTime;
            }
            if (this.attackStatus === "Preparing to Charge" && (currentTime - this.chargeDelayTime >= this.tempTimer)) {
                this.trackMode = false;
                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/boss_knight_dash.png"), 60, 0, 60, 84, 2, 0.2)
                this.tempTimer = -1;
                this.attackStatus = "Charging"
                this.movementSpeed = this.defaultSpeed;
            }

            // After we reach the target destination, turn off charge mode, set movespeed = 0, and set animation to standing
            if (this.attackStatus === "Charging") {
                const bossCenterX = this.worldX + this.animator.width/2;
                const bossCenterY = this.worldY + this.animator.height/2;

                const markerCenterX = this.targetMarker.worldX + this.targetMarker.animator.width/2;
                const markerCenterY = this.targetMarker.worldY + this.targetMarker.animator.height/2;

                const distanceX = Math.abs(Math.abs(bossCenterX - markerCenterX) - 15);
                const distanceY = Math.abs(bossCenterY - markerCenterY);
                const proximity = 10;

                // Check if in proximity of target yet, if so then stop the charge and return to normal stance
                if (distanceX < proximity && distanceY < proximity) {
                    this.movementSpeed = 0;
                    this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/boss_knight_stand.png"), 0, 0, 40, 84, 4, 0.25);
                    this.tempTimer = -1;
                    this.attackStatus = "none";
                    this.enterChargeMode = false;
                }
            }

        }
        // END of Handle Charge Attack

        // START of Handle Ground Smash Attack
        if (this.enterGroundSmashMode) {
            if (this.attackStatus === "none") {
                this.attackStatus = "Ground Smashing";

                // First we set the ground smash animation
                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/boss_knight_groundsmash.png"), 0, 0, 109, 100, 6, 0.35);

                this.trackMode = false;
            }


            // Spawn a warning attack circle (grey) for the attack that will be coming
            if (!this.groundSmashMainAttackCircle) {
                this.groundSmashMainAttackCircle = this.game.addEntity(new AttackCirc(this.game, this, 150, "enemyAttack", 0, 0, 1.05, null, 0, this.atkPow * 2.5, 50, 0, 1));
                this.groundSmashMainAttackCircle.drawCircle = true;
            }

            // If we reach the last frame of the ground smashing animation, pause the animation for this.groundSmashDelayTime
            if (this.attackStatus === "Ground Smashing" && (this.animator.currentFrame() === this.animator.frameCount - 1)) {
                this.animator.pauseAtFrame(this.animator.frameCount - 1);
                this.attackStatus = "Ground Smashed";
            }

            if (this.attackStatus === "Ground Smashed") {
                // If the tempTimer is === -1 then we need to set it to current time to start the timer
                if (this.tempTimer === -1) {
                    this.tempTimer = currentTime;
                }

                // After this.groundSmashDelayTime has passed, invert movement to do a back-dash
                if (currentTime - this.groundSmashDelayTime >= this.tempTimer) {
                    this.animator.pauseAtFrame(-1);
                    this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/boss_knight_backdash.png"), 0, 0, 62, 82, 1, 1);
                    this.movementSpeed = this.defaultSpeed;
                    this.invertMovementDirection = true;
                    this.attackStatus = "Back Dashing";
                    this.tempTimer = -1;
                }
            }

            if (this.attackStatus === "Back Dashing") {
                // If the tempTimer is === -1 then we need to set it to current time to start the timer
                if (this.tempTimer === -1) {
                    this.tempTimer = currentTime;
                }

                // After this.backDashTime has passed while back dashing, switch back to non-attack mode
                if (currentTime - this.backDashTime >= this.tempTimer) {
                    this.movementSpeed = 0;
                    this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/boss_knight_stand.png"), 0, 0, 40, 84, 4, 0.25);
                    this.invertMovementDirection = false;
                    this.tempTimer = -1;
                    this.attackStatus = "none";
                    this.enterGroundSmashMode = false;
                    this.groundSmashMainAttackCircle = null;
                }
            }
        }
        // END of Ground Smash Attack

        // Apply movement based on the direction and the entity's speed
        if (!this.invertMovementDirection) {
            this.worldX += targetDirection.x * this.movementSpeed * this.game.clockTick;
            this.worldY += targetDirection.y * this.movementSpeed * this.game.clockTick;
        }
        else {
            this.worldX -= targetDirection.x * this.movementSpeed * this.game.clockTick;
            this.worldY -= targetDirection.y * this.movementSpeed * this.game.clockTick;
        }

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