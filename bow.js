class Bow extends Weapon {
    constructor(game, name, primaryCool, secondCool) {
        super(game, name, primaryCool, secondCool);
    }

    performPrimaryAttack(player){

        const currentTime = this.game.timer.gameTime;

        // Removed the click check and just use the cooldown check
        if (currentTime - this.lastPrimaryAttackTime >= this.primaryCool) {
            const clickPos = this.game.mouse; // Use the current mouse position instead of the click position

            // Calculate the center of the character
            const center = player.calculateCenter();
            const screenXCenter = center.x - this.game.camera.x;
            const screenYCenter = center.y - this.game.camera.y;

            // Calculate the angle towards the mouse position
            let dx = clickPos.x - screenXCenter;
            let dy = clickPos.y - screenYCenter;
            this.attackAngle = Math.atan2(dy, dx);

            const offsetDistance = PRIMARY_ATTACK_RADIUS * 0.6;
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;


            this.attackDuration = 0.5; // Duration of the attack animation
            this.lastPrimaryAttackTime = currentTime;
            this.game.addEntity(new Projectile(1, 1, 50, this.game,
                player.worldX, player.worldY, 10, 10, "playerAttack", 5,
                "./sprites/exp_orb.png",
                0, 0, 17, 17, 3, 0.2, 1, dx, dy));
        }

    }

    performSecondaryAttack(player){
        const currentTime = this.game.timer.gameTime;

        // Removed the click check and just use the cooldown check
        if (currentTime - this.lastSecondAttackTime >= this.secondCool) {
            this.secondAttackDuration = 0.1; // Duration of the spin attack in seconds
            this.lastSecondAttackTime = currentTime;
            this.game.addEntity(new AttackCirc(this.game, player,
                SECONDARY_ATTACK_RADIUS,
                'playerAttack',
                0, 0,
                this.secondAttackDuration,
                null));
        }

    }

}