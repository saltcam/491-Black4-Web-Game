/**
 * Player is our main character. He can move up down left and right on the map.
 * Player will be able to perform primary (left click) attacks, and secondary (right click) attacks.
 * Player can also dash using spacebar.
 * For McIdle.png, use width of 32, height of 28, frameCount of 2, and frameDuration of 0.5, scale 2.2
 * For McWalk.png, use width of 32, height of 28, frameCount of 8, and frameDuration of 0.1, scale 2.2
 * For McDash.png, use width of 32, height of 28, frameCount of 2, and frameDuration of 0.1, scale 2.2
 */
class Player extends Entity {

    constructor(game) {
        super(100, 100, 25, game, 0, 0,
            17, 29, "player", 160,
            "./sprites/McIdle.png",
            0, 0, 32, 28, 2, 0.5, 2.2, 0);

        // if adding a special upgrade, make that first so when index checking, nothing gets offset due to splicing.
        this.upgrades = [
            new Upgrade("Health +10", "(Stackable, Additive).", false, "./sprites/upgrade_max_health.png"),
            new Upgrade("Health Regen CD -20%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_health_regen.png"),
            new Upgrade("Dash CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_dash_cooldown.png"),
            new Upgrade("Movement Speed +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_movement_speed.png"),
            new Upgrade("Attack Damage +7.5%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_attack_damage.png"),
            new Upgrade("Pickup Range +30%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_pickup_range.png"),
            new Upgrade("Dash Duration +15%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_dash_distance.png"),
            new Upgrade("Crit Damage +20%", "(Stackable, Additive).", false, "./sprites/upgrade_crit_damage.png"),
            new Upgrade("Crit Chance +5%", "(Stackable, Additive).", false, "./sprites/upgrade_crit_chance.png"),
            new Upgrade("Experience Gain +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_exp_gain.png"),
            new Upgrade("Tombstone Chance +5%", "(Passive, Stackable, Additive).", false, "./sprites/upgrade_tomb_chance.png", 50),
            // TODO need assets for these
            new Upgrade("Extra Life", "Fully heal instead of dying (Once).", false, "./sprites/upgrade_tomb_chance.png", 1000),
            new Upgrade("Missingno", "(Unique) Drop tomb every 10s.", true, "./sprites/upgrade_tomb_chance.png", 1000),
            new Upgrade("It's what you do with it", "(Unique) 50% smaller.", false, "./sprites/upgrade_tomb_chance.png", 1000),
            new Upgrade("Smoke Bomb", "(Unique) Explode at end of dash.", true, "./sprites/upgrade_tomb_chance.png", 1000),
            // based on hades, maybe grab asset from there?
            new Upgrade("Divine Dash", "(Unique) Dash reflects projectiles.", true, "./sprites/upgrade_divine_dash.png", 1000),
            // based on vampire survivors, feel free to grab the sprite from there.
            new Upgrade("Glorious Moon", "(Unique) Suck all EXP every 2 minutes.", true, "./sprites/upgrade_glorious_moon.png", 1000)
        ];

        this.debugName = "Player";

        // Animation settings
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves

        // Dash implementation
        this.dashCooldown = 2;   // This is the actual cooldown of dash that will be used each time we dash
        this.dashSpeedMultiplier = 3;
        this.dashDuration = 0.5;
        this.lastDashTime = this.game.elapsedTime - (this.dashCooldown * 2); // Tracks when the last dash happened
        this.lastDashTimeVar = this.lastDashTime; // This is purely for a UI purpose, don't mind it in the actual mechanics of how Dashing works

        // Regen 1 health per this many seconds
        this.healthRegenTime = 3.5;
        this.timeSinceLastHealthRegen = 0;

        this.score = 0;
        this.gold = 0;
        this.level = 1;
        this.expGain = 1; // EXP Gain multiplier
        this.goldGain = 1;

        // weapon handling
        this.allowWeaponSwitch = true;
        // new Weapon_scytoff(game) // special cheat weapon
        this.weapons = [new Weapon_scythe(game), new Weapon_tome(game), new Weapon_staff(game)];
        // index for current weapon: Weapon_scythe = 0; Weapon_tome = 1; Tome = 2;
        this.currentWeapon = 0;
        this.weaponSwitchCooldown = 0.4; // Cooldown time in seconds to prevent rapid switching
        this.lastWeaponSwitchTime = 0;
        this.controlsEnabled = true;    // If false, player cannot input controls.
        this.pickupRange = 125;

        this.menuInvincibility = false; // Auto-set to true for a bit  after exiting a menu, gives iFrames
        this.isDashing = false; // Auto-set to true while dashing, gives iFrames

        this.critChance = 0.05; // 5% chance to deal crit damage
        this.critDamage = 1.5; // 1.5x damage on crits

        // Set this to true to give the player iFrames (Frames of Invincibility)
        // Only used when dashing, and right after exiting upgrade menus
        this.invincible = false;

        // For stats tracking
        this.initialAtkPow = this.atkPow;
        this.initialPickupRange = this.pickupRange;
        this.initialExpGain = this.expGain;

        this.lives = 1; // start with 1 extra life.
        // Store a bank of all possible gold pickup sound effects
        this.pickupSoundBank = [
            "./sounds/Coin_Pickup1.mp3",
            "./sounds/Coin_Pickup2.mp3",
            "./sounds/Coin_Pickup3.mp3"
        ];
        this.dashSound = "./sounds/dash.mp3";
        this.gainExpSoundBank = [
            "./sounds/collect_exp5.mp3",
            "./sounds/collect_exp10.mp3",
            "./sounds/collect_exp15.mp3",
            "./sounds/collect_exp20.mp3",
            "./sounds/collect_exp25.mp3",
            "./sounds/collect_exp30.mp3",
            "./sounds/collect_exp35.mp3",
            "./sounds/collect_exp40.mp3",
            "./sounds/collect_exp45.mp3",
            "./sounds/collect_exp50.mp3",
            "./sounds/collect_exp55.mp3",
            "./sounds/collect_exp60.mp3",
            "./sounds/collect_exp65.mp3",
            "./sounds/collect_exp70.mp3",
            "./sounds/collect_exp75.mp3",
            "./sounds/collect_exp80.mp3",
            "./sounds/collect_exp85.mp3",
            "./sounds/collect_exp90.mp3",
            "./sounds/collect_exp95.mp3",
            "./sounds/collect_exp100.mp3",
        ];
        this.levelupSound = "./sounds/levelup.mp3";


        // for summons, and prevent the need to check weapons for it since not all weapons can summon
        this.summonHealth = 25;
        this.summonSpeed = 210;
        // this.summonDamage = 15;
        this.graveWalkCount = 0;
        this.tombstoneChance = 0.33; // default is 0.33

        this.lastGraveWalkTime = 0;
        this.lastMoonTime = 0;

        // this.upgrades[12].active = true; // gravewalker
        // this.upgrades[16].active = true;
        // this.handleUpgrade();

        // Turn off bad upgrades
        this.upgrades[9].relevant = false; // Turn off EXP upgrade (too OP)
        this.upgrades[12].relevant = false; // Turn off Gravewalker (replaced summon damage elsewhere)
    };

