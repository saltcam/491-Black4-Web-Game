class Portal extends Entity {
    constructor(game, worldX, worldY, teleportIndex) {
        super(1, 1, 0, game, worldX, worldY, 1, 25, "portal", 0,
            "./sprites/portal.png",
            1, 0, 24, 58, 4, 0.18, 2.5);

        this.teleportIndex = teleportIndex;
    }

    collidesWithPlayer(player) {
        return this.boundingBox.isColliding(player.boundingBox);
    }

    handlePlayerInteraction(player) {
        if (this.collidesWithPlayer(player)) {
            // Trigger screen fade-to-black animation
            this.game.fadeState = 'in';
            this.game.fadeToBlack = true;

            // Disable player controls while teleporting (fade-to-black0 sequence is happening.
            this.game.player.controlsEnabled = false;

            // Set up map switching as a post-fade-in action
            this.game.fadeInCompleteAction = () => {
                this.switchMap();
            };
        }
    }

    switchMap() {
        // Pause the game clock if we are going into areas like Rest Area
        if (this.teleportIndex === 0) {
            this.game.pauseClock = true;
        }
        else {
            this.game.pauseClock = false;
        }

        // Reset clock on entering new map
        this.game.startTime = Date.now();

        // Tell the game engine to switch to the map of the teleport index
        this.game.currMap = this.teleportIndex;

        // Delete old map stuff
        // Delete 'other' entities
        for (let i = 0; i < this.game.entities.length; i++) {
            this.game.entities[i].removeFromWorld = true;
        }

        // Delete 'object' entities
        for (let i = 0; i < this.game.objects.length; i++) {
            this.game.objects[i].removeFromWorld = true;
        }

        // Delete any lingering 'enemy' entities (there shouldn't be any at this point, but just in-case)
        for (let i = 0; i < this.game.enemies.length; i++) {
            this.game.enemies[i].removeFromWorld = true;
        }

        // Delete any lingering 'attack' entities
        for (let i = 0; i < this.game.attacks.length; i++) {
            this.game.attacks[i].removeFromWorld = true;
        }

        // Place player at world center
        this.game.player.worldX = 0;
        this.game.player.worldY = 0;

        // Reset map stuff
        this.game.mapInitialized = false;
        this.game.mapObjectsInitialized = false;

        // Set roundOver to false now that we are on a new map
        this.roundOver = false;

        // Remove the portal from the game after entering it
        this.removeFromWorld = true;
    }

    draw(ctx) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);
    }
}