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
    }

    update() {
        // Calculate the scaled center of the sprite
        const scaledCenterX = this.worldX + (this.animator.width) / 2;
        const scaledCenterY = this.worldY + (this.animator.height) / 2;

        // Update the bounding box to be centered around the scaled sprite
        this.boundingBox.updateCentered(scaledCenterX, scaledCenterY, this.boundingBox.width, this.boundingBox.height);

        if (this.coinsToCollect <= 0) {
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
            this.game.UPGRADE_SYSTEM.showWeaponUpgradeScreen();
        }

        this.hasBeenOpened = true;
        this.openedAtTime = this.game.elapsedTime / 1000;

        if (this.arrowPointer) {
            this.arrowPointer.removeFromWorld = true;
        }
    }

    openAnvil() {
        if (!this.hasBeenOpened) {
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
            let newProjectile = this.game.addEntity(new Projectile(this.game, this.explosion.attackDamage,
                this.worldX, this.worldY, 10, 10, "playerAttack_ExplosionAttack", 0,
                "./sprites/transparent.png",
                0, 0, 17, 17, 3, 0.2, 0.01, 0, 0,
                this.game.player.weapons[2].secondaryAttackDuration, 2, 5, 0, 1));
            this.isExploding = false;
            newProjectile.attackCirc.drawCircle = true;
            ASSET_MANAGER.playAsset("./sounds/SE_staff_primary.mp3");
        }
    }

    draw(ctx) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);
    }
}