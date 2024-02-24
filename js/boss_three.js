/**
 * This is the third boss class entity (Some kind of God being/abomination).
 * It's sprites/animations are:
 *
 */
class BossThree extends Entity {
    /** Default Constructor - Only needs to be passed the gameengine and worldX and Y coords. */
    constructor(game, worldX, worldY) {
        super(3000, 3000, 40,
            game, worldX, worldY,
            70, 120, "enemyBoss",
            100,
            "./sprites/god_idle.png",
            0, 0, 158, 177, 10, 0.25, 2.5,
            -1);

        /** The name of this boss. */
        this.name = "God's Wrath";
        /** Tracks what the initial movement speed of this entity was. */
        this.initialMovementSpeed = this.movementSpeed;
        /** The last direction the boss moved (left or right). Default is right. */
        this.lastMove = "right"; // Default direction
        /** Tracks if the entity is currently moving (walking etc.) */
        this.isMoving = false;  // Is the character currently moving?
        /** For debugging purposes, default is off (false). */
        this.boundingBox.drawBoundingBox = false;
        /** The cooldown of how often this entity can damage the player with its collision attacks. */
        this.collisionAttackCooldown = 1;    // in seconds
        /** The time since this entity last damaged the player. */
        this.lastCollisionAttackTime = 0;    // time since last attack
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
            0, 0, 5, 5, "attackMarker",
            0,
            "./sprites/attack_targeting.png",
            0, 0, 92, 92, 4, 0.25, 2, 0));
        this.targetMarker.animator.pauseAtFrame(10); // Sets the marker invisible

        /** This is the eyeball entity that is going to be drawn over the boss' body itself. It will be rotating to always look at the player. */
        this.eyeBallEntity = this.game.addEntity(new Entity(1, 1, 0, this.game,
            this.worldX, this.worldY, 25, 25, "eyeEntity", 0,
            "./sprites/god_eye.png", 0, 0, 63, 63, 1, 1, 2.4, 0));
        this.eyeBallEntity.followEntity(this, 45, -12);

        // Attack Variables
        /** Last time we checked for an attack to possibly happen. */
        this.lastAttackCheckTime = this.game.elapsedTime / 1000; // Set to this to ensure boss doesn't use the attacks right away
        /** How often to check if we are going to enter an attack mode. */
        this.attackModeCooldown = 2.5;
        /** This tracks what the status of the boss attacks are. */
        this.attackStatus = "none";

        // Stuff for Laser Beam Eye attack
        /** Flag to track if we are entering Laser Beam Eye attack mode. */
        this.enterLaserAttackMode = false;
        /** Tracks when this entity first entered Laser Beam Attack mode. Useful for when we calculate certain delays. */
        this.enterLaserBeamStartTime = 0;
        /** The cooldown (in seconds) of how often this boss can use the Laser Beam Eye attack. */
        this.laserAttackCooldown = 7.5;
        /** When the last Laser Beam Eye attack was. */
        this.lastLaserBeamAttackTime = 0;
        /** How long between entering Laser Beam Attack mode, and actually firing the laser beam. */
        this.laserBeamAttackDelay = 7.5;
        /** How long the beam attack lasts (AKA: how long is the beam shooting out?). */
        this.beamingAttackDuration = 5;
        /** How much damage each tick of the attack beam does. */
        this.beamTickDamage = this.atkPow / 4;
        /** How often to tick damage if the player is caught in the beam attack. */
        this.beamTickRate = 0.25;
        /** When did we start 'beaming' (AKA: actually shooting the laser beam. This needs to be defaulted to -1 for a conditional check in the code. */
        this.beamingStartTime = -1;
        /** How often we increase this entity's outline as it is 'preparing to beam'. */
        this.laserBeamOutlineGrowCD = 0.1;
        /** Tracks the time that we last increased the boss' outline size. */
        this.lastOutlineGrowTime = 0;
        /** This offsets the height of the starting point eye beam tracking visual. */
        this.beamTrackHeightOffset = 70;

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

        // Store all animation info for easy access
        this.animationBank = [
            {name: "idle", spritePath: "./sprites/god_idle.png", animXStart: 0, animYStart: 0, animW: 158, animH: 177, animFCount: 10, animFDur: 0.25},
            {name: "walk", spritePath: "./sprites/god_walk.png", animXStart: 0, animYStart: 0, animW: 158, animH: 177, animFCount: 10, animFDur: 0.3}
        ]
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

        // Early exit if the player does not exist for some reason at this point
        if (!this.game.player) {
            return;
        }

        // If health hits 0 or below, this entity is declared dead
        if (this.isDead) {
            // Spawn a portal to rest area (because map is completed once boss is dead)
            this.game.spawnPortal(0, 0, 0);

            // Set the gameengine to roundOver
            this.game.roundOver = true;

            // Send the right stuff to garbage collection
            this.targetMarker.removeFromWorld = true;
            this.eyeBallEntity.removeFromWorld = true;
            this.removeFromWorld = true;
            this.game.killAllEnemies();

            return;
        }

        // Make sure the eyeball entity is always 'looking' at the player
        this.eyeBallEntity.lookAtEntity(this.game.player, 3.1);

        // Decrease recent damage over time (for boss health bar calculations)
        const currentTime = this.game.elapsedTime / 1000;
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

        if (this.attackStatus === "Beaming") {
            // Ensure beamGeometry is updated in real-time
            this.beamGeometry = {
                startX: this.worldX + (this.animator.width / 2),
                startY: this.worldY + (this.animator.height / 2) - this.beamTrackHeightOffset,
                endX: this.targetMarker.worldX + (this.targetMarker.animator.width / 2),
                endY: this.targetMarker.worldY + (this.targetMarker.animator.height / 2),
                isActive: true
            };

            // Check if the player is within the beam's damage zone
            const playerCenter = this.game.player.calculateCenter();
            if (this.isPlayerInBeam(playerCenter)) {
                // Apply damage every tick seconds if within the beam
                const currentTime = this.game.elapsedTime / 1000;
                if (!this.lastBeamDamageTime || currentTime - this.lastBeamDamageTime >= this.beamTickRate) {
                    this.game.player.takeDamage(this.beamTickDamage);
                    this.lastBeamDamageTime = currentTime;
                }
            }
        } else {
            this.beamGeometry = { isActive: false };
        }

        // If we are not 0 movement speed, we are moving, so apply walking sprite animation if it's not already set.
        if (this.movementSpeed !== 0 && !this.animator.spritesheet.src.includes(this.animationBank[1].spritePath.replace(/^\./, ""))) { // Super wierd code that lets use ignore the '.' at the beginning of the sprite path to compare it to the current 'src' animation sprite path in animator.
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.animationBank[1].spritePath), this.animationBank[1].animXStart, this.animationBank[1].animYStart, this.animationBank[1].animW, this.animationBank[1].animH, this.animationBank[1].animFCount, this.animationBank[1].animFDur);
        }

        // Track the marker an offset amount behind the player (this way the entity charges 'through' where the player was)
        if (this.trackMode && this.targetMarker) {
            const playerCenter = this.game.player.calculateCenter();

            // Define the offset distance and direction behind the player
            const offsetDistance = 1500; // Adjust this value as needed
            const directionToPlayer = this.calcTargetAngle(this.game.player); // Assuming this method returns a normalized direction vector
            const targetMarkerTargetX = ((playerCenter.x - 50) + directionToPlayer.x * offsetDistance);
            const targetMarkerTargetY = ((playerCenter.y + 50) + directionToPlayer.y * offsetDistance);

            // Apply dampened movement towards the target position
            this.applyDampenedMovement(targetMarkerTargetX, targetMarkerTargetY);
        }

        // Determine the direction to face based on the target's position
        // We don't need to do this while beaming/preparing to beam (avoids boss flickering around)
        if (!this.enterLaserAttackMode) {
            if (this.targetMarker.worldX < this.worldX) {
                // Target is to the left, face left
                this.lastMove = "left";
            } else if (this.targetMarker.worldX > this.worldX) {
                // Target is to the right, face right
                this.lastMove = "right";
            }
        }

        const targetDirection = this.calcTargetAngle(this.targetMarker);

        // Check if it's time to enter an attack mode again
        if (this.attackStatus === "none" && currentTime - this.lastAttackCheckTime >= this.attackModeCooldown) {
            // Attempt to enter last beam attack mode
            if (currentTime - this.lastLaserBeamAttackTime >= this.laserAttackCooldown) {
                this.enterLaserAttackMode = true;
            }

            this.lastAttackCheckTime = currentTime;
        }

        // Attempt Laser Beam Eye attack
        if (this.enterLaserAttackMode) {
            this.performLaserBeamAttack();
        }

        // Apply movement based on the direction and the entity's speed
        if (!this.invertMovementDirection) {
            this.worldX += targetDirection.x * this.movementSpeed * this.game.clockTick;
            this.worldY += targetDirection.y * this.movementSpeed * this.game.clockTick;
        }
        else {
            this.worldX -= targetDirection.x * this.movementSpeed * this.game.clockTick;
            this.worldY -= targetDirection.y * this.movementSpeed * this.game.clockTick;
        }

        this.checkCollisionAndDealDamage();
    }

    /** This method executes the code necessary to perform the Laser Beam Eye attack. */
    performLaserBeamAttack() {
        const currentTime = this.game.elapsedTime / 1000;

        if (this.attackStatus === "Beaming") {
            this.beamGeometry = {
                startX: this.worldX + (this.animator.width / 2),
                startY: this.worldY + (this.animator.height / 2) - this.beamTrackHeightOffset,
                endX: this.targetMarker.worldX + (this.targetMarker.animator.width / 2),
                endY: this.targetMarker.worldY + (this.targetMarker.animator.height / 2),
                isActive: true
            };
        } else {
            this.beamGeometry = { isActive: false };
        }

        // Set the attack status to 'Preparing to Beam' (if there is no attack status yet)
        if (this.attackStatus === "none") {
            this.attackStatus = "Preparing to Beam";

            // Stop the boss in place
            this.movementSpeed = 0;
            // Switch sprite animation to idle (if not already set)
            if (!this.animator.spritesheet.src.includes(this.animationBank[0].spritePath.replace(/^\./, ""))) {
                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.animationBank[0].spritePath), this.animationBank[0].animXStart, this.animationBank[0].animYStart, this.animationBank[0].animW, this.animationBank[0].animH, this.animationBank[0].animFCount, this.animationBank[0].animFDur);
            }

            this.enterLaserBeamStartTime = currentTime;
            this.relocateMode = false; // Don't allow relocation during this attack
            this.animator.outlineBlur = 0; // Fail-safe to make sure this starts at the default value for this entity
        } else if (this.attackStatus === "Preparing to Beam" && currentTime - this.lastOutlineGrowTime >= this.laserBeamOutlineGrowCD) {
            // Apply an intense outline/glow effect that grows as we wait to fire the beam
            this.animator.outlineMode = true;
            this.animator.outlineColor = "white";
            this.animator.outlineBlur = Math.min(this.animator.outlineBlur + 0.075, 30);
        } else if (this.attackStatus === "Beaming" && currentTime - this.lastOutlineGrowTime >= this.laserBeamOutlineGrowCD) {
            this.animator.outlineBlur = this.animator.outlineBlur += 3.3;
        }

        // Wait for the Laser Beam Attack delay before actually firing the laser beam
        if (this.attackStatus === "Preparing to Beam" && currentTime - this.laserBeamAttackDelay >= this.enterLaserBeamStartTime) {
            this.beamingStartTime = currentTime;
            this.attackStatus = "Beaming";
            this.trackMode = false;
        }
        // Check if it's time to stop the beaming attack
        else if (this.attackStatus === "Beaming" && currentTime - this.beamingAttackDuration >= this.beamingStartTime) {
            this.attackStatus = "none";
            this.movementSpeed = this.initialMovementSpeed; // Let the entity move again
            this.animator.outlineMode = false;
            this.animator.outlineBlur = 0;
            this.lastLaserBeamAttackTime = currentTime;
            this.enterLaserAttackMode = false;
            this.animator.pauseAtFrame(-1); // Turn off any remaining frame pausing
            this.relocateMode = true; // Now that attack is over, we can allow relocation again
            this.trackMode = true;
        }
    }

    applyDampenedMovement(targetX, targetY) {
        const lerpSpeed = 0.0125; // Control how quickly the marker catches up to the target position (0.01 to 0.1 are reasonable values)

        // Linearly interpolate (lerp) the targetMarker's position towards the target position
        this.targetMarker.worldX += (targetX - this.targetMarker.worldX) * lerpSpeed;
        this.targetMarker.worldY += (targetY - this.targetMarker.worldY) * lerpSpeed;
    }

    /** This method controls how damage is dealt through bounding box collisions with this entity. */
    checkCollisionAndDealDamage() {
        const player = this.game.player;
        const currentTime = this.game.elapsedTime / 1000;

        // Check collision and cooldown
        if (this.boundingBox.isColliding(player.boundingBox) && currentTime - this.lastCollisionAttackTime >= this.collisionAttackCooldown) {
            player.takeDamage(this.atkPow);
            this.lastCollisionAttackTime = currentTime; // Update last collision attack time
        }
    }

    isPlayerInBeam(playerCenter) {
        if (!this.beamGeometry.isActive) return false;

        // Calculate the nearest point on the beam line to the player
        // This involves some vector math to project the player's position onto the line defined by the beam
        // For simplicity, let's assume a function calculateNearestPoint(beamGeometry, playerCenter) exists
        const nearestPoint = this.calculateNearestPoint(this.beamGeometry, playerCenter);

        // Now, calculate the distance from the player to this nearest point
        const distance = Math.sqrt(
            Math.pow(nearestPoint.x - playerCenter.x, 2) +
            Math.pow(nearestPoint.y - playerCenter.y, 2)
        );

        // Check if the distance is within the buffer zone
        const buffer = 100; // Buffer distance around the beam line
        return distance <= buffer;
    }

    /**
     * Calculates the nearest point on the line segment to a given point.
     *
     * @param {Object} line - The line segment defined by start and end points (startX, startY, endX, endY).
     * @param {Object} point - The point from which the nearest point on the line segment is calculated.
     * @returns {Object} The nearest point on the line segment.
     */
    calculateNearestPoint(line, point) {
        const lineVec = { x: line.endX - line.startX, y: line.endY - line.startY };
        const pointVec = { x: point.x - line.startX, y: point.y - line.startY };

        // Calculate the projection of pointVec onto lineVec
        const lineLength = lineVec.x * lineVec.x + lineVec.y * lineVec.y;
        const dotProduct = pointVec.x * lineVec.x + pointVec.y * lineVec.y;
        const t = Math.max(0, Math.min(dotProduct / lineLength, 1));

        // Calculate the nearest point using the projection scalar
        const nearestPoint = {
            x: line.startX + t * lineVec.x,
            y: line.startY + t * lineVec.y
        };

        return nearestPoint;
    }


    drawBossHealthBar(ctx) {
        // Current game time
        const currentTime = this.game.elapsedTime / 1000;

        // Check if more than 1 second has passed since the last damage
        if (currentTime - this.lastDamageTime > this.damageDecayDelay && this.recentDamage > 0) {
            // Gradually decrease recentDamage over time here
            this.recentDamage -= 1; // Adjust this rate as needed
        }

        // Prevent recentDamage from going negative
        if (this.recentDamage < 0) {
            this.recentDamage = 0;
        }

        const barWidth = 750;
        const barHeight = 15;
        const xOffset = (ctx.canvas.width - barWidth) / 2;
        const yOffset = 85;

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
            const totalDamageWidth = Math.min(recentDamageWidth, barWidth - currentHealthWidth);
            ctx.fillStyle = "yellow";
            ctx.fillRect(xOffset + currentHealthWidth, yOffset, totalDamageWidth, barHeight);
        }

        // Draw boss' name
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.font = '32px Arial';
        ctx.fillText(this.name, ctx.canvas.width / 2, (yOffset - barHeight));
    }

    draw(ctx, game) {
        super.draw(ctx, game);

        // Strobing control variables
        const strobeSpeed = 20; // How fast the color changes
        const minRedIntensity = 200; // Minimum color intensity (lighter red)
        const maxRedIntensity = 255; // Maximum color intensity (brighter red)

        let fillColor = 'rgba(255, 255, 255, 0)'; // Default to fully transparent

        if (this.attackStatus === "Preparing to Beam" || this.attackStatus === "Beaming") {
            const currentTime = this.game.elapsedTime / 1000;
            const beamPrepProgress = Math.min(1, (currentTime - this.enterLaserBeamStartTime) / (this.laserBeamAttackDelay - 2));

            const targetCenterX = this.targetMarker.worldX + (this.targetMarker.animator.width / 2);
            const targetCenterY = this.targetMarker.worldY + (this.targetMarker.animator.height / 2);
            const startPointX = this.worldX + (this.animator.width / 2);
            const startPointY = this.worldY + (this.animator.height / 2) - this.beamTrackHeightOffset;

            const beamMagnitude = Math.sqrt(Math.pow(targetCenterX - startPointX, 2) + Math.pow(targetCenterY - startPointY, 2));
            const angle = Math.atan2(targetCenterY - startPointY, targetCenterX - startPointX);

            // Calculate the strobing effect
            const strobeEffect = Math.sin(currentTime * strobeSpeed) * 0.5 + 0.5; // Oscillates between 0 and 1
            const redIntensity = minRedIntensity + (maxRedIntensity - minRedIntensity) * strobeEffect;

            ctx.save();
            ctx.translate(startPointX - this.game.camera.x, startPointY - this.game.camera.y);
            ctx.rotate(angle);
            fillColor = this.attackStatus === "Beaming" ? `rgba(${redIntensity}, 0, 0, 1)` : `rgba(255, 255, 255, ${beamPrepProgress * 2 - 1})`;
            ctx.fillStyle = fillColor;
            ctx.fillRect(0, -72.5, beamMagnitude, 145);
            ctx.restore();
        }

        this.eyeBallEntity.draw(ctx, game);

        const eyeCenterX = this.eyeBallEntity.worldX + (this.eyeBallEntity.animator.width / 2) - this.game.camera.x;
        const eyeCenterY = this.eyeBallEntity.worldY + (this.eyeBallEntity.animator.height / 2) - this.game.camera.y;

        ctx.beginPath();
        ctx.arc(eyeCenterX, eyeCenterY, 77, 0, 2 * Math.PI);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.closePath();
    }
}