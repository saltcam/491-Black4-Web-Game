/**
 * This is the class that will control the camera for the game.
 * Basically determines where the canvas will be drawing the world.
 * This should always be focusing the player in the center of the canvas.
 */
class Camera {
    /**
     * Constructs a Camera object.
     *
     * @param player    The player object which the camera will follow.
     * @param canvasWidth   The width of the canvas (viewport)
     * @param canvasHeight  The height of the canvas (viewport)
     */
    constructor(player, canvasWidth, canvasHeight) {
        this.player = player;           // Reference to the player object
        this.width = canvasWidth;       // Width of the camera's viewport
        this.height = canvasHeight;     // Height of the camera's viewport
    }

    get x() {
        // Center the camera on the middle of the player horizontally
        return this.player.worldX + this.player.animator.width / 2 - this.width / 2;
    }

    get y() {
        // Center the camera on the middle of the player vertically
        return this.player.worldY + this.player.animator.height / 2 - this.height / 2;
    }
}