class AttackCirc {

    /**
     *
     * @param game  The game engine
     * @param entity    The entity that this attack is being drawn from
     * @param radius    The radius of the attack
     * @param type 'playerAttack': does damage when colliding with enemy boundingBox
     *              'enemyAttack': does damage when colliding with player boundingBox
     * @param dx    x-offset from parent entity
     * @param dy    y-offset from parent entity
     * @param duration  How long in frames the attack animation stays on screen
     * @param attackSpritePath  The path of the attack sprite to overlay on this attackCirc
     */
    constructor(game, entity, radius, type, dx, dy, duration, attackSpritePath) {
        this.game = game;
        this.entity = entity;
        this.dx = dx;
        this.dy = dy;

        // where the circle exists in the world
        this.worldX = this.entity.calculateCenter().x + this.dx;
        this.worldY = this.entity.calculateCenter().y + this.dy;
        this.radius = radius;
        this.type = type;

        //60 equates to 1 second, when setting duration, set the amount of seconds you want.
        this.duration = duration * 60;

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
        this.attackCooldown = 1;    // in seconds
        this.lastAttackTime = 0;    // time since last attack
    }


    // changes world position to match its attached entity, offset by dx and dy values.
    update() {
        this.worldX = this.entity.calculateCenter().x + this.dx;
        this.worldY = this.entity.calculateCenter().y + this.dy;

        // reduce duration by 1 frame
        this.duration--;

        // Only do damage if a second has passed since damaging the enemy list last time
        const currentTime = this.game.timer.gameTime;

        if(currentTime - this.lastAttackTime >= this.attackCooldown) {
            // NOTE from Nick: Found a cleaner way to implement the 'that' variable, without having a 'that' variable.
            // Iterate through the list of enemies and see if we are detecting a collision with their bounding box.
            this.game.enemies.forEach((enemy) => {
                if (this.collisionDetection(enemy.boundingBox)) {
                    //console.log("COLLIDE!");
                    enemy.takeDamage(50);
                    this.lastAttackTime = currentTime; // Update last attack time
                }
            });
        }

        //damaging any enemies colliding with this attackCirc
        // for (let i = 0; i < this.game.entities.length - 1; i++) {
        //     console.log("i: " + i);
        //     console.log("length: " + this.game.entities.length);
        //     if(this.game.entities[i].boundingBox.type === 'enemy' && this.collisionDetection(this.game.entities[i].boundingBox)) {
        //         console.log("COLLIDE!");
        //         this.game.entities[i].takeDamage(50);
        //     }
        // }

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
        var dx=distX-rect.width/2;
        var dy=distY-rect.height/2;
        return (dx*dx+dy*dy<=(this.radius*this.radius));
    }

    // for debugging
    draw(ctx) {
        // Draw the circle indicator attacks if no sprite
        if (1) {
            ctx.beginPath();
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
            ctx.arc(
                this.worldX - this.game.camera.x,
                this.worldY - this.game.camera.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        // Otherwise, no indicator circle, just draw the sprite
        if (this.attackSpritePath) {
            const spriteWidth = this.radius * 2;
            const spriteHeight = this.radius * 2;
            const spriteX = this.worldX - this.game.camera.x - this.radius;
            const spriteY = this.worldY - this.game.camera.y - this.radius;

            // Calculate the angle towards the player
            const playerCenter = this.entity.calculateCenter();
            const angle = Math.atan2(spriteY - playerCenter.y, spriteX - playerCenter.x);

            // Save the current state of the canvas context
            ctx.save();

            // Translate the context to the sprite's position and rotate it
            ctx.translate(spriteX, spriteY);
            ctx.rotate(angle);

            ctx.drawImage(this.attackSpritePath, spriteX, spriteY, spriteWidth, spriteHeight);

            // Restore the context to its original state
            ctx.restore();
        }
    }
}