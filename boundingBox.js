class BoundingBox {
    /**
     * @param x the top left of the box
     * @param y the top of the box
     * @param width the distance from the left to right sides of box
     * @param height the distance from top to bottom of box
     * @param type 'player': take damage when colliding with 'enemy' or 'enemyAttack'.
     *             'enemy': take damage when colliding with 'playerAttack'.
     *             'enemyAttack': boxes labeled 'player' take damage upon collision.
     *             'playerAttack': boxes labeled 'enemy' take damage upon collision.
     */
    //TODO is there a better way to handle box types?
    constructor(x, y, width, height, type) {
        this.left = x;
        this.top = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    // update the x and y values in case the entity moves
    update(newX, newY){
        this.x = newX;
        this.y = newY;
    }

    draw(ctx, game) {

        // draws the box for you to see
        ctx.beginPath();
        switch (this.type){
            case "player":
                ctx.strokeStyle = 'Blue';
                break;
            case "enemy":
                ctx.strokeStyle = 'Red';
                break;
            default: ctx.strokeStyle = 'White';
            break;
        }

            ctx.strokeRect(
                this.left,
                this.top,
                this.width,
                this.height);
            ctx.closePath();

    }

}