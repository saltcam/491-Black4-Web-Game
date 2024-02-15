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
        this.game.UPGRADE_SYSTEM.showPlayerUpgradeScreen();
        this.hasBeenOpened = true;
    }

    /** This method extracts the number from the end of strings, this will be used to see how much gold a coin bag is worth. */
    extractNumber(str) {
        const match = str.match(/\d+$/);
        return match ? parseInt(match[0], 10) : null;
    }

    collectGold() {
        console.log("ADD GOLD " + this.extractNumber(this.boundingBox.type));
        this.game.player.gold += this.extractNumber(this.boundingBox.type);
        console.log("CURR GOLD = " + this.game.player.gold);
        this.removeFromWorld = true;
    }

    // prepares the object with information letting the game know to make an explosion before removing it.
    willExplode(explosion){
        this.isExploding = true;
        this.explosion = explosion;

    }

    // creates the explosion in game, which is called when removing.
    explode() {
        // duration is a raw value because it otherwise lasts infinitely.
        if (this.isExploding) {
            this.game.addEntity(new Projectile(this.game, this.explosion.attackDamage,
                this.worldX, this.worldY, 10, 10, "explosionAttack", 0,
                "./sprites/exp_orb.png",
                0, 0, 17, 17, 3, 0.2, 10, 0, 0,
                3, this.explosion.radius, this.explosion.damagePushbackForce, 0, 1));
            this.isExploding = false;
        }
    }

    draw(ctx) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);
    }
}