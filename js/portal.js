class Portal extends Entity {
    constructor(game, worldX, worldY) {
        super(1, 1, 0, game, worldX, worldY, 24, 58, "portal", 0,
            "./sprites/portal.png",
            1, 0, 24, 58, 4, 0.18, 2.5);
    }

    draw(ctx) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);
    }
}