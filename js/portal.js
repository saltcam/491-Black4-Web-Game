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

        if (this.teleportIndex !== 0) {
            // Set roundOver to false now that we are on a new map (that is not rest area)
            this.game.roundOver = false;
        }

        // Reset the game clock to 0
        this.game.timer.reset();

        // Reset player dash cooldown
        this.game.player.currentDashCooldown = 0; // Dash is immediately ready
        this.game.player.lastDashTime = this.game.timer.gameTime - this.game.player.defaultDashCooldown; // Adjust if necessary

        // Reset weapon cooldowns for all weapons
        this.game.player.weapons.forEach(weapon => {
            weapon.lastPrimaryAttackTime = this.game.timer.gameTime - weapon.primaryCool;
            weapon.lastSecondAttackTime = this.game.timer.gameTime - weapon.secondCool;
        });

        // Temp win condition
        this.game.youWon = false;

        if (this.arrowPointer) {
            this.arrowPointer.removeFromWorld = true;
        }

        // Reset spawn system on map change
        this.game.SPAWN_SYSTEM = new Spawn_System(this.game);

        // Remove the portal from the game after entering it
        this.removeFromWorld = true;
    }

    draw(ctx) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);
    }
}