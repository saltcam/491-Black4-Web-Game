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
     * @param damagePushbackForce    The pushback force applied to enemies that are hit by the attack.
     * @param spriteRotationSpeed   This should be defaulted to '0' if we don't want the sprite to be 'spinning' while drawn.
     * @param attackTick    How often this circle will tick damage to the things inside of it.
     */
    constructor(game, entity, radius, type, dx, dy, duration, attackSpritePath, attackDamage, damagePushbackForce, spriteRotationSpeed, attackTick) {
        this.game = game;
        // the entity the circle will attach to
        this.entity = entity;
        this.dx = dx;
        this.dy = dy;

        this.attackDamage = attackDamage;
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

        //60 equates to 1 second, when setting duration, set the amount of seconds you want.
        this.duration = duration * 60;

        // Assign an attack sprite if we were passed one
        if (attackSpritePath) {
            this.attackSpritePath = ASSET_MANAGER.getAsset(attackSpritePath);
        }
        else {
            this.attackSpritePath = null;
        }

        // Store the initial duration for transparency calculation
        this.initialDuration = duration * 60;

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

        // reduce duration by 1 frame
        this.duration--;

        // Only do damage if a second has passed since damaging the enemy list last time
        const currentTime = this.game.timer.gameTime;

        if (this.type === "playerAttack" || this.type === "necromancyAttack" || this.type === "explosionAttack") {
            if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                //iterates through all enemies and deals damage to them if the attack is of player origin.
                this.game.enemies.forEach((enemy) => {
                    if (this.collisionDetection(enemy.boundingBox)) {
                        // Push the enemy away
                        this.pushEnemy(enemy);
                        enemy.takeDamage(this.attackDamage); // example damage value
                        this.lastAttackTime = currentTime;
                    }
                });
                // iterates through all tombstones and deletes them if the attack is from the staff weapon or an explosion.
                this.game.objects.forEach((object) => {
                    if (this.collisionDetection(object.boundingBox) && object.boundingBox.type === "tombstone") {

                        switch(this.type) {
                            case "necromancyAttack":
                                //TODO create allies
                                object.removeFromWorld = true;
                                this.lastAttackTime = currentTime;
                                break;
                            case "explosionAttack":
                                // TODO create explosions
                                object.removeFromWorld = true;
                                this.lastAttackTime = currentTime;
                                break;
                            default:
                                console.log("Tombstone hit with something else");
                        }
                        //console.log("necromancy!");
                        // Push the enemy away
                        //this.pushEnemy(enemy);

                    }
                });
            }
        }
        else if ((currentTime - this.lastAttackTime >= this.attackCooldown) && this.type === "enemyAttack" && this.collisionDetection(this.game.player.boundingBox)) {
            this.game.player.takeDamage(this.attackDamage);
            this.lastAttackTime = currentTime;
        }

        // Update rotation angle for spinning sprites
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

    // for debugging
    draw(ctx) {
        // Draw the circle indicator for attacks if no sprite
        if (this.game.debugMode || this.drawCircle) {
            // Calculate opacity based on remaining duration, starting from 0.2 and fading to 0
            const opacity = (this.duration / this.initialDuration) * 0.2;

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
            else if (this.attackDamage === 0) {
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

            // Calculate and set transparency based on remaining duration
            ctx.globalAlpha = this.duration / this.initialDuration;

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
            ctx.restore();
        }
    }
}