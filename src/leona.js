class Leona {
    constructor(game) {
        this.game = game;
        this.animator = new Animator(ASSET_MANAGER.getAsset("./Leona.png"), 0, 0, 59, 130, 12, 1/10);

        this.x = 0;
        this.y = 0;
        this.speed = 260;
    };

    update() {
    this.x += this.speed*this.game.clockTick;
    if (this.x > 1024 - 59*2) this.x = 0;
    
    };

    draw(ctx) {
      this.animator.drawFrame(this.game.clockTick, ctx, this.x, this.y);
    };
}