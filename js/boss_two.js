class BossTwo extends Entity {

    constructor(game, worldX, worldY) {
        super(3000, 3000, 20,
            game, worldX, worldY,
            80, 55, "enemyBoss",
            100,
            "./sprites/boss_dragon_walk.png",
            0, 0, 542/4, 98, 4, 0.2, 3.5,
            -1);

        this.name = "Gold-Dragon the Mirthful";
        this.shootRange = 1000;
        this.lastMove = "left"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves
        this.boundingBox.drawBoundingBox = false;

        // Properties to track cooldown of being able to damage the player
        this.projectileAttackCooldown = 0.5;    // in seconds
        this.attackCooldown = 1;
        this.lastAttackTime = 0;    // time since last attack
        this.downTime = 6 * 60; // the amount of time that must pass before roaring

        this.pushbackVector = { x: 0, y: 0 };
        this.pushbackDecay = 0.9; // Determines how quickly the pushback force decays

        this.projectileSpeed = 25;
        this.projectileSize = 25;
        this.pulse = false;
        this.projectileCount = 1;
        this.projectileSpread = 25; // the angle of range the projectiles are fired in evenly
        this.projectilePow = 10;    // how much damage each projectile does. changes with the patterns
        this.projectileDuration = 3; // how long each projectile should last
        this.projectileScale = 2;

        // used for determining movement in calcDist
        this.closestDist = 350;
        this.furthestDist = 600;
        this.approaching = false;

        this.anchorX = worldX;
        this.anchorY = worldY;

        this.attackCount = 0; // refers to how many attacks we have left before switching to normal mode. handled in pattern
        this.maxRoarTime = 0;  // how long we must continue to roar before switching to attack mode. handled in pattern
        this.currRoarTime = 0;

        this.lastRoarTime = 0;
        this.lastWalkTime = 0;
        this.lastAttackTime = 0;
        //this.currentRoarTime = 0; // how long we've been roaring, once it reaches maxRoarTime, switch to attacking mode


        //console.log("wX = " + worldX + "; wY = " + worldY +"\n" + "aX = " + this.anchorX + "; aY = " + this.anchorY);

        // normal = moving around, firing some projectiles occasionally
        // roaring = staying put, shaking a little, not firing
        // attacking = locked in attack animation cycle, casting special attack pattern
        this.mode = "normal";
        this.changeMode("normal");   // debugging

        // determines which attack pattern will be used for an attack mode
        this.changePattern(0);
        this.pattern = 0;   // debug value

        this.roarStartTime = 0;
        this.roarDuration = 0.5;
        this.downTimeStartTime = 0;
        this.downTimeDuration = 6;
        this.roarShakeCooldown = 1/60;
        this.roarShakeStartTime = 0;
        this.canBePushedBack = false;

        // Stuff for boss health bar calculations
        /** The rate at which the recent damage decays per second after 1 sec of no new damage. */
        this.damageDecayRate = 7500;
        /** Game time when the last damage was taken. */
        this.lastDamageTime = 0;
        /** Time in seconds before recent damage (yellow HP) starts to decay. */
        this.damageDecayDelay = 0.1;

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
    // this is the movement pattern for enemies that just approach the player
    update() {
        if(!this.initialized) {
            // Scale this boss to the difficulty scale
            this.maxHP = Math.round(this.maxHP * this.game.SPAWN_SYSTEM.DIFFICULTY_SCALE);
            this.currHP = this.maxHP;
            this.atkPow = Math.round(this.atkPow * this.game.SPAWN_SYSTEM.DIFFICULTY_SCALE);

            this.initialized = true;
        }

        super.update();

        const currentTime = this.game.elapsedTime / 1000;

        // Decrease recent damage over time (for boss health bar calculations)
        if (currentTime - this.lastDamageTime > this.damageDecayDelay && this.recentDamage > 0) {
            const timeSinceLastDamage = currentTime - this.lastDamageTime - this.damageDecayDelay;
            const decayAmount = this.damageDecayRate * (timeSinceLastDamage / 1000); // Calculate decay based on time passed
            this.recentDamage = Math.max(0, this.recentDamage - decayAmount); // Ensure recentDamage does not go negative
            if (this.recentDamage === 0) {
                this.lastDamageTime = currentTime; // Reset last damage time to prevent continuous decay
            }
        }

        // Early exit if the player does not exist for some reason at this point
        if (!this.game.player) {
            return;
        }

        // If health hits 0 or below, this entity is declared dead
        if (this.isDead) {
            // Spawn a portal to rest area (because map is completed once boss is dead)
            this.game.spawnPortal(0, 0);

            // Set the gameengine to roundOver
            this.game.roundOver = true;
            this.game.killAllEnemies();
            this.game.spawnEndChest();
            this.removeFromWorld = true;

            return;
        }

        //console.log("X = " + this.worldX + "; Y = " + this.worldY);

        if (this.mode === "roaring") {
            this.shake();
        }

        // Apply pushback
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
        if (player.worldX < this.worldX + this.animator.width/2) {
            // Player is to the left, face left
            this.lastMove = "right";
        } else if (player.worldX > this.worldX + this.animator.width/2) {
            // Player is to the right, face right
            this.lastMove = "left";
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

        // if in attack mode with attacks remaining, attack
        if (this.mode === "attacking" && this.attackCount > 0) {
            this.castProjectile();
        }
        // // if (this.mode === "roaring") {
        // //     this.currRoarTime--;
        // // }
        //
        // // If it's time to stop down time, set flag
        // if (this.mode === "normal") {
        //     this.downTime--;
        // }
        // if we are out of attacks and in attack mode, go back to normal
        if (this.attackCount <= 0 && this.mode === "attacking") {
            this.changeMode("normal");
            // TODO make this health based
            if (this.pattern < 4) {
                this.pattern++;
            }
            this.changePattern(this.pattern);
        }
        // if we are out of roar time, and in roar mode, switch to attack mode
        if ((currentTime - this.roarStartTime >= this.roarDuration) && this.mode === "roaring") {
            this.changeMode("attacking");
            // changemode handles roar times
        }
        // if we have had enough downtime, begin roaring
        if ((currentTime - this.downTimeStartTime >= this.downTimeDuration) && this.mode === "normal") {
            this.changeMode("roaring");
            // this.currRoarTime = this.maxRoarTime;

        }

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
        //console.log("dist: " + dist);

        // when too far from player, will advance up until a certain point and will not advance again until too far away
        if (dist < this.closestDist) { // A range
            spacing = 0;
            this.approaching = false;
        }
        if (dist > this.closestDist && dist < this.furthestDist) {  // B range
            if (this.approaching) {
                spacing = 1;
            } else {
                spacing = 0;
            }
        }
        if (dist > this.furthestDist) { // C range
            spacing = 1;
            this.approaching = true;
        }
        return spacing;
    }

    checkCollisionAndDealDamage() {
        const player = this.game.player;
        const currentTime = this.game.elapsedTime / 1000;

        // Check collision and cooldown
        if (this.boundingBox.isColliding(player.boundingBox) && currentTime - this.lastAttackTime >= this.attackCooldown) {
            //console.log("Collision!");
            player.takeDamage(this.atkPow);
            this.lastAttackTime = currentTime; // Update last attack time
        }
    }
    castProjectile() {
        let currentTime = this.game.elapsedTime / 1000;
        if (currentTime - this.lastAttackTime >= this.projectileAttackCooldown) {

            const centerOfEntity = this.calculateCenter();

            // Define the frame at which the projectile should be spawned
            const shootingFrame = 4; // for example, spawn projectile on the 4th frame of the animation

            let currentTime = this.game.elapsedTime / 1000;
            // Check if the current frame is the shooting frame and if enough time has passed since the last attack
            if (currentTime - this.lastAttackTime >= this.projectileAttackCooldown) {
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
                    // I wish this was easier to figure out
                    if (this.projectileCount > 1) {
                        angle = (attackAngle -
                            0.01745329 * (((this.projectileSpread/(this.projectileCount-1))* i))
                        );
                    }

                    dx = Math.cos(angle) * offsetDistance;
                    dy = Math.sin(angle) * offsetDistance;

                    // Adjust the projectile's starting position to be the center of the entity
                    let projectileX = centerOfEntity.x - this.projectileSize / 2; // Center the projectile on the X axis
                    let projectileY = centerOfEntity.y - this.projectileSize / 2; // Center the projectile on the Y axis

                    let newProjectile = this.game.addEntity(new Projectile(this.game, this.projectilePow,
                        projectileX, projectileY, 10, 10, "enemyAttack", this.projectileSpeed,
                        "./sprites/MagicBall_red.png",
                        0, 0, 30, 30, 2, 0.2, this.projectileScale, dx, dy,
                        this.projectileDuration, this.projectileSize, 1, 0, 0.3));
                    newProjectile.pulsatingDamage = this.pulse;


                    // randomize the fire breath pattern
                    if (this.pattern === 1) {
                        this.projectileSize = Math.random()*25;
                        this.projectileCount = 2 + Math.floor(Math.random()*4);
                        this.projectileSpread = 10 + Math.floor(Math.random()*90);
                    }

                }
                this.attackCount--; // used an attack in its current amount of attacks in this pattern
                this.lastAttackTime = currentTime; // Update last attack time
            }
        }
    }

    // 0 = spread of 5 projectiles to player
    // 1 = more random fire aimed near player
    // 2 = light 360 spread
    // 3 = giant slow pulse ball
    // 4 = very thicc 360 spread, the final attack
    changePattern (patternNum) {
        this.pattern = patternNum; // might not need
        switch(patternNum){
            case 0:
                this.roarDuration = 0.5;
                this.projectileAttackCooldown = 0.5;
                this.attackCount = 5; // how many times this attack happens
                this.projectileSpeed = 25;
                this.projectileSize = 25;
                this.pulse = false;
                this.projectileCount = 5;
                this.projectileSpread = 50;
                this.projectilePow = 8;
                this.projectileDuration = 3;
                this.projectileScale = 2;
                break;
            case 1:
                this.roarDuration = 2.5;
                this.projectileAttackCooldown = 0.10;
                this.attackCount = 35;
                this.projectileSpeed = 35;
                this.projectileSize = Math.random()*25;
                this.pulse = false;
                this.projectileCount = 2 + Math.floor(Math.random()*4);
                this.projectileSpread = 10 + Math.floor(Math.random()*55);
                this.projectilePow = 3;
                this.projectileDuration = 4;
                this.projectileScale = 2;
                break;
            case 2:
                this.roarDuration = 4;
                this.projectileAttackCooldown = 1;
                this.attackCount = 5;
                this.projectileSpeed = 50;
                this.projectileSize = 20;
                this.pulse = false;
                this.projectileCount = 25;
                this.projectileSpread = 360;
                this.projectilePow = 10;
                this.projectileDuration = 1.5;
                this.projectileScale = 2;
                break;
            case 3:
                this.roarDuration = 4.5;
                this.projectileAttackCooldown = 5;
                this.attackCount = 1;
                this.projectileSpeed = 15;
                this.projectileSize = 250;
                this.pulse = true; // can we fix this?
                this.projectileCount = 1;
                this.projectileSpread = 0;
                this.projectilePow = 10;
                this.projectileDuration = 7;
                this.projectileScale = 15;
                break;
            case 4:
                this.roarDuration = 5.5;
                this.projectileAttackCooldown = 0.4;
                this.attackCount = 3;
                this.projectileSpeed = 29;
                this.projectileSize = 50;
                this.pulse = false;
                this.projectileCount = 100;
                this.projectileSpread = 360;
                this.projectilePow = 8;
                this.projectileDuration = 4;
                this.projectileScale = 2;
                break;
        }
    }

    // changes the mode of the dragon, quickly provides relevant spritesheet info
    changeMode(mode) {
        //console.log(this.mode);
        if (this.mode !== mode) {
            switch (mode) {
                case "normal":
                    this.worldX = this.anchorX;
                    this.worldY = this.anchorY;
                    this.animator.changeSpritesheet(
                        ASSET_MANAGER.getAsset("./sprites/boss_dragon_walk.png"),
                        0, 0, 542 / 4, 98, 4, 0.2);
                    //console.log("normal mode");
                    this.mode = mode;
                    // this.downTime = 6 * 60;
                    this.downTimeStartTime= this.game.elapsedTime / 1000;
                    break;
                case "roaring":
                    this.anchorX = this.worldX;
                    this.anchorY = this.worldY;
                    this.animator.changeSpritesheet(
                        ASSET_MANAGER.getAsset("./sprites/boss_dragon_roar.png"),
                        0, 0, 144, 98, 1, 1);
                    //console.log("roaring mode");
                    this.mode = mode;
                    ASSET_MANAGER.playAsset("./sounds/dragon_roar.mp3");
                    this.roarStartTime = this.game.elapsedTime / 1000;
                    break;
                case "attacking" :
                    this.worldX = this.anchorX;
                    this.worldY = this.anchorY;
                    this.animator.changeSpritesheet(
                        ASSET_MANAGER.getAsset("./sprites/boss_dragon_roar.png"),
                        144, 0, 140, 124, 3, 0.2);
                    //console.log("attacking mode");
                    this.mode = mode;
                    break;
            }
        }
    }

    shake() {
        const currentTime = this.game.elapsedTime / 1000;
        if (currentTime - this.roarShakeStartTime >= this.roarShakeCooldown && this.mode === "roaring") {
            this.worldX = this.anchorX + Math.floor((Math.random() * 10)) - Math.floor((Math.random() * 10));
            this.worldY = this.anchorY + Math.floor((Math.random() * 10)) - Math.floor((Math.random() * 10));
            this.roarShakeStartTime = currentTime;
        }
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
}