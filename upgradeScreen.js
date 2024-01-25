// Class that represents the weapon upgrade screen in between maps
class upgradeScreen {
    constructor(game) {
        this.game = game;
        // Change background to whatever we want for the upgrade screen
        ASSET_MANAGER.queueDownload("./");
        this.dude = new Dude(game);
        this.game.addEntity(this.dude);
        this.game.addEntity(this.dude);
    }

    update() {
        this.dude.update();
    }

    draw(ctx) {
        const background = ASSET_MANAGER.getAsset("./");
        ctx.drawImage(background, 0, 0, ctx.canvas.width, ctx.canvas.height);
        this.dude.draw(ctx);

    }
}