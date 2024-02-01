class Projectile extends Entity{
    constructor(maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, angleX, angleY, duration, attackDamage, pushbackForce, spriteRotationSpeed) {
        super(maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, 0);
        this.angleX = angleX;
        this.angleY = angleY;
        this.duration = duration;
        this.game.addEntity(new AttackCirc(this.game, this,
            25,
            'playerAttack',
            0, 0,
            this.duration,
            spritePath,
            attackDamage,
            pushbackForce,
            spriteRotationSpeed));
    }

    //TODO how to remove after off screen or duration is over?
    update() {
        super.update();
        this.worldX += this.angleX * this.movementSpeed * this.game.clockTick;
        this.worldY += this.angleY * this.movementSpeed * this.game.clockTick;
        //effectively lose a duration
        this.currHP--;

        if (this.currHP <= 0) {
            this.isDead = true;
        }

    }

    draw() {

    }

}