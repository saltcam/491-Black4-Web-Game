class Map_object extends Entity {
    constructor(game, worldX, worldY, boxWidth, boxHeight, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale) {
        super(0, 0, 0, game, worldX, worldY, boxWidth, boxHeight, "object", 0, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale);
    }

    draw(ctx) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);
    }
}