class Exp_Orb extends Entity {
    constructor(game, worldX, worldY, exp) {
        let size = Math.max(Math.min(0.3 * exp, 5), 1); // Ensure size is between 1 and 5
        super(1, 1, 0, game, worldX, worldY,
            17, 17, "orb", 0,
            "./sprites/exp_orb.png",
            0, 0, 17, 17, 3, 0.2, size, exp);
        this.maxSpeed = 1000; // Set the maximum speed
        this.acceleration = 7.5; // Acceleration rate towards the player
        this.currentSpeed = 0; // Starting speed
        this.isMovingTowardsPlayer = false; // Indicates whether the orb has started moving towards the player
        this.distanceToGetConsumed = 25; // How far from the player till he actually 'collects' this exp orb
    }

    update() {
        super.update();

        if (!this.game.player || this.isDead) {
            return;
        }

        // Calculate distance and direction to player
        const targetCenter = this.game.player.calculateCenter();
        const selfCenter = this.calculateCenter();
        const dirX = targetCenter.x - selfCenter.x;
        const dirY = targetCenter.y - selfCenter.y;
        this.dist = Math.sqrt(dirX * dirX + dirY * dirY);

        // Check if orb is within pickup range or has already started moving
        if (this.dist <= this.game.player.pickupRange || this.isMovingTowardsPlayer) {
            this.isMovingTowardsPlayer = true; // Set flag to true once orb starts moving
            const normX = dirX / this.dist; // Normalize direction
            const normY = dirY / this.dist;

            // Increase speed with acceleration until it reaches max speed
            this.currentSpeed += this.acceleration;
            this.currentSpeed = Math.min(this.currentSpeed, this.maxSpeed);

            // Apply movement
            this.worldX += normX * this.currentSpeed * this.game.clockTick;
            this.worldY += normY * this.currentSpeed * this.game.clockTick;
        }

        // Collect the orb if close enough to the player
        if (this.dist <= this.distanceToGetConsumed) {
            this.removeFromWorld = true;
            this.game.player.gainExp(this.exp);
        }

        // If the round is over, collect all remaining exp orbs
        if (this.game.roundOver) {
            this.isMovingTowardsPlayer = true;
        }
    }
}