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
            this.removeFromWorld = true;
            this.attackCirc.removeFromWorld = true;
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

    draw(ctx, game) {
        // If this attack type.includes("playerAttack_TomeAttack")
        this.game.player.weapons[1].upgrades.forEach(upgrade => {
            if (upgrade.name === "Expansion" && upgrade.active
                && this.attackCirc.type.includes("playerAttack_TomeAttack")) {
                if (this.attackCirc.radius !== this.attackCirc.savedRadius) {
                    this.animator.scale = this.initialScale * (this.attackCirc.radius / this.attackCirc.initialRadius);
                    this.attackCirc.savedRadius = this.attackCirc.radius;
                }
            }
        });

        super.draw(ctx, game);
    }
}