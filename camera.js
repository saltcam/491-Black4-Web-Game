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
        // Center the camera on the player horizontally
        const center = this.player.calculateCenter();
        return center.x - this.width / 2 + 20;
    }

    set x(value) {
        this._x = value;
    }

    get y() {
        // Center the camera on the player vertically
        const center = this.player.calculateCenter();
        return center.y - this.height / 2 + 15;
    }

    set y(value) {
        this._y = value;
    }

    update() {
        this._x = this.player.worldX - this.width / 2;
        this._y = this.player.worldY - this.height / 2;
    }
}