    // Handles code for turning on upgrades (Generic and Specific)
    handleUpgrade() {
        for (let i = 0; i < this.upgrades.length; i++) {
            // If generic has been turned on
                if (this.upgrades[i].active && !this.upgrades[i].special) {
                    //let remove = false;
                    switch (this.upgrades[i].name) {
                        case "Health +10":
                            this.maxHP += 10;
                            this.heal(10);
                            break;
                        case "Health Regen CD -20%":
                            this.healthRegenTime *= 0.8;
                            break;
                        case "Dash CD -10%":
                            this.dashCooldown *= 0.9;

                            // If we hit 1 sec CD on dash remove this upgrade as an option in for the future
                            if (this.dashCooldown <= 1) {
                                this.upgrades[i].relevant = false
                            }
                            break;
                        case "Movement Speed +10%":
                            this.movementSpeed *= 1.1;
                            break;
                        case "Attack Damage +7.5%":
                            this.atkPow *= 1.075;
                            break;
                        case "Pickup Range +30%":
                            this.pickupRange *= 1.3;
                            break;
                        case "Dash Duration +15%":
                            this.dashDuration *= 1.15;

                            // If we hit 2.5 sec duration on dash remove this upgrade as an option in for the future
                            if (this.dashDuration >= 3) {

                                this.upgrades[i].relevant = false
                            }
                            break;
                        case "Crit Damage +20%":
                            this.critDamage += 0.2;
                            break;
                        case "Crit Chance +5%":
                            this.critChance += 0.05;

                            // If we hit 100% crit chance, this upgrade shouldn't be shown anymore
                            if (this.critChance >= 1) {
                                this.upgrades[i].relevant = false
                            }
                            break;
                        case "Experience Gain +10%":
                            this.expGain *= 1.1;
                            break;
                        case "Tombstone Chance +5%":
                            this.tombstoneChance += 0.05;
                            // If we hit 100% tombstone chance, remove this upgrade as an option for the future
                            if (this.tombstoneChance >= 1) {
                                this.upgrades[i].relevant = false;
                            }
                            break;
                        case "Extra Life":
                            this.lives++;
                            this.upgrades[i].relevant = false;
                            break;
                        case "It's what you do with it":
                            this.boundingBox.height *= 0.5;
                            this.animator.scale *= 0.5;
                            this.upgrades[i].relevant = false;
                            this.animator.outlineMode = true;
                            this.animator.outlineColor = 'rgb(255,255,255)';
                            break;
                    }
                    // Set generic to 'false' so it can be re-used/activated in the future
                    this.upgrades[i].active = false;
                }
        }
    }

