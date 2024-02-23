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

        this.upgrades = [
            new Upgrade("Health +10", "(Stackable, Additive).", false, "./sprites/upgrade_max_health.png"),
            new Upgrade("Health Regen CD -20%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_health_regen.png"),
            new Upgrade("Dash CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_dash_cooldown.png"),
            new Upgrade("Movement Speed +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_movement_speed.png"),
            new Upgrade("Attack Damage +7.5%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_attack_damage.png"),
            new Upgrade("Pickup Range +30%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_pickup_range.png"),
            new Upgrade("Dash Duration +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_dash_distance.png"),
            new Upgrade("Crit Damage +20%", "(Stackable, Additive).", false, "./sprites/upgrade_attack_damage.png"),
            new Upgrade("Crit Chance +5%", "(Stackable, Additive).", false, "./sprites/upgrade_attack_damage.png"),
            new Upgrade("Experience Gain +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_exp_gain.png")];

        // Animation settings
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves

        // Dash implementation
        this.defaultDashCooldown = 2;   // This is the actual cooldown of dash that will be used each time we dash
        this.currentDashCooldown = 0;    // This holds the current time left till we can dash again
        this.dashSpeedMultiplier = 3;
        this.dashDuration = 0.5;
        this.lastDashTime = -this.defaultDashCooldown; // Tracks when the last dash happened

        // Regen 1 health per this many seconds
        this.healthRegenTime = 3.5;
        this.timeSinceLastHealthRegen = 0;

        this.gold = 0;
        this.level = 1;
        this.expGain = 1; // EXP Gain multiplier

        // weapon handling
        this.allowWeaponSwitch = true;
        this.weapons = [new Weapon_scythe(game), new Weapon_tome(game), new Weapon_staff(game)];
        // index for current weapon: Weapon_scythe = 0; Weapon_tome = 1; Tome = 2;
        this.currentWeapon = 0;
        this.weaponSwitchCooldown = 0.5; // Cooldown time in seconds to prevent rapid switching
        this.lastWeaponSwitchTime = 0;
        this.controlsEnabled = true;    // If false, player cannot input controls.
        this.pickupRange = 50;

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
    };

    // Handles code for turning on upgrades (Generic and Specific)
    handleUpgrade() {
        for (let i = 0; i < this.upgrades.length; i++) {
            // If generic has been turned on
            if (this.upgrades[i].active && !this.upgrades[i].special) {
                switch (this.upgrades[i].name) {
                    case "Health +10":
                        this.maxHP += 10;
                        this.heal(10);
                        break;
                    case "Health Regen CD -20%":
                        this.healthRegenTime *= 0.8;
                        break;
                    case "Dash CD -10%":
                        this.defaultDashCooldown *= 0.9;
                        break;
                    case "Movement Speed +10%":
                        this.movementSpeed *= 1.1;
                        break;
                    case "Attack Damage +7.5%":
                        this.atkPow *= 1.075;
                        break;
                    case "Pickup Range +20%":
                        this.pickupRange *= 1.3;
                        break;
                    case "Dash Duration +10%":
                        this.dashDuration *= 1.1;
                        break;
                    case "Crit Damage +20%":
                        this.critDamage += 0.2;
                        break;
                    case "Crit Chance +5%":
                        this.critChance += 0.05;
                        break;
                    case "Experience Gain +10%":
                        this.expGain *= 1.1;
                }
                // Set generic to 'false' so it can be re-used/activated in the future
                this.upgrades[i].active = false;
            }
        }
    }

    setWeaponSwitchDelay() {
        this.lastWeaponSwitchTime = this.game.timer.gameTime;
    }

    takeDamage(amount) {
        if (this.invincible) return;

        super.takeDamage(amount);
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
            if (!indexes.has(randomIndex) && !this.upgrades[randomIndex].active) {
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
        super.update();

        // If player is dead, do nothing
        if (this.isDead) {
            return;
        }

        // If health hits 0 or below, this entity is declared dead
        if (this.currHP <= 0) {
            this.isDead = true;
            this.currentAnimation = "Dead";
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/McDead.png"),
                0, 0, 32, 40, 8, 0.1);
        }

        // Handle dashing duration and reset
        if (this.isDashing && (this.game.timer.gameTime - this.lastDashTime >= this.dashDuration)) {
            this.endDash();
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
        const currentTime = this.game.timer.gameTime;

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
                this.weapons[this.currentWeapon].performPrimaryAttack(this);
            }

            // Perform the secondary attack off cooldown as long as right click is held.
            if (this.game.rightMouseDown && currentTime - this.weapons[this.currentWeapon].lastSecondAttackTime >= this.weapons[this.currentWeapon].secondCool) {
                this.weapons[this.currentWeapon].performSecondaryAttack(this);
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

        // decrements dash cooldown
        this.currentDashCooldown -= this.game.clockTick;

        if (this.currentDashCooldown < 0) {
            this.currentDashCooldown = 0;
        }
        if (this.controlsEnabled) {
            // checks if space bar has been pressed and the dash is not on cooldown
            if (this.game.keys[" "] && (currentTime - this.lastDashTime >= this.defaultDashCooldown)) {
                this.performDash();
            }
        }
    };

    checkCollisionWithMapObject(intendedX, intendedY, mapObject) {
        // Check collision with map objects ONLY if it is a map object type
        if (mapObject.boundingBox.type === "object") {
            // Create a temporary bounding box for the intended position
            let tempBoundingBox = new BoundingBox(intendedX, intendedY, this.boundingBox.width, this.boundingBox.height, this.boundingBox.type);

            // Check if this temporary bounding box collides with the map object's bounding box
            return tempBoundingBox.isColliding(mapObject.boundingBox);
        }
        // If we collide with an unopened chest, open the chest
        else if (mapObject.boundingBox.type === "chest" && !mapObject.hasBeenOpened) {
            // Create a temporary bounding box for the intended position
            let tempBoundingBox = new BoundingBox(intendedX, intendedY, this.boundingBox.width, this.boundingBox.height, this.boundingBox.type);

            //Check if this temporary bounding box collides with the map object's bounding box
            if (tempBoundingBox.isColliding(mapObject.boundingBox)) {
                mapObject.openChest();
            }
        }
        // If we collide with an unopened chest, open the chest
        else if (mapObject.boundingBox.type.includes("gold")) {
            // Create a temporary bounding box for the intended position
            let tempBoundingBox = new BoundingBox(intendedX, intendedY, this.boundingBox.width, this.boundingBox.height, this.boundingBox.type);

            // Check if this temporary bounding box collides with the map object's bounding box
            if (tempBoundingBox.isColliding(mapObject.boundingBox)) {
                mapObject.collectGold();
                mapObject.removeFromWorld = true;
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
    }

    // called when the user has a valid dash and presses space bar
    performDash() {
        this.lastDashTime = this.game.timer.gameTime; // Record the start time of the dash
        this.isDashing = true; // Flag to indicate dashing state, this flag also will enable iFrames
    }

    endDash() {
        this.isDashing = false; // Reset dashing state, this flag also will enable iFrames
    }

    gainExp(exp) {
        this.exp += exp * this.expGain;

        // level up!
        if (this.exp >= (this.level * 10)) {
            this.exp -= (this.level * 10);
            this.level++;
            this.game.UPGRADE_SYSTEM.showPlayerUpgradeScreen();
        }
    }

    drawExp(ctx) {
        ctx.beginPath();
        ctx.fillStyle = "Black";
        ctx.fillRect(this.boundingBox.left - this.game.camera.x,
            this.boundingBox.top + this.boundingBox.height - this.game.camera.y + 20,
            this.boundingBox.width, 10);
        ctx.closePath();

        //draw the current exp value
        ctx.beginPath();
        ctx.fillStyle = "Yellow";
        let meter = ((this.exp) / (this.level * 10));
        // prevents exp bar from going too far in any direction
        if (meter > 1) {
            meter = 1;
        }
        ctx.fillRect(this.boundingBox.left - this.game.camera.x,
            this.boundingBox.top + this.boundingBox.height - this.game.camera.y + 20,
            this.boundingBox.width * meter, 10);
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
        // diff = this.game.timer.gameTime - this.lastSecondAttackTime;
        // if (diff > this.secondCool) {
        //     diff = this.secondCool;
        //     ctx.fillStyle = 'rgba(0, 100, 255, 1)';
        // }
        // ctx.fillRect(slotX + weaponBoxWidth/2 + barWidth*2, slotY + 5 + barHeight, barWidth, -1 * barHeight * (diff / this.secondCool));
        // ctx.closePath();
        let weapon = this.weapons[this.currentWeapon];
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';
        let diff = (this.game.timer.gameTime - weapon.lastSecondAttackTime)/weapon.secondCool;
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
                    60 * EXPLOSION_GROWTH + this.weapons[this.currentWeapon].secondaryAttackRadius;

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
        const yOffset = 500; // Adjust for your game's UI layout

        // Calculate the elapsed time since the last dash
        const timeSinceLastDash = this.game.timer.gameTime - this.lastDashTime;
        // Calculate the remaining cooldown time
        const remainingCooldown = Math.max(0, this.defaultDashCooldown - timeSinceLastDash);
        // Calculate the width of the filled portion based on the remaining cooldown
        const filledWidth = barWidth * (1 - (remainingCooldown / this.defaultDashCooldown));

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