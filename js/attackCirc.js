class AttackCirc {

    /**
     *
     * @param game  The game engine
     * @param entity    The entity that this attack is being drawn from
     * @param radius    The radius of the attack
     * @param type 'playerAttack': does damage when colliding with enemy boundingBox
     *              'enemyAttack': does damage when colliding with player boundingBox
     *              'necromancyAttack': does damage when colliding with tombstone and enemy boundingBox
     * @param dx    x-offset from parent entity
     * @param dy    y-offset from parent entity
     * @param duration  How long in frames the attack animation stays on screen
     * @param attackSpritePath  The path of the attack sprite to overlay on this attackCirc
     * @param attackDamage  The damage done to targets.
     * @param delayedAttackDamage   The damage that is used if at the end of the duration if this was a warning attack circle (grey circle aka no damage)
     * @param damagePushbackForce    The pushback force applied to enemies that are hit by the attack.
     * @param spriteRotationSpeed   This should be defaulted to '0' if we don't want the sprite to be 'spinning' while drawn.
     * @param attackTick    How often this circle will tick damage to the things inside of it.
     */
    constructor(game, entity, radius, type, dx, dy, duration, attackSpritePath, attackDamage, delayedAttackDamage, damagePushbackForce, spriteRotationSpeed, attackTick) {
        this.game = game;
        // the entity the circle will attach to
        this.entity = entity;
        this.dx = dx;
        this.dy = dy;

        this.attackDamage = attackDamage;
        this.delayedAttackDamage = delayedAttackDamage;
        this.damagePushbackForce = damagePushbackForce;
        this.spriteRotationSpeed = spriteRotationSpeed;
        this.currentRotationAngle = 0; // Initial rotation angle

        // where the circle exists in the world
        this.worldX = this.entity.calculateCenter().x + this.dx;
        this.worldY = this.entity.calculateCenter().y + this.dy;
        this.radius = radius;
        this.type = type;

        // Do we draw the debug circle?
        this.drawCircle = false;

        // When this attack circle came to life
        this.startTime = game.elapsedTime;

        // Duration of the attack circle in seconds
        this.duration = duration;

        // Handle delayed attack logic
        if (this.delayedAttackDamage !== 0) {
            this.endTime = this.startTime + (duration * 1000);
            this.delayedEndTime = this.endTime + (0.66 * 1000);
        } else {
            this.endTime = this.startTime + (duration * 1000);
        }

        // Assign an attack sprite if we were passed one
        if (attackSpritePath) {
            this.attackSpritePath = ASSET_MANAGER.getAsset(attackSpritePath);
        }
        else {
            this.attackSpritePath = null;
        }

        //dummy box so collision doesn't get mad.
        this.boundingBox = new BoundingBox(0,0,0,0,'attack');

        // Properties to track cooldown of being able to damage the player
        this.attackCooldown = attackTick;    // in seconds
        this.lastAttackTime = 0;    // time since last attack

        // Set the initial fixed rotation angle based on the player's current angle (this prevents a bug where attack sprites rotate with the player character's movement input)
        if (spriteRotationSpeed) {
            this.fixedRotationAngle = Math.atan2(this.worldY - this.entity.calculateCenter().y, this.worldX - this.entity.calculateCenter().x) + Math.PI / 2;
        } else {
            this.fixedRotationAngle = 0;
        }
    }


    // changes world position to match its attached entity, offset by dx and dy values.
    update() {
        this.worldX = this.entity.calculateCenter().x + this.dx;
        this.worldY = this.entity.calculateCenter().y + this.dy;

        const currentTime = this.game.elapsedTime;

        // Check for the end of duration
        if (currentTime >= this.endTime) {
            if (this.delayedAttackDamage !== 0 && this.attackDamage === 0 && currentTime < this.delayedEndTime) {
                this.attackDamage = this.delayedAttackDamage;
                this.endTime = this.delayedEndTime;
                this.delayedAttackDamage = 0;
            } else {
                this.removeFromWorld = true;
                return;
            }
        }

        // Damage ticking logic
        if (this.attackDamage !== 0 && (currentTime - this.lastAttackTime >= this.attackCooldown * 1000)) { // Convert attackCooldown to milliseconds
            let damageDealt = false; // Flag to track if damage was dealt

            // Handling different attack types
            if (["playerAttack", "necromancyAttack", "explosionAttack"].includes(this.type)) {
                this.game.enemies.forEach(enemy => {
                    if (this.collisionDetection(enemy.boundingBox)) {
                        enemy.takeDamage(this.attackDamage);
                        this.pushEnemy(enemy);
                        damageDealt = true; // Set flag as true since damage was dealt
                    }
                });

                // Additional logic for specific types...
            } else if (this.type.includes("enemyAttack") && this.collisionDetection(this.game.player.boundingBox)) {
                this.game.player.takeDamage(this.attackDamage);
                damageDealt = true;
            }

            // Update lastAttackTime if damage was dealt
            if (damageDealt) {
                this.lastAttackTime = currentTime;
            }
        }

        // Update rotation for spinning sprites
        if (this.spriteRotationSpeed) {
            this.currentRotationAngle += this.spriteRotationSpeed;
        }
    }

    pushEnemy(enemy) {
        const pushDirection = {
            x: enemy.worldX - this.entity.worldX,
            y: enemy.worldY - this.entity.worldY
        };

        // Normalize the push direction
        const magnitude = Math.sqrt(pushDirection.x * pushDirection.x + pushDirection.y * pushDirection.y);
        pushDirection.x /= magnitude;
        pushDirection.y /= magnitude;

        // Apply the pushback
        const pushbackForce = this.damagePushbackForce;
        enemy.applyPushback(pushDirection.x * pushbackForce, pushDirection.y * pushbackForce);
    }

    /**
     * https://stackoverflow.com/questions/34345765/collision-detection-of-circle-and-rectangle
     *
     */

    collisionDetection(rect){
        var distX = Math.abs(this.worldX - rect.left - rect.width/2);
        var distY = Math.abs(this.worldY - rect.top - rect.height/2);

        if (distX > (rect.width/2 + this.radius)) { return false; }
        if (distY > (rect.height/2 + this.radius)) { return false; }

        if (distX <= (rect.width/2)) { return true; }
        if (distY <= (rect.height/2)) { return true; }

        // also test for corner collisions
        var dx= distX-rect.width / 2;
        var dy= distY-rect.height / 2;
        return (dx*dx+dy*dy<=(this.radius*this.radius));
    }

    draw(ctx) {
        const currentTime = this.game.elapsedTime;
        const lifeProgress = (currentTime - this.startTime) / (this.endTime - this.startTime);
        const opacity = Math.max(0, Math.min(1, 1 - lifeProgress)); // Ensure opacity is between 0 and 1

        // Draw the circle indicator for attacks if no sprite
        if (this.game.debugMode || this.drawCircle) {
            ctx.beginPath();
            // If this attack circle actually deals damage on collision, draw it as red
            if (this.attackDamage > 0) {
                ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
            }
            // Otherwise if zero, draw it white to indicate it does no damage
            else if (this.attackDamage === 0) {
                ctx.fillStyle = `rgba(255, 255, 255, 0.2)`; // Always 0.2 alpha because white (warning area) circles should not fade out
            }
            // Otherwise if below zero, draw it green to indicate it actually might heal?
            else if (this.attackDamage < 0) {
                ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`;
            }
            ctx.arc(this.worldX - this.game.camera.x, this.worldY - this.game.camera.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        // Draw the attack sprite if it exists
        if (this.attackSpritePath || this.game.debugMode) {
            const spriteWidth = this.radius * 2;
            const spriteHeight = this.radius * 2;

            // Save the current state of the canvas context
            ctx.save();

            // Calculate and set transparency based on remaining durations
            ctx.globalAlpha = opacity;

            // Translate context
            ctx.translate(this.worldX - this.game.camera.x, this.worldY - this.game.camera.y);

            let rotationAngle;

            // Check if sprite should spin
            if (this.spriteRotationSpeed === 0) {
                // Rotate based on mouse and player location/direction
                rotationAngle = Math.atan2(this.worldY - this.entity.calculateCenter().y, this.worldX - this.entity.calculateCenter().x) + Math.PI / 2;
            } else {
                // Rotate based on fixed rotation plus current rotation angle for spinning sprites
                rotationAngle = this.fixedRotationAngle + this.currentRotationAngle;
            }

            // Apply rotation
            ctx.rotate(rotationAngle);

            // Draw the attack sprite if it has one
            if (this.attackSpritePath) {
                ctx.drawImage(this.attackSpritePath, -spriteWidth / 2, -spriteHeight / 2, spriteWidth, spriteHeight);
            }

            // Restore the context
            ctx.restore()
        }
    }
}