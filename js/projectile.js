class Projectile extends Entity{
    constructor(game, atkPow, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, angleX, angleY, duration, radius, pushbackForce, spriteRotationSpeed, attackTick) {
        super(duration*60, duration*60, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, 0);
        this.angleX = angleX;
        this.angleY = angleY;
        this.duration = duration;
        this.game.addEntity(new AttackCirc(this.game, this,
            radius,
            boxType,
            0, 0,
            this.duration,
            null,
            atkPow,
            pushbackForce,
            spriteRotationSpeed, attackTick));

    }


    update() {
        super.update();
        console.log("projectile worldX: " + this.worldX + " projectile worldY: " + this.worldY);
        this.worldX += this.angleX * this.movementSpeed * this.game.clockTick;
        this.worldY += this.angleY * this.movementSpeed * this.game.clockTick;
        //effectively lose a duration
        this.currHP--;

        if (this.currHP <= 0) {
            this.removeFromWorld = true;
        }
    }


}