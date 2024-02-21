class Map_object extends Entity {
    constructor(game, worldX, worldY, boxWidth, boxHeight, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale) {
        super(0, 0, 0, game, worldX, worldY, boxWidth, boxHeight, "object", 0, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale);
        this.hasBeenOpened = false;
        this.isExploding = false;
        this.explosion = null;
    }

    openChest() {
        this.animator.pauseAtFrame(24); // Passing a -1 essentially unpauses the animator.
        this.game.UPGRADE_SYSTEM.showWeaponUpgradeScreen();
        this.hasBeenOpened = true;

        // Delete the chest entity after roughly 10 seconds of being opened.
        setTimeout(() => {
            this.removeFromWorld = true;
        }, 10000);
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
        this.game.player.gold += this.extractNumber(this.boundingBox.type);
        this.removeFromWorld = true;
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
                this.worldX, this.worldY, 10, 10, "explosionAttack", 0,
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