/**
 * This is the third boss class entity (Some kind of God being/abomination).
 * It's sprites/animations are:
 *
 */
class BossThree extends Entity {
    /** Default Constructor - Only needs to be passed the gameengine and worldX and Y coords. */
    constructor(game, worldX, worldY) {
        super(35000, 35000, 40,
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
            0, 0, 5, 5, "attackMarker_boss",
            0,
            "./sprites/attack_targeting.png",
            0, 0, 92, 92, 4, 0.25, 2, 0));
        this.targetMarker.animator.pauseAtFrame(10); // Sets the marker invisible

        /** This is the eyeball entity that is going to be drawn over the boss' body itself. It will be rotating to always look at the player. */
        this.eyeBallEntity = this.game.addEntity(new Entity(1, 1, 0, this.game,
            this.worldX, this.worldY, 25, 25, "eyeEntity_boss", 0,
            "./sprites/god_eye.png", 0, 0, 63, 63, 1, 1, 2.4, 0));
        this.eyeBallEntity.followEntity(this, 45, -12);

        /** This is the wings sprite that we will be attaching to the back of this boss. */
        this.wingsEntity = this.game.addEntity(new Entity(1, 1, 0, this.game,
            this.calculateCenter().x, this.calculateCenter().y, 25, 25, "wingsEntity_boss", 0,
            "./sprites/god_wings.png", 0, 0, 498, 415, 6, 0.3, 2.5, 0));
        this.wingsEntity.followEntity(this, -150, -350);
        this.wingsEntity.animator.outlineMode = true;
        this.wingsEntity.animator.outlineColor = "white";
        this.wingsEntity.animator.outlineBlur = 25;

        // Attack Variables
        /** Last time we checked for an attack to possibly happen. */
        this.lastAttackCheckTime = this.game.elapsedTime / 1000; // Set to this to ensure boss doesn't use the attacks right away
        /** How often to check if we are going to enter an attack mode. */
        this.attackModeCooldown = 3.3;
        /** This tracks what the status of the boss attacks are. */
        this.attackStatus = "none";
        /** A temporary/re-used timer variable that will help us reduce redundancy. */
        this.tempTimer = -1;

        /** If true, this boss cannot be harmed. */
        this.immune = false;
        /** This controls what health % this boss enters phase two at. */
        this.phaseTwoHealthThreshhold = 0.01; // ex: 0.25 = 25% health
        /** Tracks if it's time to enter phase two for this boss. */
        this.enterPhaseTwo = false;
        /** Tracks if we have finished entering phase two already. */
        this.phaseTwoActivated = false;

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
        this.beamTickRate = 0.18;
        /** When did we start 'beaming' (AKA: actually shooting the laser beam. This needs to be defaulted to -1 for a conditional check in the code. */
        this.beamingStartTime = -1;
        /** How often we increase this entity's outline as it is 'preparing to beam'. */
        this.laserBeamOutlineGrowCD = 0.1;
        /** Tracks the time that we last increased the boss' outline size. */
        this.lastOutlineGrowTime = 0;
        /** This offsets the height of the starting point eye beam tracking visual. */
        this.beamTrackHeightOffset = 70;
        /** Tracks when the last time we decayed movement during preparing to charge state. */
        this.lastMovementDecay = 0;

        // Stuff for charge attack
        /** Sets how much damage the charge collisions this entity will do. */
        this.chargeDamage = this.atkPow * 1.5;
        /** Tracks if we are entering charge mode. */
        this.enterChargeMode = false;
        /** The delay between 'Preparing to Charge' and actually charging. */
        this.chargeDelayTime = 1.5;
        /** Tracks minimum time (in seconds) between charge attacks. */
        this.chargeAttackCooldown = 7.5;
        /** Tracks the last time this entity charged. */
        this.lastChargeAttackTime = 0;
        /** How often to decrease movespeed when preparing to charge state is active. */
        this.decayMovementCooldown = 0.05;
        /** How much to decay movement while preparing to charge state is active. */
        this.decayMovementAmount = 10;

