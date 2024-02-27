/** This class is simply used to spawn gold coin sprites on the UI when the player collects gold. */
class Gold_Coin_UI {
    constructor(game, worldX, worldY, speed = 750, accelerationFactor = 1.01) {
        this.game = game;
        this.worldX = worldX;
        this.worldY = worldY;
        this.speed = speed;
        this.boundingBox = new BoundingBox(0, 0, 5, 5, "item_coin");
        this.accelerationFactor = accelerationFactor;

        this.image = ASSET_MANAGER.getAsset("./sprites/object_coin.png");
        this.animator = new Animator(this.game, this.image, 0, 0, this.image.width, this.image.height, 1, 1, 0.25);

        this.collectionProximity = 25;
        this.readyX = false;
        this.readyY = false;

        // Store the target location
        this.targetLocation = {x: this.game.player.calculateCenter().x+600, y: this.game.player.calculateCenter().y-400};
    }

    /** Called every tick. */
    update() {
        this.targetLocation = {x: this.game.player.calculateCenter().x + 600, y: this.game.player.calculateCenter().y - 400};

        // Calculate the straight-line vector from the coin's current position to the target location
        let dirX = this.targetLocation.x - this.worldX;
        let dirY = this.targetLocation.y - this.worldY;
        let distance = Math.sqrt(dirX * dirX + dirY * dirY);

        // Early exit if the coin is close enough to be "collected"
        if (distance < this.collectionProximity) {
            this.game.player.addGold(1); // Add gold to the player's total
            this.removeFromWorld = true; // Remove the coin
            return;
        }

        // Normalize the direction vector
        if (distance > 0) {
            dirX /= distance;
            dirY /= distance;
        }

        // Adjust speed
        this.speed *= this.accelerationFactor;
        let moveDistance = this.speed * this.game.clockTick;

        // Calculate a "wiggle" factor using a sine wave
        // The frequency decreases as the coin gets closer to the target, creating a logarithmic curve effect
        const frequency = Math.max(1, Math.log(distance + 1)); // Prevent frequency from becoming too high
        const amplitude = 50; // Amplitude of the wiggle
        const wiggle = Math.sin(this.game.elapsedTime / frequency) * amplitude;

        // Apply the wiggle factor by rotating the direction vector
        const angleWiggle = Math.atan2(dirY, dirX) + wiggle * Math.PI / 180;
        dirX = Math.cos(angleWiggle);
        dirY = Math.sin(angleWiggle);

        // Update the coin's position with the "wiggled" direction
        this.worldX += dirX * moveDistance;
        this.worldY += dirY * moveDistance;
    }



    draw(ctx, game) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        // Draw normally if not rotating
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, "right");

        // Draw bounding box if needed
        this.boundingBox.draw(ctx, game);
    }
}