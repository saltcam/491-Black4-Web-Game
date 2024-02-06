class Portal extends Entity {
    constructor(game, worldX, worldY, teleportIndex) {
        super(1, 1, 0, game, worldX, worldY, 24, 58, "portal", 0,
            "./sprites/portal.png",
            1, 0, 24, 58, 4, 0.18, 2.5);

        this.teleportIndex = teleportIndex;
    }

    collidesWithPlayer(player) {
        return this.boundingBox.isColliding(player.boundingBox);
    }

    handlePlayerInteraction(player) {
        if (this.collidesWithPlayer(player)) {
            // Tell the game engine to switch to the map of the teleport index
            this.game.currMap = this.teleportIndex;
            
            this.game.player.worldX = 0;
            this.game.player.worldY = 0;
            this.game.mapInitialized = false;



            // Remove the portal from the game after entering it
            this.removeFromWorld = true;
        }
    }

    draw(ctx) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);
    }
}