    setWeaponSwitchDelay() {
        this.lastWeaponSwitchTime = this.game.elapsedTime / 1000;
    }

    takeDamage(amount, attackType = "") {
        if (this.invincible) return;

        super.takeDamage(amount, attackType);
    }

    /**
     * Randomly choose 3 upgrades to show for a player upgrade screen.
     * Returns a randomly generated array of size 3
     * TODO still needs to handle what happens when you can't fill 3 slots
     */
    threeRandomUpgrades(){
        // Check if the input array has less than 3 elements
        let result = [];
        let indexes = new Set(); // To keep track of already selected indexes
        while (indexes.size < 3) {
            let randomIndex = Math.floor(Math.random() * this.upgrades.length);
            if (!indexes.has(randomIndex) && this.upgrades[randomIndex].relevant && !this.upgrades[randomIndex].active) {
                // If the upgrade selected is 'special' lets add a rarity to it even being chosen
                if (this.upgrades[randomIndex].special && (Math.random() < 1)) { // 20% chance that we let this special upgrade show up
                    indexes.add(randomIndex);
                    result.push(this.upgrades[randomIndex]);
                }
                // Else if not special just add it to the list of upgrades then
                else if (!this.upgrades[randomIndex].special){
                    indexes.add(randomIndex);
                    result.push(this.upgrades[randomIndex]);
                }
            }
        }
        return result;
    }

    update() {
        //console.log("WEAPONS: "+this.weapons[0].debugName+", "+this.weapons[1].debugName+", "+this.weapons[2].debugName);
        super.update();
        // for (let i = 0; i < this.weapons.length; i++) {
        //     console.log(this.weapons[i]);
        // }

        // If player is dead, do nothing
        if (this.isDead) {
            return;
        }

        // If health hits 0 or below, this entity is declared dead
        if (this.currHP <= 0 && this.lives < 0) {

                this.isDead = true;
                this.currentAnimation = "Dead";
                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/McDead.png"),
                    0, 0, 32, 40, 8, 0.1);

        }

        // Handle dashing duration and reset
        if (this.isDashing && ((this.game.elapsedTime / 1000) - this.lastDashTime >= this.dashDuration)) {
            this.lastDashTime = this.game.elapsedTime / 1000;
            this.lastDashTimeVar = this.lastDashTime;
            this.endDash();
        }

        this.lastDashTimeVar = this.lastDashTime;
        // Update UI variable for dash CD
        if (this.isDashing) {
            this.lastDashTimeVar = this.game.elapsedTime / 1000;
        }

        // Handle if this frame has iFrame
        if (this.isDashing || this.menuInvincibility) {
            this.invincible = true;
        } else {
            this.invincible = false;
        }

        // Calculate the delta time which is defined as the time passed in seconds since the last frame.
        // We will use this to calculate how much we should move the character on this frame.
        const delta = this.game.clockTick * this.movementSpeed * (this.isDashing ? this.dashSpeedMultiplier : 1);

        this.isMoving = false; // Reset the isMoving flag to false

        // Initialize movement vector components, we will use this to normalize the movement vector (so diagonal movement isn't faster than horizontal or vertical movement)
        let moveX = 0;
        let moveY = 0;

        // Update movement vector based on key presses
        if (this.controlsEnabled) {
            if (this.game.keys["w"]) moveY -= 1;
            if (this.game.keys["s"]) moveY += 1;
            if (this.game.keys["a"]) {
                moveX -= 1;
                this.lastMove = "left";     // Remember the last direction the character moved
            }
            if (this.game.keys["d"]) {
                moveX += 1;
                this.lastMove = "right";    // Remember the last direction the character moved
            }
        }

