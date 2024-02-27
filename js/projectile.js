class Projectile extends Entity{
    constructor(game, atkPow, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, angleX, angleY, duration, radius, pushbackForce, spriteRotationSpeed, attackTick) {
        super(1, 1, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale, 0);
        this.debugName = "Projectile"; // For debug logging
        this.angleX = angleX;
        this.angleY = angleY;
        //console.log("Projectile summoned 1 attack circle!");
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
        this.bouncesLeft = 0; // How many bounces this projectile has left
        this.speed = speed;
        this.hitTargets = new Set();

        // For growing sprites
        this.initialScale = this.animator.scale;
    }

    bounceToNextTarget() {
        if (this.bouncesLeft > 0) {
            this.bouncesLeft--;
            this.maxHits--;
            const newTarget = this.closestTarget();
            if (newTarget && this.bouncesLeft > 0) {
                this.updateDirection(newTarget);
            }
        } else {
            //console.log("Projectile is setting it's child attack circle removeFromWorld! ID#3");
            this.attackCirc.removeFromWorld = true;
            this.removeFromWorld = true;
        }
    }

    closestTarget() {
        let closest = null;
        let closestDist = Infinity;
        this.game.enemies.forEach(enemy => {
            if (this.hitTargets.has(enemy)) return; // Skip enemies that have already been hit

            let dist = this.calcDist(enemy);
            if (dist < closestDist) {
                closest = enemy;
                closestDist = dist;
            }
        });
        return closest;
    }

    calcDist(target){

        const targetCenter = target.calculateCenter();
        const selfCenter = this.calculateCenter();

        // Calculate direction vector towards the target's center
        const dirX = targetCenter.x - selfCenter.x;
        const dirY = targetCenter.y - selfCenter.y;

        return Math.sqrt(dirX * dirX + dirY * dirY);

    }

    updateDirection(target) {
        const targetCenter = target.calculateCenter();
        const selfCenter = this.calculateCenter();

        // Calculate new direction vector towards the target
        let directionX = targetCenter.x - selfCenter.x;
        let directionY = targetCenter.y - selfCenter.y;
        let attackAngle = Math.atan2(directionY, directionX);

        directionX = Math.cos(attackAngle) * (20*0.06);
        directionY = Math.sin(attackAngle) * (20*0.06);

        this.angleX = directionX * Math.sqrt(this.movementSpeed);
        this.angleY = directionY * Math.sqrt(this.movementSpeed);
    }


    update() {
        super.update();

        if (this.attackCirc === null) {
            this.removeFromWorld = true;
        }
        // Delete this projectile when its attack circle is deleted.
        else if (this.attackCirc.removeFromWorld) {
            this.removeFromWorld = true;
        }

        // If we hit our max hits, then delete this projectile and it's attack circ
        if (this.maxHits === 0) {
            //console.log("Projectile is setting it's child attack circle removeFromWorld! ID#2");
            this.attackCirc.removeFromWorld = true;
            this.removeFromWorld = true;
        }

        // Calculate the delta time for consistent movement across different frame rates
        const deltaTime = this.game.clockTick;

        // Adjust the projectile's position based on its direction, speed, and delta time
        // This makes sure that the projectile moves at a consistent speed of 200 units/second when given the same movementSpeed value
        this.worldX += this.angleX * this.movementSpeed * deltaTime;
        this.worldY += this.angleY * this.movementSpeed * deltaTime;

    }

    relocate() {
        // Do not relocate projectiles!
    }

    draw(ctx, game) {
        if (this.game.player.weapons[1].upgrades[8].active
            && this.attackCirc.type.includes("playerAttack_TomeAttack")) {
            if (this.attackCirc.radius !== this.attackCirc.savedRadius) {
                this.animator.scale = this.initialScale * (this.attackCirc.radius / this.attackCirc.initialRadius);
                this.attackCirc.savedRadius = this.attackCirc.radius;
            }
        }

        super.draw(ctx, game);
    }
}