        // Stuff for summon attack
        /** Controls if it is time to enter summon attack mode. */
        this.enterSummAttackMode = false;
        /** Sets how many big enemies are summoned. */
        this.summAttackBigEnemyCount = 2;
        /** Sets how many small enemies are summoned. */
        this.summAttackSmallEnemyCount = 20;
        /** How long the cooldown of the summon attack is. */
        this.summAttackCooldown = 7.5;
        /** Tracks when the last summon attack was. */
        this.lastSummAttackTime = 0;
        /** Tracks when we started the last summon attack. */
        this.summAttackStartTime = 0;
        /** Tracks how long the boss is stuck in the 'summoning' attack. */
        this.summAttackDuration = 2;

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
            {name: "walk", spritePath: "./sprites/god_walk.png", animXStart: 0, animYStart: 0, animW: 158, animH: 177, animFCount: 10, animFDur: 0.3},
            {name: "fall", spritePath: "./sprites/god_fall.png", animXStart: 0, animYStart: 0, animW: 158, animH: 177, animFCount: 10, animFDur: 0.2},
            {name: "fallen_idle", spritePath: "./sprites/god_fallen_idle.png", animXStart: 0, animYStart: 0, animW: 158, animH: 177, animFCount: 10, animFDur: 0.25},
            {name: "fallen_walk", spritePath: "./sprites/god_fallen_walk.png", animXStart: 0, animYStart: 0, animW: 158, animH: 177, animFCount: 10, animFDur: 0.25}
        ];

        this.laserChargingSound = "./sounds/boss_laser_charging.mp3";
        this.laserBeamingSound = "./sounds/boss_laser_beaming.mp3";
        this.hurtSound = "./sounds/boss_hurt_yell.mp3";
        this.goreSound = "./sounds/boss_gore.mp3";
        this.summonSound = "./sounds/boss_summon.mp3";

        this.randomSoundCooldown = 4.5;
        this.lastRandomSound = 0;

        // Store random creature sounds for this boss
        this.creatureSoundBank = [
            "./sounds/boss_creature_sound1.mp3",
            "./sounds/boss_creature_sound2.mp3",
            "./sounds/boss_creature_sound3.mp3",
            "./sounds/boss_creature_sound4.mp3",
            "./sounds/boss_creature_sound5.mp3",
            "./sounds/boss_creature_sound6.mp3",
            "./sounds/boss_creature_sound7.mp3",
            "./sounds/boss_creature_sound8.mp3"
        ];

        /** Tracks if this entity has been initialized. */
        this.initialized = false;
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
        if(!this.initialized) {
            // Scale this boss to the difficulty scale
            this.maxHP = Math.round(this.maxHP * this.game.SPAWN_SYSTEM.DIFFICULTY_SCALE);
            this.currHP = this.maxHP;
            this.atkPow = Math.round(this.atkPow * this.game.SPAWN_SYSTEM.DIFFICULTY_SCALE);
            this.summAttackBigEnemyCount = this.summAttackBigEnemyCount * Math.floor(this.game.SPAWN_SYSTEM.DIFFICULTY_SCALE);
            this.summAttackSmallEnemyCount = this.summAttackSmallEnemyCount * Math.floor(this.game.SPAWN_SYSTEM.DIFFICULTY_SCALE);

            this.initialized = true;
        }

        if ((this.currHP <= 0 || this.currHP / this.maxHP <= this.phaseTwoHealthThreshhold)) {
            if (!this.phaseTwoActivated) {
                this.immune = true;
                this.currHP = this.maxHP;
                this.maxHP = this.currHP;
                this.isDead = false;
                this.enterPhaseTwo = true;
            } else {
                // Spawn a portal to rest area (because map is completed once boss is dead)
                //this.game.spawnPortal(0, 0);
                this.game.spawnEndPortal(0,0);

                // Set the gameengine to roundOver
                this.game.roundOver = true;

                // Send the right stuff to garbage collection
                if (this.targetMarker) this.targetMarker.removeFromWorld = true;
                if (this.eyeBallEntity) this.eyeBallEntity.removeFromWorld = true;
                if (this.wingsEntity) this.wingsEntity.removeFromWorld = true;
                this.game.killAllEnemies();
                this.game.spawnEndChest();
                this.game.mapThreeMusicPlaying = false;
                ASSET_MANAGER.stopBackgroundMusic();
                this.game.SPAWN_SYSTEM.spawnWithBoss = false;
                this.removeFromWorld = true;
                return;
            }
        }

        super.update();

        // Early exit if the player does not exist for some reason at this point
        if (!this.game.player) {
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

        // Update beaming geometry
        if (this.attackStatus === "Beaming") {
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
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.animationBank[1].spritePath),
                this.animationBank[1].animXStart, this.animationBank[1].animYStart, this.animationBank[1].animW,
                this.animationBank[1].animH, this.animationBank[1].animFCount, this.animationBank[1].animFDur);
        }
        // If we are in phase two and not moving, use the idle sprite for fallen
        else if (this.movementSpeed === 0 && this.phaseTwoActivated && !this.animator.spritesheet.src.includes(this.animationBank[0].spritePath.replace(/^\./, ""))) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.animationBank[0].spritePath),
                this.animationBank[0].animXStart, this.animationBank[0].animYStart, this.animationBank[0].animW,
                this.animationBank[0].animH, this.animationBank[0].animFCount, this.animationBank[0].animFDur);
        }

        // Track the marker an offset amount behind the player (this way the entity charges 'through' where the player was)
        if (this.trackMode && this.targetMarker) {
            if (!this.attackStatus.toLowerCase().includes("charg")) {
                const playerCenter = this.game.player.calculateCenter();

                // Define the offset distance and direction behind the player
                const offsetDistance = 1500; // Adjust this value as needed
                const directionToPlayer = this.calcTargetAngle(this.game.player); // Assuming this method returns a normalized direction vector
                const targetMarkerTargetX = ((playerCenter.x - 50) + directionToPlayer.x * offsetDistance);
                const targetMarkerTargetY = ((playerCenter.y + 50) + directionToPlayer.y * offsetDistance);

                // Apply dampened movement towards the target position
                this.applyDampenedMovement(targetMarkerTargetX, targetMarkerTargetY);
            }
            // If charging use more direct targeting
            else {
                // Track the marker an offset amount behind the player (this way the entity charges 'through' where the player was)

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
                const offsetDistance = -500; // Negative value to place marker behind the player

                // Calculate new position for the marker
                // Subtracting because we're moving in the opposite direction of the normalized vector
                this.targetMarker.worldX = playerCenter.x - (normX * offsetDistance) - 50;
                this.targetMarker.worldY = playerCenter.y - (normY * offsetDistance) - 50;
            }
        }

        // Play random creature sounds if not yet attacking
        if (this.attackStatus === "none" && currentTime - this.lastRandomSound >= this.randomSoundCooldown) {
            ASSET_MANAGER.playAsset(this.creatureSoundBank[Math.round(Math.random() * this.creatureSoundBank.length-1)], 0.22);
            this.lastRandomSound = currentTime;
        }

        // Determine the direction to face based on the target's position
        // We don't need to do this while beaming/preparing to beam (avoids boss flickering around)
        if (!this.enterLaserAttackMode) {
            if (this.targetMarker.worldX < this.worldX) {
                // Target is to the left, face left
                this.lastMove = "left";

                if (this.wingsEntity) {
                    this.wingsEntity.lastMove = "right";
                }
            } else if (this.targetMarker.worldX > this.worldX) {
                // Target is to the right, face right
                this.lastMove = "right";

                if (this.wingsEntity) {
                    this.wingsEntity.lastMove = "left";
                }
            }
        }

        const targetDirection = this.calcTargetAngle(this.targetMarker);

        // Check if it's time to enter an attack mode again
        if (this.attackStatus === "none" && currentTime - this.lastAttackCheckTime >= this.attackModeCooldown) {
            // Attempt phase 1 attacks
            if (!this.enterPhaseTwo && !this.phaseTwoActivated) {
                // Attempt to enter last beam attack mode
                if (currentTime - this.lastLaserBeamAttackTime >= this.laserAttackCooldown) {
                    this.enterLaserAttackMode = true;
                }
            }
            // Attempt phase 2 attacks
            else if (this.phaseTwoActivated && !this.enterSummAttackMode) {
                if (currentTime - this.lastChargeAttackTime >= this.chargeAttackCooldown) {
                    this.enterChargeMode = true;
                }
            }

            // // Attempt to summon attack (call allies)
            // if (!this.enterChargeMode && currentTime - this.lastSummAttackTime >= this.summAttackCooldown) {
            //     this.enterSummAttackMode = true;
            // }

            this.lastAttackCheckTime = currentTime;
        }

        // If boss have any active attack status, it should not be allowed
        if (this.attackStatus !== "none") {
            this.relocateMode = false;
        } else {
            this.relocateMode = true;
        }

        // Attempt to enter phase two
        if (this.enterPhaseTwo) {
            this.startPhaseTwo();
        }

        // Attempt Laser Beam Eye attack
        if (this.enterLaserAttackMode) {
            this.performLaserBeamAttack();
        }

        // Attempt Charge attack
        if (this.enterChargeMode) {
            this.performChargeAttack();
        }

        // Attempt Summon attack
        if (this.enterSummAttackMode) {
            this.performSummAttack();
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

    /** This method performs all the necessary actions to start phase two. */
    startPhaseTwo() {
        if (this.phaseTwoActivated) return;

        this.game.SPAWN_SYSTEM.spawnWithBoss = true;

        this.lastAttackCheckTime = this.game.elapsedTime / 1000;

        // Immediately stop any laser beam attack preparations or actions
        if (this.enterLaserAttackMode || this.attackStatus === "Beaming" || this.attackStatus === "Preparing to Beam") {
            // Reset laser beam attack variables
            this.enterLaserAttackMode = false;
            this.attackStatus = "none";
            this.beamingStartTime = -1;

            // Stop any laser beam sound effects
            // ASSET_MANAGER.stopAsset(this.laserChargingSound);
            // ASSET_MANAGER.stopAsset(this.laserBeamingSound);

            // Reset visual effects associated with the laser beam attack
            this.animator.outlineMode = false;
            this.animator.outlineBlur = 0;
            this.beamGeometry = { isActive: false };

            // Ensure the tracking mode is reset
            this.trackMode = true;
        }

        // Stop the boss from being able to move
        this.movementSpeed = 0;

        // Apply the broken wings animation/entity
        if (this.wingsEntity !== null) {
            this.immune = true; // Make boss immune to damage during the transition

            ASSET_MANAGER.playAsset(this.goreSound, 0.15);
            ASSET_MANAGER.playAsset(this.hurtSound, 0.15);

            let newWingEntity = this.game.addEntity(new Entity(1, 1, 0, this.game,
                this.wingsEntity.worldX, this.wingsEntity.worldY, 25, 25, "wingsEntity", 0,
                "./sprites/god_wings_broken.png", 0, 0, 498, 415, 5, 0.2, 2.5, 0));
            newWingEntity.animator.pauseAtSpecificFrame(4);

            this.wingsEntity.removeFromWorld = true;
            this.wingsEntity = null;
        }

        // Apply the falling animation to the boss
        if (this.animator.spritesheet !== ASSET_MANAGER.getAsset(this.animationBank[2].spritePath)) {
            this.eyeBallEntity.animator.pauseAtFrame(50); // Set eyeball entity to invisible since the animation has the eye on it
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.animationBank[2].spritePath),
                this.animationBank[2].animXStart, this.animationBank[2].animYStart, this.animationBank[2].animW,
                this.animationBank[2].animH, this.animationBank[2].animFCount, this.animationBank[2].animFDur);
            this.animator.pauseAtSpecificFrame(this.animationBank[2].animFCount - 1);

            // Adjust the bounding box to match
            this.boundingBox.yOffset = 100;
            this.boundingBox.width *= 1.33;
            this.boundingBox.height /= 1.75;
        }
        else if (this.animator.currentFrame() === 9) {
            this.movementSpeed = this.initialMovementSpeed * 2.75;
            this.initialMovementSpeed = this.movementSpeed;
            this.animationBank[0] = this.animationBank[3]; // Set the idle to the fallen idle anim
            this.animationBank[1] = this.animationBank[4]; // Set the walk to the fallen walk anim

            this.animator.pauseAtFrame(-1);

            // Reveal the eyeball entity again
            this.eyeBallEntity.followEntity(this, 45, 150, true); // Re-track to new location

            // Set the attack CDs for phase two attacks
            this.lastChargeAttackTime = this.game.elapsedTime / 1000;
            this.immune = false; // Make boss damage-able again
            this.phaseTwoActivated = true; // We are done entering phase two
        }
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

            ASSET_MANAGER.playAsset(this.laserChargingSound, 0.15);

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
            ASSET_MANAGER.playAsset(this.laserBeamingSound, 0.2);
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

    /** Call this method to perform the charge attack. */
    performChargeAttack() {
        const currentTime = this.game.elapsedTime / 1000;

        if (this.attackStatus === "none") {
            this.attackStatus = "Preparing to Charge";
            //this.movementSpeed = 0; // Stop the entity in place

            // First, we need to enter the prepare to charge stance animation
            this.targetMarker.animator.pauseAtFrame(-1);
        }

        // Decay movement each cooldown while preparing to charge
        if (this.attackStatus === "Preparing to Charge" && currentTime - this.lastMovementDecay >= this.decayMovementCooldown) {
            this.movementSpeed -= this.decayMovementAmount;
            if (this.movementSpeed < 0) this.movementSpeed = 0; // Normalize to 0 if it goes below
            this.lastMovementDecay = currentTime;
        }

        // After this.chargeDelayTime has passed we need to actually enter the charge sprite animation and give the boss its charge movement speed.
        // If the tempTimer is === -1 then we need to set it to current time to start the timer
        if (this.tempTimer === -1) {
            this.tempTimer = currentTime;
        }
        if (this.attackStatus === "Preparing to Charge" && (currentTime - this.chargeDelayTime >= this.tempTimer)) {
            this.trackMode = false;
            this.tempTimer = -1;
            this.attackStatus = "Charging"
            this.movementSpeed = this.initialMovementSpeed*3;
            this.targetMarker.animator.pauseAtFrame(10);
        }

        // After we reach the target destination, turn off charge mode, set movespeed = 0, and set animation to standing
        if (this.attackStatus === "Charging") {
            const bossCenterX = this.worldX + this.animator.width/2;
            const bossCenterY = this.worldY + this.animator.height/2;

            const markerCenterX = this.targetMarker.worldX + this.targetMarker.animator.width/2;
            const markerCenterY = this.targetMarker.worldY + this.targetMarker.animator.height/2;

            const distanceX = Math.abs(Math.abs(bossCenterX - markerCenterX) - 15);
            const distanceY = Math.abs(bossCenterY - markerCenterY);
            const proximity = 25;

            // Check if in proximity of target yet, if so then stop the charge and return to normal stance
            if (distanceX < proximity && distanceY < proximity) {
                this.trackMode = true;
                this.movementSpeed = this.initialMovementSpeed;
                this.tempTimer = -1;
                this.attackStatus = "none";
                this.enterChargeMode = false;
                this.lastChargeAttackTime = currentTime;
            }
        }
    }

    performSummAttack() {
        const currentTime = this.game.elapsedTime / 1000;

        if (this.attackStatus !== "Summoning") {
            this.summAttackStartTime = currentTime;
            this.attackStatus = "Summoning";
            this.animator.outlineColor = "purple";
            this.animator.outlineMode = true;
            this.animator.outlineBlur = 25;
            this.relocateMode = false;
            this.trackMode = false;
            this.movementSpeed = 0;
            // Switch sprite animation to idle (if not already set)
            if (!this.animator.spritesheet.src.includes(this.animationBank[0].spritePath.replace(/^\./, ""))) {
                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.animationBank[0].spritePath), this.animationBank[0].animXStart, this.animationBank[0].animYStart, this.animationBank[0].animW, this.animationBank[0].animH, this.animationBank[0].animFCount, this.animationBank[0].animFDur);
            }
            ASSET_MANAGER.playAsset(this.summonSound, 0.4, 0.75);

            for(let i = 0; i < this.summAttackBigEnemyCount; i++) {
                let {x: randomXNumber, y: randomYNumber} = this.game.randomOffscreenCoords();
                let enemy = this.game.SPAWN_SYSTEM.chargerEnemyTypes[3];

                this.game.addEntity(new Enemy_Charger(enemy.name, enemy.maxHP,
                    enemy.currHP, enemy.atkPow, this.game, randomXNumber, randomYNumber,
                    enemy.boxWidth, enemy.boxHeight, enemy.boxType,
                    enemy.speed, enemy.spritePath, enemy.animXStart,
                    enemy.animYStart, enemy.animW, enemy.animH,
                    enemy.animFCount, enemy.animFDur, enemy.scale, enemy.chargeSpritePath,
                    enemy.chargeAnimXStart, enemy.chargeAnimYStart, enemy.chargeAnimW,
                    enemy.chargeAnimH, enemy.chargeAnimFCount, enemy.chargeAnimFDur, enemy.chargeScale,
                    enemy.exp, enemy.fleeDist, enemy.approachDist));

                console.log("BIG:HP="+enemy.maxHP+", DMG="+enemy.atkPow);
            }

            for(let i = 0; i < this.summAttackSmallEnemyCount; i++) {
                let {x: randomXNumber, y: randomYNumber} = this.game.randomOffscreenCoords();
                let enemy = this.game.SPAWN_SYSTEM.contactEnemyTypes[2];

                this.game.addEntity(new Enemy_Contact(enemy.name, enemy.maxHP,
                    enemy.currHP, enemy.atkPow, this.game, randomXNumber, randomYNumber,
                    enemy.boxWidth, enemy.boxHeight, enemy.boxType,
                    enemy.speed, enemy.spritePath, enemy.animXStart,
                    enemy.animYStart, enemy.animW, enemy.animH,
                    enemy.animFCount, enemy.animFDur, enemy.scale, enemy.chargeSpritePath,
                    enemy.chargeAnimXStart, enemy.chargeAnimYStart, enemy.chargeAnimW,
                    enemy.chargeAnimH, enemy.chargeAnimFCount, enemy.chargeAnimFDur, enemy.chargeScale,
                    enemy.exp, enemy.fleeDist, enemy.approachDist));

                console.log("SMALL:HP="+enemy.maxHP+", DMG="+enemy.atkPow);
            }
        }

        if (currentTime - this.summAttackStartTime >= this.summAttackDuration) {
            this.summAttackCooldown = Math.max(this.summAttackCooldown - 1, 2);
            // this.summAttackBigEnemyCount += 1;
            // this.summAttackSmallEnemyCount += 4;
            this.animator.outlineColor = "white";
            this.animator.outlineMode = false;
            this.animator.outlineBlur = 10;
            this.enterSummAttackMode = false;
            this.lastSummAttackTime = currentTime;
            this.movementSpeed = this.initialMovementSpeed; // Let the entity move again
            this.relocateMode = true;
            this.trackMode = true;
            this.attackStatus = "none";
        }
    }

    applyDampenedMovement(targetX, targetY) {
        // Calculate distance between boss and player for dampening adjustment
        const playerCenter = this.game.player.calculateCenter();
        const bossCenter = this.calculateCenter();
        const distanceToPlayer = Math.sqrt(Math.pow(bossCenter.x - playerCenter.x, 2) + Math.pow(bossCenter.y - playerCenter.y, 2));

        // Adjust lerp speed based on distance (the closer the player, the slower the tracking)
        const lerpSpeedAdjustmentFactor = Math.max(0.002, 0.0185 - distanceToPlayer * 0.00001); // Example scaling

        let lerpSpeed = 0.0185; // Control how quickly the marker catches up to the target position (0.01 to 0.1 are reasonable values)
        if (this.phaseTwoActivated) lerpSpeed = 0.002; // Phase two has a lot of movement speed, but boss can hardly control it's turning

        // Linearly interpolate (lerp) the targetMarker's position towards the target position
        this.targetMarker.worldX += (targetX - this.targetMarker.worldX) * lerpSpeedAdjustmentFactor;
        this.targetMarker.worldY += (targetY - this.targetMarker.worldY) * lerpSpeedAdjustmentFactor;
    }

    /** This method controls how damage is dealt through bounding box collisions with this entity. */
    checkCollisionAndDealDamage() {
        const player = this.game.player;
        const currentTime = this.game.elapsedTime / 1000;

        // Check collision and cooldown
        if (this.boundingBox.isColliding(player.boundingBox) && currentTime - this.lastCollisionAttackTime >= this.collisionAttackCooldown) {
            if (this.attackStatus === "Charging") {
                player.takeDamage(this.chargeDamage);
            } else {
                player.takeDamage(this.atkPow);
            }
            this.lastCollisionAttackTime = currentTime; // Update last attack time
        }
    }

    takeDamage(amount, attackType = "") {
        if (this.immune) {
            this.game.addEntity(new Floating_text(this.game, -1, this.calculateCenter().x, this.calculateCenter().y, false,
                this instanceof Player || this.boundingBox.type.includes("ally"), false));
            this.animator.damageSprite(100);
            return;
        }

        super.takeDamage(amount, attackType);
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
        //this.wingsEntity.draw(ctx, game);

        // Draw charge indicator
        if (this.attackStatus === "Charging" || this.attackStatus === "Preparing to Charge") {
            const targetCenter = {
                x: this.targetMarker.worldX + (this.targetMarker.animator.width / 2),
                y: this.targetMarker.worldY + (this.targetMarker.animator.height / 2),
            };

            const startPoint = {
                x: this.worldX + (this.animator.width / 2),
                y: this.worldY + (this.animator.height / 2) + 150, // 150 offset for fallen sprite
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

            const shadedHeight = 200; // Height for the shaded area
            ctx.fillRect(0, -shadedHeight / 2, actualChargeDistance, shadedHeight); // Draw the rectangle

            ctx.restore(); // Restore the canvas to its original state
        }

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