        // Perform attacks if mouse buttons are held down and the attacks are off cooldown.
        // To achieve this store the current game time and subtract it to the time since last attack to see
        // if we are ready to trigger another attack.
        const currentTime = this.game.elapsedTime / 1000;

        // Handle passive health regen
        if (currentTime - this.timeSinceLastHealthRegen >= this.healthRegenTime) {
            this.heal(1); // Assuming heal(1) regenerates health by 1 unit
            this.timeSinceLastHealthRegen = currentTime; // Reset the last regen time
        }

        if (this.controlsEnabled && this.allowWeaponSwitch && currentTime - this.lastWeaponSwitchTime >= this.weaponSwitchCooldown) {
            // Allows the user to switch weapons on a cooldown
            if (this.game.keys["q"]) {
                this.currentWeapon = (this.currentWeapon + 1) % this.weapons.length;
                this.lastWeaponSwitchTime = currentTime;
            }

            // Weapon switching with mouse wheel
            if (this.game.wheel) {
                if (this.game.wheel.deltaY < 0) { // Scroll up
                    this.currentWeapon = (this.currentWeapon - 1 + this.weapons.length) % this.weapons.length;
                    this.lastWeaponSwitchTime = currentTime;
                } else if (this.game.wheel.deltaY > 0) { // Scroll down
                    this.currentWeapon = (this.currentWeapon + 1) % this.weapons.length;
                    this.lastWeaponSwitchTime = currentTime;
                }
                this.game.wheel = null; // Reset wheel event after handling
            }

            // Weapon switching with number keys
            if (this.game.keys["1"]) {
                this.currentWeapon = 0; // Switch to first weapon
                this.game.keys["1"] = false; // Prevent continuous switching
                this.lastWeaponSwitchTime = currentTime;
            } else if (this.game.keys["2"]) {
                this.currentWeapon = 1; // Switch to second weapon
                this.game.keys["2"] = false;
                this.lastWeaponSwitchTime = currentTime;
            } else if (this.game.keys["3"]) {
                this.currentWeapon = 2; // Switch to third weapon
                this.game.keys["3"] = false;
                this.lastWeaponSwitchTime = currentTime;
            }
        }

        if (this.controlsEnabled) {
            //asks current weapon if it can attack
            if (this.game.leftMouseDown && currentTime - this.weapons[this.currentWeapon].lastPrimaryAttackTime >= this.weapons[this.currentWeapon].primaryCool) {
                this.weapons[this.currentWeapon].performPrimaryAttack(this, false);
            }

            // Perform the secondary attack off cooldown as long as right click is held.
            if (this.game.rightMouseDown && currentTime - this.weapons[this.currentWeapon].lastSecondAttackTime >= this.weapons[this.currentWeapon].secondCool) {
                this.weapons[this.currentWeapon].performSecondaryAttack(this, false);
            }
        }

        // Check if the character is moving
        this.isMoving = (moveX !== 0 || moveY !== 0);

        // Normalize the movement vector by calculating the length of the vector and dividing the components by the length
        // If this confuses you, just know that all this is doing is preventing diagonal movement from being faster than horizontal or vertical movement
        let length = Math.sqrt(moveX * moveX + moveY * moveY);
        if (length > 0) {
            moveX /= length;
            moveY /= length;
        }

        // Calculate intended new position
        let intendedX = this.worldX + moveX * delta;
        let intendedY = this.worldY + moveY * delta;

        // We are now going to detect X and Y collisions of map objects so that the player can still 'slide' on the surface of their bounding boxes.
        // Without doing it this way, the player kind of just got 'stuck' in place when colliding with map objects.
        // Check collisions with map objects for X-axis
        let collisionX = this.game.objects.some(mapObject =>
            this.checkCollisionWithMapObject(intendedX, this.worldY, mapObject));

        // Check collisions with map objects for Y-axis
        let collisionY = this.game.objects.some(mapObject =>
            this.checkCollisionWithMapObject(this.worldX, intendedY, mapObject));

        // Update position based on collision detection
        if (!collisionX) {
            this.worldX = Math.max(this.game.mapBoundaries.left, Math.min(this.game.mapBoundaries.right, intendedX));
        }
        if (!collisionY) {
            this.worldY = Math.max(this.game.mapBoundaries.top, Math.min(this.game.mapBoundaries.bottom, intendedY));
        }

