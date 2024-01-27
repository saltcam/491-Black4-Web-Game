class Enemy_Contact extends Entity {
    constructor(name, maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale) {
        super(maxHP, currHP, atkPow, game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur, scale);

        this.name = name;
        this.lastMove = "right"; // Default direction
        this.isMoving = false;  // Is the character currently moving?
        this.currentAnimation = "standing"; // Starts as "standing" and changes to "walking" when the character moves
        this.boundingBox.drawBoundingBox = false;
    }

    checkCollisionAndDealDamage() {
        const player = this.game.player;
        if (this.boundingBox.isColliding(player.boundingBox)) {
            player.takeDamage(this.atkPow);
        }

    }

    // this is the movement pattern for enemies that just approach the player
    update() {
        super.update();

        // Early exit if the player does not exist or enemy is dead
        if (!this.game.player || this.isDead) {
            return;
        }

        // If health hits 0 or below, this entity is declared dead
        if (this.currHP <= 0)
        {
            this.isDead = true;
        }

        const player = this.game.player;

        // Determine the direction to face based on the player's position
        if (player.worldX < this.worldX) {
            // Player is to the left, face left
            this.lastMove = "left";
        } else if (player.worldX > this.worldX) {
            // Player is to the right, face right
            this.lastMove = "right";
        }

        const targetDirection = this.calcTargetAngle(player);

        // Check for collisions between enemies
        for (let i = 0; i < this.game.enemies.length; i++) {
            for (let j = i + 1; j < this.game.enemies.length; j++) {
                let enemy1 = this.game.enemies[i];
                let enemy2 = this.game.enemies[j];

                if (enemy1.boundingBox.isColliding(enemy2.boundingBox)) {
                    this.respondToCollision(enemy1, enemy2);
                }
            }
        }

        // Apply movement based on the direction and the zombie's speed
        this.worldX += targetDirection.x * this.movementSpeed * this.game.clockTick;
        this.worldY += targetDirection.y * this.movementSpeed * this.game.clockTick;

        // Calculate the scaled center of the sprite
        const scaledCenterX = this.worldX + (this.animator.width) / 2;
        const scaledCenterY = this.worldY + (this.animator.height) / 2;

        // Update the bounding box to be centered around the scaled sprite
        const boxWidth = this.boundingBox.width;
        const boxHeight = this.boundingBox.height;
        this.boundingBox.updateCentered(scaledCenterX, scaledCenterY, boxWidth, boxHeight);

        this.checkCollisionAndDealDamage();
    }

    respondToCollision(enemy1, enemy2) {
        // Calculate the direction vector between the two enemies
        const directionX = enemy1.worldX - enemy2.worldX;
        const directionY = enemy1.worldY - enemy2.worldY;

        // Normalize the direction vector
        const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
        const normalizedDirectionX = directionX / magnitude;
        const normalizedDirectionY = directionY / magnitude;

        // Set a small bounce distance
        const bounceDistance = 1; // Adjust this value as needed

        // Move each enemy away from the other by the bounce distance
        enemy1.worldX += normalizedDirectionX * bounceDistance;
        enemy1.worldY += normalizedDirectionY * bounceDistance;
        enemy2.worldX -= normalizedDirectionX * bounceDistance;
        enemy2.worldY -= normalizedDirectionY * bounceDistance;

        // Update the bounding boxes to reflect the new positions
        enemy1.boundingBox.updateCentered(enemy1.worldX, enemy1.worldY, enemy1.boundingBox.width, enemy1.boundingBox.height);
        enemy2.boundingBox.updateCentered(enemy2.worldX, enemy2.worldY, enemy2.boundingBox.width, enemy2.boundingBox.height);
    }

    draw(ctx, game) {
        let screenX = this.worldX - this.game.camera.x;
        let screenY = this.worldY - this.game.camera.y;

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, this.lastMove);

        this.boundingBox.draw(ctx, game);
    }
}