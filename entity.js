class Entity {
    /**
     *
     * @param game game engine
     * @param worldX where the entity is on the map horizontally
     * @param worldY where the entity is on the map vertically
     * @param boxWidth width of the entity
     * @param boxHeight
     * @param speed
     * @param boxType 'player': take damage when colliding with 'enemy' or 'enemyAttack'.
     *             'enemy': take damage when colliding with 'playerAttack'.
     *             'enemyAttack': boxes labeled 'player' take damage upon collision.
     *             'playerAttack': boxes labeled 'enemy' take damage upon collision.
     * @param spritePath
     * @param animXStart
     * @param animYStart
     * @param animW
     * @param animH
     * @param animFCount
     * @param animFDur
     */
    constructor(game, worldX, worldY, boxWidth, boxHeight, boxType, speed, spritePath, animXStart, animYStart, animW, animH, animFCount, animFDur){
        this.game = game;
        this.boundingBox = new BoundingBox(worldX, worldY, boxWidth, boxHeight, boxType);
        this.animator = new Animator(ASSET_MANAGER.getAsset(spritePath), animXStart, animYStart, animW, animH, animFCount, animFDur);
        this.movementSpeed = speed;
        this.worldX = worldX;
        this.worldY = worldY;
    }

}