class Projectile extends Entity{
    constructor(game, atkPow, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, angleX, angleY, duration, radius, pushbackForce, spriteRotationSpeed, attackTick) {
        super(1, 1, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, 0);
        this.angleX = angleX;
        this.angleY = angleY;
        this.attackCirc = this.game.addEntity(new AttackCirc(this.game, this,
            radius,
            boxType,
            0, 0,
            duration,
            null,
            atkPow, 0,
            pushbackForce,
            spriteRotationSpeed, attackTick));

        this.maxHits = -1;   // Effectively how many targets can this projectile pierce through, -1 means infinite hits
    }


    update() {
        super.update();

        // Delete this projectile when its attack circle is deleted.
        if (this.attackCirc.removeFromWorld) {
            this.removeFromWorld = true;
            return
        }

        // If we hit our max hits, then delete this projectile and it's attack circ
        if (this.maxHits === 0) {
            this.removeFromWorld = true;
            this.attackCirc.removeFromWorld = true;
            return;
        }

        // Calculate the delta time for consistent movement across different frame rates
        const deltaTime = this.game.clockTick;

        // Adjust the projectile's position based on its direction, speed, and delta time
        // This makes sure that the projectile moves at a consistent speed of 200 units/second when given the same movementSpeed value
        this.worldX += this.angleX * this.movementSpeed * deltaTime;
        this.worldY += this.angleY * this.movementSpeed * deltaTime;
    }
}