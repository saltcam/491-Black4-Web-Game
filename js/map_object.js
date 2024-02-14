class Map_object extends Entity {
    constructor(game, worldX, worldY, boxWidth, boxHeight, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale) {
        super(0, 0, 0, game, worldX, worldY, boxWidth, boxHeight, "object", 0, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale);
        this.hasBeenOpened = false;
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

    draw(ctx) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);
    }
}