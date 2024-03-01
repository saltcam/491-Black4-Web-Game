class Map_object extends Entity {
    constructor(game, worldX, worldY, boxWidth, boxHeight, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale) {
        super(0, 0, 0, game, worldX, worldY, boxWidth, boxHeight, "object", 0, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale);
        this.debugName = "Map_Object("+this.boundingBox.type+")";
        this.hasBeenOpened = false;
        this.isExploding = false;
        this.explosion = null;
        this.arrowPointer = null;
        this.openedAtTime = null;
        this.deleteAfterOpenTime = 5; // Seconds to wait before deleting this after 'opening' it (if it's a chest type)

        // Coin collection properties
        this.coinCollectionSeperationDelay = 0.2;
        this.lastCoinCollectionTime = 0;
        this.coinsToCollect = 0; // How many coins left to collect
        this.collectingGold = false; // Whether the gold collection process is active

        this.anvilSound = "./sounds/anvil.mp3";
        this.upgradeScreenSound = "./sounds/upgrade_popup.mp3";
        this.healingHeartSound = "./sounds/healing_heart.mp3";

        this.boundingCircle = null;
        this.isFloatingObject = false;
        this.maxRelocations = 10;
        this.targetX = 0;
        this.targetY = 0;
    }

    update() {
        // If this object uses relocation and we hit the max count of relocations, delete this object
        if (this.isFloatingObject && this.relocationCount >= this.maxRelocations) {
            this.game.meteor = null;
            this.removeFromWorld = true;
        }

        // Movement towards the player if this object is floating.
        if (this.isFloatingObject) {
            this.relocate();

            // Target position of the player
            // const targetX = this.game.player.worldX;
            // const targetY = this.game.player.worldY;

            // Calculate direction vector from this object to the target
            const dirX = this.targetX - this.worldX;
            const dirY = this.targetY - this.worldY;

            // Calculate distance to the target
            const distance = Math.sqrt(dirX * dirX + dirY * dirY);

            // Normalize direction vector if distance is not 0 to avoid division by 0
            const normalizedDirX = distance > 0 ? dirX / distance : 0;
            const normalizedDirY = distance > 0 ? dirY / distance : 0;

            // Adjust speed based on distance (the closer to the target, the slower it moves)
            const minSpeed = 0.1; // Minimum movement speed to prevent stopping completely before reaching the target
            const speedAdjustmentFactor = Math.max(minSpeed, distance / 100); // Adjust this divisor to control how quickly the speed decreases

            // Calculate adjusted movement speed
            const adjustedSpeed = this.movementSpeed * speedAdjustmentFactor;

            // Calculate movement based on adjusted speed and the normalized direction
            // Using game.clockTick to make movement framerate independent
            this.worldX += normalizedDirX * adjustedSpeed * this.game.clockTick;
            this.worldY += normalizedDirY * adjustedSpeed * this.game.clockTick;
        }

        // If this is a chest, and we are stuck offscreen or in a map object, just give the upgrade and gold to the player
        if (this.boundingBox.type.toLowerCase().includes("chest") && !this.hasBeenOpened) {
            this.game.objects.forEach(object => {
                if (object.boundingBox.type === "object" && this.boundingBox.isColliding(object.boundingBox)) {
                    this.openChest();
                }

                // Check if the chest is outside the map boundaries
                const isOutOfBounds = this.worldX < this.game.mapBoundaries.left ||
                    this.worldX > this.game.mapBoundaries.right ||
                    this.worldY < this.game.mapBoundaries.top ||
                    this.worldY > this.game.mapBoundaries.bottom;

                if (isOutOfBounds) {
                    // If the chest is out-of-bounds, open it automatically
                    this.openChest();
                }
            });
        }

        // Calculate the scaled center of the sprite
        const scaledCenterX = this.worldX + (this.animator.width) / 2;
        const scaledCenterY = this.worldY + (this.animator.height) / 2;

        // Update the bounding box to be centered around the scaled sprite
        this.boundingBox.updateCentered(scaledCenterX, scaledCenterY, this.boundingBox.width, this.boundingBox.height);

        // Update bounding circle if we have one on this entity
        if (this.boundingCircle !== null) {
            // Calculate the scaled center of the sprite
            const scaledCenterX = this.worldX + (this.animator.width) / 2;
            const scaledCenterY = this.worldY + (this.animator.height) / 2;
            this.boundingCircle.updateCentered(scaledCenterX, scaledCenterY);
        }

        if (this.coinsToCollect <= 0) { // Seems redundant?
            return;
        }

        // Check if we are in the process of collecting gold
        if (this.collectingGold && this.coinsToCollect > 0) {
            // Check if enough time has passed since the last coin was collected
            if (this.game.elapsedTime - this.lastCoinCollectionTime >= (this.coinCollectionSeperationDelay * 1000)) {
                // Collect one coin
                this.game.addEntity(new Gold_Coin_UI(this.game, this.worldX, this.worldY));
                this.coinsToCollect--; // Decrement the coins left to collect
                this.coinCollectionSeperationDelay *= 0.95; // Optional: Decrease the delay for the next coin
                this.lastCoinCollectionTime = this.game.elapsedTime; // Update the last collection time

                // If all coins have been collected, stop the collection process
                if (this.coinsToCollect <= 0) {
                    if (this.game.portal) {
                        this.game.portal.collisionAllowed = true;
                    }
                    this.collectingGold = false;
                    this.removeFromWorld = true; // Remove the gold bag object
                }
            }
        }
    }

    openChest() {
        if (this.hasBeenOpened) return;

        this.collectGold();
        this.animator.pauseAtFrame(-1);
        this.animator.pauseAtSpecificFrame(24); // Passing a -1 essentially unpauses the animator.
        this.animator.outlineMode = false; // Turn off the outline now that it has been opened

        if (this.boundingBox.type.includes("upgrade_chest")) {
            ASSET_MANAGER.playAsset(this.upgradeScreenSound, 0.25);
            this.game.UPGRADE_SYSTEM.showWeaponUpgradeScreen();
        }

        this.hasBeenOpened = true;
        this.openedAtTime = this.game.elapsedTime / 1000;

        if (this.arrowPointer) {
            this.arrowPointer.removeFromWorld = true;
        }
    }

    tiggerHealingHeart() {
        this.game.player.heal(this.game.player.maxHP * 0.1);
        ASSET_MANAGER.playAsset(this.healingHeartSound);
        this.removeFromWorld = true;
    }

    openAnvil() {
        if (!this.hasBeenOpened) {
            ASSET_MANAGER.playAsset(this.anvilSound, 0.2);
            this.game.UPGRADE_SYSTEM.showAnvilWeaponUpgradeScreen();
            this.hasBeenOpened = true;
        }
    }

    /** This method extracts the number from the end of strings, this will be used to see how much gold a coin bag is worth. */
    extractNumber(str) {
        const match = str.match(/\d+$/);
        return match ? parseInt(match[0], 10) : null;
    }

    collectGold() {
        this.collectingGold = true;
        if (this.game.portal) {
            this.game.portal.collisionAllowed = false;
        }
        let amount = this.extractNumber(this.boundingBox.type);
        if (amount > 0) {
            this.coinsToCollect += amount; // Set the number of coins to collect
        }
    }

    // prepares the object with information letting the game know to make an explosion before removing it.
    willExplode(explosion){
        this.isExploding = true;
        this.explosion = explosion;
        this.removeFromWorld = true;
    }

    // creates the explosion in game, which is called when removing.
    explode() {
        // duration is a raw value because it otherwise lasts infinitely.
        // Do we want to take more info from player here?
        if (this.isExploding) {
            let newProjectile = this.game.addEntity(new Projectile(this.game, 45 + (this.game.player.atkPow / 10),
                this.worldX, this.worldY, 10, 10, "playerAttack_ExplosionAttack", 0,
                "./sprites/transparent.png",
                0, 0, 17, 17, 3, 0.2, 0.01, 0, 0,
                this.game.player.weapons[2].secondaryAttackDuration, 2, 5, 0, 1));
            this.isExploding = false;
            newProjectile.attackCirc.drawCircle = true;
            ASSET_MANAGER.playAsset("./sounds/SE_staff_primary.mp3");
            if (this.game.player.weapons[2].upgrades[10].active) {
                let newFireProjectile = this.game.addEntity(new Projectile(this.game, 5,
                    this.worldX - 95, this.worldY - 77.5, 10, 10, "playerAttack_Fire", 0,
                    "./sprites/hazard_fire.png",    // may need to keep hidden if debugging
                    0, 0, 765/4, 153, 4, 0.2, 1, 0, 0,
                    5, 75, 0, 0, 1));
                newFireProjectile.attackCirc.pulsatingDamage = true;
            }
        }

    }

    relocate() {
        // Exit if this not a floating object
        if (!this.relocateMode || !this.isFloatingObject) return;

        const camera = this.game.camera;

        // Calculate entity's position relative to the camera
        const relativeX = this.worldX - camera.x;
        const relativeY = this.worldY - camera.y;

        let outsideHorizontalBounds = relativeX < -this.outOfBoundsOffset || relativeX > camera.width + this.outOfBoundsOffset;
        let outsideVerticalBounds = relativeY < -this.outOfBoundsOffset || relativeY > camera.height + this.outOfBoundsOffset;

        // Check if the entity is outside the bounds of the camera, plus a buffer
        if (outsideHorizontalBounds || outsideVerticalBounds) {
            //console.log("REACHED!");
            // Generate new coordinates for relocation
            let newCoords = this.game.randomOffscreenCoords();

            // Update entity's position
            this.worldX = newCoords.x;
            this.worldY = newCoords.y;

            // Immediately update the entity's bounding box or circle with the new position
            this.updateBoundingBox();
            if (this.boundingCircle !== null) {
                // Calculate the scaled center of the sprite
                const scaledCenterX = this.worldX + (this.animator.width) / 2;
                const scaledCenterY = this.worldY + (this.animator.height) / 2;
                this.boundingCircle.updateCentered(scaledCenterX, scaledCenterY);
            }

            // Calculate random factors for X and Y
            const randomFactorX = 1 + (Math.random() - 0.5); // Generates a factor between 0.5 and 1.5
            const randomFactorY = 1 + (Math.random() - 0.5); // Generates a factor between 0.5 and 1.5

            // Target position should be the opposite side of the screen X and Y
            if (relativeX < -this.outOfBoundsOffset) {
                // Exited to the left, target the right side
                this.targetX = (camera.x + camera.width + this.outOfBoundsOffset) * randomFactorX;
            } else if (relativeX > camera.width + this.outOfBoundsOffset) {
                // Exited to the right, target the left side
                this.targetX = (camera.x - this.outOfBoundsOffset) * randomFactorX;
            } else {
                // Maintain current X if exited vertically
                this.targetX = this.worldX * randomFactorX;
            }

            if (relativeY < -this.outOfBoundsOffset) {
                // Exited to the top, target the bottom side
                this.targetY = (camera.y + camera.height + this.outOfBoundsOffset) * randomFactorY;
            } else if (relativeY > camera.height + this.outOfBoundsOffset) {
                // Exited to the bottom, target the top side
                this.targetY = (camera.y - this.outOfBoundsOffset) * randomFactorY;
            } else {
                // Maintain current Y if exited horizontally
                this.targetY = this.worldY * randomFactorY;
            }

            this.relocationCount++;
        }
    }

    draw(ctx) {
        if (!this.game.camera) return;

        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);

        if (this.boundingBox.type === "tombstone") {
            if (this.game.player.currentWeapon === 2) {
                this.animator.outlineMode = true;
                this.animator.outlineColor = 'rgb(232,0,255)';
            } else {
                this.animator.outlineMode = false;
            }
        }
        if (this.boundingBox.type === "anvil") {
            this.animator.outlineMode = true;
            this.animator.outlineColor = 'rgb(255,255,255)';
        }

        if (this.boundingCircle !== null) this.boundingCircle.draw(ctx, this.game);
    }
}