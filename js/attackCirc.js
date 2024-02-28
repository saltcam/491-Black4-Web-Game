const EXPLOSION_GROWTH = 5;
class AttackCirc {

    /**
     *
     * @param game  The game engine
     * @param entity    The entity that this attack is being drawn from
     * @param radius    The radius of the attack
     * @param type 'playerAttack': does damage when colliding with enemy boundingBox
     *              'enemyAttack': does damage when colliding with player boundingBox
     *              'playerAttack_NecromancyAttack': does damage when colliding with tombstone and enemy boundingBox
     *              'playerAttack_ExplosionAttack': does damage when colliding with tombstones and enemy bounding boxes. Meant to chain react.
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
        this.debugName = "AttackCirc("+type+")";
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
        this.startTime = game.elapsedTime / 1000;

        // Duration of the attack circle in seconds
        this.duration = duration;

        // Handle delayed attack logic
        if (this.delayedAttackDamage !== 0) {
            this.endTime = this.startTime + (duration);
            this.delayedEndTime = this.endTime + (0.66);
        } else {
            this.endTime = this.startTime + (duration);
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

        // Is this a normal attack or pulsating damage attack?
        // If normal, hit all enemies in collision but ONLY ONE time per enemy
        // If pulsating, then hit all enemies in collision on every 'attackTick'
        this.pulsatingDamage = false;

        // Initialization for normal attack functionality
        this.hitEntities = new Set(); // Tracks entities already hit if pulsatingDamage is false

        this.damageDealt = false;
        this.trackToEntity = true;

        this.lastGrowthTime = 0;
        this.growthCooldown = 0.00001;

        // For growing sprites
        this.initialRadius = this.radius;
        this.savedRadius = this.radius;

        // For ally healing
        this.lastAllyHealTime = 0;
        this.allyHealCooldown = 0.5;

        this.attackSound = null;
    }


    // changes world position to match its attached entity, offset by dx and dy values.
    update() {
        // Handle sound
        if (this.attackSound && this.attackDamage > 0) {
            ASSET_MANAGER.playAsset(this.attackSound, 0.5);
            this.attackSound = null;
        }
        const currentTime = this.game.elapsedTime / 1000;
        //console.log("ATTACKCIRC: Dur="+this.duration+"s, CurrTime="+(currentTime - this.startTime)+"s, rem="+this.removeFromWorld);
        if (this.trackToEntity) {
            this.worldX = this.entity.calculateCenter().x + this.dx;
            this.worldY = this.entity.calculateCenter().y + this.dy;
        }

        // increase in size each 1/60th of a second if of type explosion
        if (this.type === "playerAttack_ExplosionAttack" && ((currentTime - this.lastGrowthTime) >= 1/60)) {
            this.radius += EXPLOSION_GROWTH;
            this.lastGrowthTime = currentTime;
        }

        // Check for the end of duration and convert this attack to do damage if it has a delayedAttackDamage != 0
        if (currentTime >= this.endTime) {
            if (this.delayedAttackDamage !== 0 && this.attackDamage === 0 && currentTime < this.delayedEndTime) {
                this.attackDamage = this.delayedAttackDamage;
                this.endTime = this.delayedEndTime;
                this.delayedAttackDamage = 0;
            } else {
                //console.log("AttackCirc: currentTime(" + currentTime + ") < endTime(" + this.endTime + ") so setting removeFromWorld!");
                this.removeFromWorld = true;
                return;
            }
        }

        // Normal attack logic logic for player vs enemy
        if (!this.type.includes("enemy") && !this.pulsatingDamage && this.attackDamage > 0) {
            this.game.enemies.forEach(enemy => {
                if (!this.hitEntities.has(enemy) && this.collisionDetection(enemy.boundingBox) /* && (enemy.boundingBox.type !== "ally") */) {
                    if (this.attackDamage > 0) enemy.takeDamage(this.attackDamage, this.type);
                    else if (this.attackDamage < 0) enemy.heal(-this.attackDamage);

                    this.pushEnemy(enemy);
                    this.hitEntities.add(enemy);

                    // If we are attacking via a projectile, then --maxHits to track pierced targets
                    if (this.entity instanceof Projectile) {
                        if (this.entity instanceof Projectile && this.entity.bouncesLeft > 0) {
                            this.entity.hitTargets.add(enemy);
                            this.attackDamage *= 0.9;
                            this.entity.bounceToNextTarget();
                        } else {
                            this.entity.maxHits -= 1;
                        }
                    }
                }
            });


            if (this.type === "playerAttack_NecromancyAttack" || this.type === "playerAttack_ExplosionAttack") {
                //check all colliding allies and if an ally buffing upgrade is active to give them power/health

                    this.game.allies.forEach((ally) => {
                        if (this.collisionDetection(ally.boundingBox) && this.type === "playerAttack_NecromancyAttack") {
                            if (this.game.player.weapons[2].upgrades[8].active) {
                                ally.powerUp();
                            }
                            if (this.game.player.weapons[2].upgrades[9].active) {
                                if (currentTime - this.lastAllyHealTime >= this.allyHealCooldown) {
                                    ally.heal(ally.maxHP);
                                    this.lastAllyHealTime = currentTime;
                                }
                            }
                        }
                    });



                //handles collisions with tombstones
                this.game.objects.forEach((object) => {
                    if (this.collisionDetection(object.boundingBox) && object.boundingBox.type === "tombstone") {
                        switch (this.type) {
                            case "playerAttack_NecromancyAttack":
                                let enemyClass = 0;
                                if (this.game.player.weapons[2].upgrades[6].active) {   // if the player has the upgrade to summon ranged allies
                                   enemyClass = Math.floor(Math.random() * 2);
                                }
                                switch(enemyClass){
                                    case 0:
                                        this.game.addEntity(new Ally_Contact(
                                            "Ally", this.game.player.summonHealth, this.game.player.summonHealth,
                                            this.game.player.summonDamage, this.game, object.worldX, object.worldY, 17,
                                            29, "ally", this.game.player.summonSpeed, "./sprites/Ally_Contact_Walk.png",
                                            0, 0, 32, 28,
                                            8, 0.1, 2, 1));
                                        break;
                                    case 1:
                                        this.game.addEntity(new Ally_Ranged(
                                            "Ally", this.game.player.summonHealth, this.game.player.summonHealth,
                                            this.game.player.summonDamage, this.game, object.worldX, object.worldY, 17,
                                            29, "ally", this.game.player.summonSpeed, "./sprites/Ally_Ranged_Walk.png",
                                            0, 0, 32, 28,
                                            8, 0.1, 2, 1,
                                            3, 20, 20, false, 1, 0));
                                        break;
                                }

                                object.removeFromWorld = true;
                                this.lastAttackTime = currentTime;
                                break;
                            case "playerAttack_ExplosionAttack":
                                object.willExplode(this);
                                //object.removeFromWorld = true;
                                this.lastAttackTime = currentTime;
                                break;
                            default:
                                //console.log("Tombstone hit with something else");
                        }
                        //console.log("necromancy!");
                        // Push the enemy away
                        //this.pushEnemy(enemy);

                    }
                });
            }
        }
        // Enemy vs player
        else if (this.type.includes("enemy") && !this.pulsatingDamage && this.attackDamage > 0) {
            if (!this.damageDealt && this.collisionDetection(this.game.player.boundingBox)) {
                if (this.attackDamage > 0) this.game.player.takeDamage(this.attackDamage);
                else if (this.attackDamage < 0) this.game.player.heal(-this.attackDamage);

                // If we are attacking via a projectile, then --maxHits to track pierced targets
                if (this.entity instanceof Projectile) {
                    this.entity.maxHits -= 1;
                }

                this.damageDealt = true;
            }
        }
        // Attack ticking logic (pulsating damage, ex: Tome Secondary Attack)
        else if (this.pulsatingDamage && this.attackDamage !== 0 && (currentTime - this.lastAttackTime >= this.attackCooldown)) { // Convert attackCooldown to milliseconds
            this.damageDealt = false; // Flag to track if damage was dealt

            // Handling player vs enemy pulsating attack damage
            if (this.type.includes("playerAttack")) {
                this.game.enemies.forEach(enemy => {
                    if (this.collisionDetection(enemy.boundingBox) /*&& (enemy.boundingBox.type !== "ally")*/) {
                        if (this.attackDamage > 0) {
                            enemy.takeDamage(this.attackDamage, this.type);
                            this.pushEnemy(enemy);
                        }
                        else if (this.attackDamage < 0) {
                            enemy.heal(-this.attackDamage);
                        }

                        this.damageDealt = true; // Set flag as true since damage was dealt

                        // If we are attacking via a projectile, then --maxHits to track pierced targets
                        if (this.entity instanceof Projectile) {
                            this.entity.maxHits -= 1;
                        }
                    }
                });
            }
            // Handle enemy vs player pulsating attack damage
            else if (this.type.includes("enemyAttack") && this.collisionDetection(this.game.player.boundingBox)) {
                if (this.attackDamage > 0) this.game.player.takeDamage(this.attackDamage);
                else if (this.attackDamage < 0) this.game.player.heal(-this.attackDamage);
                this.damageDealt = true;
            }

            // Update lastAttackTime if damage was dealt
            if (this.damageDealt) {
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
        let distX = Math.abs(this.worldX - rect.left - rect.width/2);
        let distY = Math.abs(this.worldY - rect.top - rect.height/2);

        if (distX > (rect.width/2 + this.radius)) { return false; }
        if (distY > (rect.height/2 + this.radius)) { return false; }

        if (distX <= (rect.width/2)) { return true; }
        if (distY <= (rect.height/2)) { return true; }

        // also test for corner collisions
        let dx= distX-rect.width / 2;
        let dy= distY-rect.height / 2;
        return (dx*dx+dy*dy<=(this.radius*this.radius));
    }

    draw(ctx) {
        const currentTime = this.game.elapsedTime / 1000;
        const lifeProgress = (currentTime - this.startTime) / (this.endTime - this.startTime);
        const opacity = Math.max(0, Math.min(1, 1 - lifeProgress)); // Ensure opacity is between 0 and 1
        //console.log("Opacity = " + opacity);

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

            if (opacity === 0) {
                //console.log("AttackCirc is deleting settings its own removeFromWorld because OP===0");
                this.removeFromWorld = true;
            }

            // Restore the context
            ctx.restore()
        }
    }
}