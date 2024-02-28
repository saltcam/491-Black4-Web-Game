class Portal extends Entity {
    constructor(game, worldX, worldY, teleportIndex, spriteSheet = "./sprites/portal.png", animH = 58) {
        super(1, 1, 0, game, worldX, worldY, 1, 25, "portal", 0,
            spriteSheet,
            1, 0, 24, animH, 4, 0.18, 2.5);
        this.debugName = "Portal("+this.boundingBox.type+")";
        this.teleportIndex = teleportIndex;
        this.interactionInitiated = false;
    }

    collidesWithPlayer(player) {
        return this.boundingBox.isColliding(player.boundingBox);
    }

    handlePlayerInteraction(player) {
        if (this.collidesWithPlayer(player) && !this.interactionInitiated) {
            this.interactionInitiated = true; // Set the flag to true to prevent re-entry

            this.game.fadeState = 'in';
            this.game.fadeToBlack = true;
            this.game.player.controlsEnabled = false;

            // Set up map switching as a post-fade-in action
            this.game.fadeInCompleteAction = () => {
                this.game.switchMap(this.teleportIndex);
            };
        }
    }

    draw(ctx) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);
    }
}