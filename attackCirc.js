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
     */
    constructor(game, entity, radius, type, dx, dy, duration) {
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

        //dummy box so collision doesn't get mad.
        this.boundingBox = new BoundingBox(0,0,0,0,'attack');
    }


    // changes world position to match its attached entity, offset by dx and dy values.
    update() {

        this.worldX = this.entity.calculateCenter().x + this.dx;
        this.worldY = this.entity.calculateCenter().y + this.dy;

        // reduce duration by 1 frame
        this.duration--;

        // NOTE from Nick: Found a cleaner way to implement the 'that' variable, without having a 'that' variable.
        // Iterate through the list of enemies and see if we are detecting a collision with their bounding box.
        this.game.enemies.forEach((enemy) => {
            if(this.collisionDetection(enemy.boundingBox)) {
                console.log("COLLIDE!");
                enemy.takeDamage(50);
            }
        });

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

        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.arc(
            this.worldX - this.game.camera.x,
            this.worldY - this.game.camera.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

    }
}