        // Check if the animation state needs to be switched
        if (!this.isDashing && this.isMoving && this.currentAnimation !== "walking") {
            this.animator.pauseAtFrame(-1);
            this.currentAnimation = "walking";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/McWalk.png"), 0, 0, 32, 28, 8, 0.1);
        } else if (!this.isDashing && !this.isMoving && this.currentAnimation !== "standing") {
            this.animator.pauseAtFrame(-1);
            this.currentAnimation = "standing";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/McIdle.png"), 0, 0, 32, 28, 2, 0.5);
        }

        // If still currently dashing, then play up to frame 3 of the McDash animation
        if (this.isDashing && this.animator.spritesheet !== ASSET_MANAGER.getAsset("./sprites/McDash.png")) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/McDash.png"), 0, 0, 32, 28, 4, 0.15);
            this.currentAnimation = "dashing";
        }

        if (this.controlsEnabled) {
            // checks if space bar has been pressed and the dash is not on cooldown
            if (this.game.keys[" "] && !this.isDashing && (currentTime - this.lastDashTime >= this.dashCooldown)) {
                this.performDash();
            }
        }

        // if 10 seconds have passed, and we have Gravewalker, spawn a tombstone.
        if (this.game.elapsedTime / 1000 - this.lastGraveWalkTime >= 10) {
            for (let i = 0; i < this.graveWalkCount; i++) {
                let tombstone = new Map_object(this.game,
                    this.worldX + Math.floor((Math.random() * 100)) - Math.floor((Math.random() * 100)),
                    this.worldY + Math.floor((Math.random() * 100)) - Math.floor((Math.random() * 100)),
                    35, 35, "./sprites/object_tombstone.png", 0, 0, 28, 46, 1, 1, 1);
                this.game.addEntity(tombstone);
                tombstone.boundingBox.type = "tombstone";
            }

            this.lastGraveWalkTime = this.game.elapsedTime / 1000;
        }

        // if 2 minutes have passed, and we have Glorious Moon, suck all EXP.
        if (this.upgrades[16].active && (this.game.elapsedTime / 1000 - this.lastMoonTime) >= 120) {
            // TODO add visual and audio indicator of the effect
            // ASSET_MANAGER.playAsset()
            this.game.entities.forEach(orb => {
                if (orb.boundingBox.type === "orb") {
                    orb.isMovingTowardsPlayer = true;
                }
                }
            );
            this.lastMoonTime = this.game.elapsedTime / 1000;
        }

        // if dashing and we have Divine Dash, reflect all colliding enemy projectiles.
        // TODO add visual and audio indicator of the effect
        if (this.upgrades[15].active) {
            this.game.attacks.forEach(projectile => {
                if (projectile.attackCirc) {
                    if (projectile.boundingBox.type === "enemyAttack_Projectile" &&
                        projectile.attackCirc.collisionDetection(this.boundingBox) && this.isDashing) {


                        // Determine the path for the spritesheet
                        let newSpritesheetPath = projectile.animator.spritesheet.src;
                        // Find the index of "/sprites/"
                        const spritesIndex = newSpritesheetPath.indexOf("/sprites/");
                        // Ensure the path starts with "./sprites/" by reconstructing it if "/sprites/" is found
                        if (spritesIndex !== -1) {
                            newSpritesheetPath = "." + newSpritesheetPath.substring(spritesIndex);
                        }

                        console.log(newSpritesheetPath);

                        let reflectedProjectile = this.game.addEntity(new Projectile(this.game, projectile.atkPow,
                            projectile.worldX, projectile.worldY, projectile.boundingBox.width, projectile.boundingBox.height,
                            "playerAttack_TomeAttack", projectile.speed,
                            newSpritesheetPath,
                            projectile.animator.xStart, projectile.animator.yStart,
                            projectile.animator.width, projectile.animator.height, projectile.animator.frameCount,
                            projectile.animator.frameDuration, projectile.animator.scale, projectile.angleX * -1, projectile.angleY * -1,
                            2.5, 20, 1, 0,
                            0.3));
                        reflectedProjectile.pulsatingDamage = projectile.pulse;

                        reflectedProjectile.animator.outlineMode = true;
                        reflectedProjectile.animator.outlineColor = 'rgb(0,128,255)';

                        projectile.removeFromWorld = true;
                        projectile.attackCirc.removeFromWorld = true;
                    }
                }
            });

            // TODO GLOW
        }

    }

    checkCollisionWithMapObject(intendedX, intendedY, mapObject) {
        // Check collision with map objects ONLY if it is a map object type
        if (mapObject.boundingBox.type === "object") {
            // Create a temporary bounding box for the intended position
            let tempBoundingBox = new BoundingBox(intendedX, intendedY, this.boundingBox.width, this.boundingBox.height, this.boundingBox.type);

            // Check if this temporary bounding box collides with the map object's bounding box
            return tempBoundingBox.isColliding(mapObject.boundingBox);
        }
        // If we collide with an unopened chest, open the chest
        else if (mapObject.boundingBox.type.includes("chest") && !mapObject.hasBeenOpened) {
            // Create a temporary bounding box for the intended position
            let tempBoundingBox = new BoundingBox(intendedX, intendedY, this.boundingBox.width, this.boundingBox.height, this.boundingBox.type);

            //Check if this temporary bounding box collides with the map object's bounding box
            if (tempBoundingBox.isColliding(mapObject.boundingBox)) {
                mapObject.openChest();
            }
        }
        // If we collide with an unopened chest, open the chest
        else if (mapObject.boundingBox.type.includes("gold_bag")) {
            // Create a temporary bounding box for the intended position
            let tempBoundingBox = new BoundingBox(intendedX, intendedY, this.boundingBox.width, this.boundingBox.height, this.boundingBox.type);

            // Check if this temporary bounding box collides with the map object's bounding box
            if (tempBoundingBox.isColliding(mapObject.boundingBox)) {
                if (!mapObject.collectingGold) mapObject.collectGold();
            }
        }
        else if (mapObject.boundingBox.type === "anvil" && !mapObject.hasBeenOpened) {
            // Create a temporary bounding box for the intended position
            let tempBoundingBox = new BoundingBox(intendedX, intendedY, this.boundingBox.width, this.boundingBox.height, this.boundingBox.type);

            // Check if this temporary bounding box collides with the map object's bounding box
            if (tempBoundingBox.isColliding(mapObject.boundingBox)) {
                mapObject.openAnvil();
            }
        }
        else if (mapObject.boundingBox.type.includes("healingHeart") && !mapObject.hasBeenOpened) {
            // Create a temporary bounding box for the intended position
            let tempBoundingBox = new BoundingBox(intendedX, intendedY, this.boundingBox.width, this.boundingBox.height, this.boundingBox.type);

            // Check if this temporary bounding box collides with the map object's bounding box
            if (tempBoundingBox.isColliding(mapObject.boundingBox)) {
                mapObject.tiggerHealingHeart();
            }
        }
    }

    // called when the user has a valid dash and presses space bar
    performDash() {
        ASSET_MANAGER.playAsset(this.dashSound, 0.03);
        this.lastDashTime = this.game.elapsedTime / 1000; // Record the start time of the dash
        this.lastDashTimeVar = this.lastDashTime;
        this.isDashing = true; // Flag to indicate dashing state, this flag also will enable iFrames
    }

    endDash() {
        this.isDashing = false; // Reset dashing state, this flag also will enable iFrames
        if (this.upgrades[14].active) {
            let newProjectile = this.game.addEntity(new Projectile(this.game, 10,
                this.worldX, this.worldY, 10, 10, "playerAttack_Smoke", 0,
                "./sprites/smoke.png",
                0, 0, 32, 32, 5, 0.1, 5, 0, 0,
                0.5, 100, 14, 0, 1));
            newProjectile.attackCirc.pulsatingDamage = false;
        }
    }

    gainExp(exp) {
        this.exp += exp * this.expGain;

        // Calculate current progress towards next level as a percentage
        let progressPercentage = (this.exp / (this.level * 10)) * 100;

        // Determine which sound to play based on 5% increments
        let soundIndex = Math.floor(progressPercentage / 5);
        soundIndex = Math.min(soundIndex, this.gainExpSoundBank.length - 1); // Ensure index does not exceed array bounds

        // Play the corresponding sound
        let soundToPlay = this.gainExpSoundBank[soundIndex];
        ASSET_MANAGER.playAsset(soundToPlay);

        this.updateScore(exp * this.expGain);

        // level up!
        if (this.exp >= (this.level * 10)) {
            this.exp -= (this.level * 10);
            this.level++;
            ASSET_MANAGER.playAsset(this.levelupSound);
            this.game.UPGRADE_SYSTEM.showPlayerUpgradeScreen();
        }
    }

    updateScore(value) {
        //console.log(value);
        this.score += value;
        this.score = Math.round(this.score);
        if (this.score < 0){
            this.score = 0;
        }
    }

    drawExp(ctx) {

        const weaponBoxWidth = 100;
        // bow before my mathematical prowess!
        const left = canvas.width/2 - (weaponBoxWidth * this.game.player.weapons.length)/2;
        const right = canvas.width/2 + (weaponBoxWidth * this.game.player.weapons.length)/2;
        const height = 25;
        ctx.beginPath();
        ctx.fillStyle = "Black";
        ctx.fillRect(left, canvas.height - height,
            right - left, height);
        ctx.closePath();

        //draw the current exp value
        ctx.beginPath();
        ctx.fillStyle = 'rgb(62,148,255)';
        let meter = ((this.exp) / (this.level * 10));
        // prevents exp bar from going too far in any direction
        if (meter > 1) {
            meter = 1;
        }
        ctx.fillRect(left, canvas.height - height,
            (right-left) * meter, height);
        ctx.closePath();

        ctx.beginPath();
        ctx.font = '18px Arial';
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.textAlign = 'center'
        ctx.fillText("Lv: " + this.level, canvas.width/2, canvas.height - height/3);
        ctx.textAlign = 'left'
        ctx.fillText("Score: " + this.score, canvas.width/2 - weaponBoxWidth*2/3 + 15, canvas.height - height/3 - 150);
        ctx.fillText("Lives: " + this.lives, canvas.width/2 - weaponBoxWidth*3/2, canvas.height - height/3 - 150);
        ctx.closePath();
    }

    drawWeaponUI(ctx) {
        for (let i = 0; i < this.weapons.length; i++) {
            this.weapons[i].draw(ctx, i);
        }

        ctx.beginPath();
        ctx.fillStyle = "rgba(150, 150, 150, 1)";
        ctx.fillRect(this.boundingBox.left - this.game.camera.x,
            this.boundingBox.top + this.boundingBox.height - this.game.camera.y + 10,
            this.boundingBox.width, 10);
        ctx.closePath();

        // //draw the current exp value

        // ctx.beginPath();
        // ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';
        // diff = (this.game.elapsedTime / 1000) - this.lastSecondAttackTime;
        // if (diff > this.secondCool) {
        //     diff = this.secondCool;
        //     ctx.fillStyle = 'rgba(0, 100, 255, 1)';
        // }
        // ctx.fillRect(slotX + weaponBoxWidth/2 + barWidth*2, slotY + 5 + barHeight, barWidth, -1 * barHeight * (diff / this.secondCool));
        // ctx.closePath();
        let weapon = this.weapons[this.currentWeapon];
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';
        let diff = ((this.game.elapsedTime / 1000) - weapon.lastSecondAttackTime)/weapon.secondCool;
        if (diff > 1) {
            diff = 1;
            ctx.fillStyle = 'rgba(0, 100, 255, 1)';
        }
        ctx.fillRect(this.boundingBox.left - this.game.camera.x,
            this.boundingBox.top + this.boundingBox.height - this.game.camera.y + 10,
            this.boundingBox.width * diff, 10);
        ctx.closePath();
    }

    drawWeapons(ctx) {
        const weapon = this.weapons[this.currentWeapon];
        const weaponSprite = ASSET_MANAGER.getAsset(weapon.spritePath);

        // Make sure mouse position is available (In case it is off screen, will throw an error without this)
        if (this.game.mouse) {
            let scale = 2;
            if (this.currentWeapon === 1) {
                scale = 1.5; // Scale the book down slightly to fit better with the player sprite
            }

            const scaledWidth = weaponSprite.width * scale;
            const scaledHeight = weaponSprite.height * scale;

            // Angle to mouse cursor for weapon orbiting
            const mouseX = this.game.mouse.x + this.game.camera.x;
            const mouseY = this.game.mouse.y + this.game.camera.y;
            const playerCenter = this.calculateCenter();
            const angleToMouse = Math.atan2(mouseY - playerCenter.y, mouseX - playerCenter.x);

            // Radius for how far out from the player the weapon sits
            const orbitRadius = 50;

            // Weapon position based on angle and radius
            const weaponX = playerCenter.x + Math.cos(angleToMouse) * orbitRadius - this.game.camera.x;
            const weaponY = playerCenter.y + Math.sin(angleToMouse) * orbitRadius - this.game.camera.y;

            ctx.save();
            ctx.translate(weaponX, weaponY);

            // Initially flip the scythe and staff to correct their default direction
            const shouldInitiallyFlip = this.currentWeapon === 0 || this.currentWeapon === 2;

            // Determine if the weapon should be flipped based on relative position to the player
            const shouldFlipBasedOnPosition = Math.cos(angleToMouse) < 0;

            /* Apply initial flip for scythe and staff since sprite is faced left by default,
               then check if additional flip is needed based on side position */
            if (shouldInitiallyFlip !== shouldFlipBasedOnPosition) {
                ctx.scale(-1, 1);
            }

            // Adjust drawing position based on whether it is flipped or not
            const drawX = shouldFlipBasedOnPosition ? scaledWidth / 2 : -scaledWidth / 2;
            const drawY = -scaledHeight / 2;

            ctx.drawImage(weaponSprite, drawX, drawY, scaledWidth * (shouldFlipBasedOnPosition ? -1 : 1), scaledHeight);

            ctx.restore();
        }
    }
    
    // Method to draw the attack indicator for the staff where the mouse is
    drawStaffAttackIndicator(ctx) {
        if (this.currentWeapon === 2) {
            if (this.game.mouse) {
                const mouseX = this.game.mouse.x;
                const mouseY =  this.game.mouse.y;
                let attackRadius = this.weapons[this.currentWeapon].primaryAttackRadius

                ctx.beginPath();
                ctx.arc(mouseX, mouseY, attackRadius, 0, 2 * Math.PI, false)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
                ctx.fill();

                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
                ctx.stroke();
                ctx.closePath();

                attackRadius = this.weapons[this.currentWeapon].secondaryAttackDuration *
                    30 * EXPLOSION_GROWTH + this.weapons[this.currentWeapon].secondaryAttackRadius;

                ctx.beginPath();
                ctx.arc(mouseX, mouseY, attackRadius, 0, 2 * Math.PI, false)
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
                ctx.fill();

                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
                ctx.stroke();
                ctx.closePath();
            }
        }
    }

    // Draws a white bar for roll CD tracking
    drawRollCD(ctx) {
        const barWidth = 200;
        const barHeight = 10;
        const xOffset = (ctx.canvas.width - barWidth) / 2;
        const yOffset = 500;

        // Calculate the elapsed time since the last dash
        const timeSinceLastDash = (this.game.elapsedTime / 1000) - this.lastDashTimeVar;
        // Calculate the remaining cooldown time
        const remainingCooldown = Math.max(0, this.dashCooldown - timeSinceLastDash);
        // Calculate the width of the filled portion based on the remaining cooldown
        const filledWidth = barWidth * (1 - (remainingCooldown / this.dashCooldown));

        // Start fading out the bar 5 seconds after the last dash
        const fadeStartTime = 2.5; // Seconds after last dash when fading starts
        const fadeDuration = 1; // Duration over which the bar fades out, in seconds
        let alpha = 1; // Default alpha value (fully opaque)

        // If the last dash was more than 5 seconds ago, start fading
        if (timeSinceLastDash >= fadeStartTime) {
            const fadeProgress = (timeSinceLastDash - fadeStartTime) / fadeDuration;
            alpha = Math.max(0, 1 - fadeProgress); // Decrease alpha to fade out, but not below 0
        }

        // Draw the background of the cooldown bar (semi-transparent grey)
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`; // Background fades with the bar
        ctx.fillRect(xOffset, yOffset, barWidth, barHeight);

        // Draw the filled portion of the cooldown bar (white when cooling down)
        if (remainingCooldown === 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`; // Foreground fades with the bar
        } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.66})`; // Foreground fades with the bar
        }
        ctx.fillRect(xOffset, yOffset, filledWidth, barHeight);
    }

    addGold(amount) {
        this.gold += Math.ceil(amount * this.goldGain);

        // Play sound effect of gold collection
        ASSET_MANAGER.playAsset(this.pickupSoundBank[Math.round(Math.random() * this.pickupSoundBank.length)]);
    }

    removeGold(amount) {
        if (this.gold - amount < 0) {
            return;
        }

        this.gold -= amount;

        // Play sound effect of gold removal
    }

    draw(ctx, game) {
        // Check if the camera is initialized.
        // This is necessary as it is needed for this method, but may not be initialized on the first few calls
        // at the start of the game.
        if (!this.game.camera) {
            console.log("dude.draw(): Camera not found! Not drawing player!");
            return; // Skip drawing the player if the camera is not initialized
        }

        // if (this.isDashing && this.animator.currentFrame() === this.animator.frameCount-2) {
        //     this.animator.pauseAtFrame(3);
        // }

        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);

        // Force the super class to draw the health bar for our player
        this.drawHealth(ctx);
        this.drawRollCD(ctx);
        this.drawExp(ctx);
        this.drawWeaponUI(ctx);
        this.drawWeapons(ctx);
        this.drawStaffAttackIndicator(ctx);
        this.boundingBox.draw(ctx, game);
    }
}