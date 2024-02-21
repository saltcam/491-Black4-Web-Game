/** This class will be used to draw a UI arrow pointer to off-screen important objects like portals or chests. */
class Arrow_Pointer {
    /**
     * Default Constructor.
     * @param   entity  The entity being tracked/pointed to.
     * @param   game    The game engine.
     * @param arrowSpritePath
     */
    constructor(entity, game, arrowSpritePath = "./sprites/arrow_pointer.png") {
        this.game = game;
        this.trackedEntity = entity; //entity.worldX gives the X-coord, worldY gives the Y-coord.
        this.staticArrowSpritePath = arrowSpritePath; // Defaulted to pointing right
        this.canvasWidth = 1440; // Canvas width
        this.canvasHeight = 810; // Canvas height
        this.boundingBox = new BoundingBox(1, 1, 1, 1, "arrowPointer"); //dummy bounding box
        this.animator = new Animator()
        entity.arrowPointer = this; // Attach this arrow pointer to the entity
    }

    draw(ctx) {
        const entityCenter = this.trackedEntity.calculateCenter();
        const playerCenter = this.game.player.calculateCenter();

        // Calculate entity's position relative to the camera viewport
        const camera = this.game.camera;
        const relativeX = entityCenter.x - camera.x;
        const relativeY = entityCenter.y - camera.y;

        // Define the scale of the arrow sprite and how far from the border it should be
        const arrowScale = 0.35; // Scale down to 50% of the original size
        const additionalMargin = 10; // Adjust this value to move the arrow closer or further from the border

        // Check if the entity is outside the viewport
        if (relativeX < 0 || relativeX > this.canvasWidth || relativeY < 0 || relativeY > this.canvasHeight) {
            let arrowX = 0;
            let arrowY = 0;
            const margin = 20 + additionalMargin; // Margin from the edge of the screen

            // Determine the primary direction
            const dx = entityCenter.x - playerCenter.x;
            const dy = entityCenter.y - playerCenter.y;
            let direction;

            if (Math.abs(dx) > Math.abs(dy)) {
                direction = dx > 0 ? 'right' : 'left';
            } else {
                direction = dy > 0 ? 'down' : 'up';
            }

            // Calculate arrow's position based on the direction
            switch (direction) {
                case 'left':
                    arrowX = margin;
                    arrowY = ((entityCenter.y - camera.y) / this.canvasHeight) * this.canvasHeight;
                    break;
                case 'right':
                    arrowX = this.canvasWidth - margin;
                    arrowY = ((entityCenter.y - camera.y) / this.canvasHeight) * this.canvasHeight;
                    break;
                case 'up':
                    arrowX = ((entityCenter.x - camera.x) / this.canvasWidth) * this.canvasWidth;
                    arrowY = margin;
                    break;
                case 'down':
                    arrowX = ((entityCenter.x - camera.x) / this.canvasWidth) * this.canvasWidth;
                    arrowY = this.canvasHeight - margin;
                    break;
            }

            // Keep the arrow within the screen bounds
            arrowX = Math.max(margin, Math.min(this.canvasWidth - margin, arrowX));
            arrowY = Math.max(margin, Math.min(this.canvasHeight - margin, arrowY));

            // Load the correct arrow sprite based on the direction
            const arrowSprite = ASSET_MANAGER.getAsset(this.staticArrowSpritePath); // Adjust this to select different sprites if needed

            // Draw the arrow
            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.scale(arrowScale, arrowScale); // Apply scaling

            // Check for corner cases and adjust rotation accordingly
            const isCorner = (arrowX === margin && arrowY === margin) || // Top-left corner
                (arrowX === this.canvasWidth - margin && arrowY === margin) || // Top-right corner
                (arrowX === margin && arrowY === this.canvasHeight - margin) || // Bottom-left corner
                (arrowX === this.canvasWidth - margin && arrowY === this.canvasHeight - margin); // Bottom-right corner

            if (isCorner) {
                // Diagonal rotation for corners
                if (arrowX === margin && arrowY === margin) ctx.rotate(5 * Math.PI / 4); // Top-left corner
                else if (arrowX === this.canvasWidth - margin && arrowY === margin) ctx.rotate(-Math.PI / 4); // Top-right corner
                else if (arrowX === margin && arrowY === this.canvasHeight - margin) ctx.rotate(3 * Math.PI / 4); // Bottom-left corner
                else ctx.rotate(Math.PI / 4); // Bottom-right corner
            } else {
                // Adjust rotation or sprite based on direction
                switch (direction) {
                    case 'left':
                        ctx.rotate(Math.PI); // 180 degrees
                        break;
                    case 'up':
                        ctx.rotate(-Math.PI / 2); // -90 degrees
                        break;
                    case 'down':
                        ctx.rotate(Math.PI / 2); // 90 degrees
                        break;
                    // No rotation for 'right' as it's the default direction
                }
            }

            ctx.drawImage(arrowSprite, -arrowSprite.width / 2, -arrowSprite.height / 2);
            ctx.restore();
        }
    }
}