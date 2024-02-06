class Weapon_tome extends Weapon {
    constructor(game, spritePath) {
        super(game, "Tome", 1, 2,
            15, 15,
            5, 1,
            20, 115,
            2, 5,
            spritePath);
        //
        // this.primaryAttackDamage = 15;
        // this.secondaryAttackDamage = 15;
        //
        // this.primaryAttackPushbackForce = 9;
        // this.secondaryAttackPushbackForce = 1;
        //
        // this.primaryAttackRadius = 20;
        // this.secondaryAttackRadius = 115;
        //
        // this.primaryAttackDuration = 2; // Duration of the attack animation
        // this.secondaryAttackDuration = 5; // Duration of the attack in seconds
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

            const offsetDistance = this.primaryAttackRadius * 0.6;
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;


            this.lastPrimaryAttackTime = currentTime;
            this.game.addEntity(new Projectile(this.game, this.primaryAttackDamage,
                player.worldX, player.worldY, 10, 10, "playerAttack", 30,
                "./sprites/exp_orb.png",
                0, 0, 17, 17, 3, 0.2, 2, dx, dy,
                this.primaryAttackDuration, this.primaryAttackRadius, this.primaryAttackPushbackForce, 0, 1));
        }
    }

    performSecondaryAttack(player){
        const currentTime = this.game.timer.gameTime;

        // Removed the click check and just use the cooldown check
        if (currentTime - this.lastSecondAttackTime >= this.secondCool) {
            const clickPos = this.game.mouse; // Use the current mouse position instead of the click position

            // Calculate the center of the character
            const center = player.calculateCenter();
            const screenXCenter = center.x - this.game.camera.x;
            const screenYCenter = center.y - this.game.camera.y;

            // Calculate the angle towards the mouse position
            let dx = clickPos.x - screenXCenter;
            let dy = clickPos.y - screenYCenter;
            this.attackAngle = Math.atan2(dy, dx);

            const offsetDistance = this.secondaryAttackRadius * 0.6;
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;


            this.lastSecondAttackTime = currentTime;
            this.game.addEntity(new Projectile(this.game, this.secondaryAttackDamage,
                player.worldX, player.worldY, 10, 10, "playerAttack", 2,
                "./sprites/exp_orb.png",
                0, 0, 17, 17, 3, 0.2, 10, dx, dy,
                this.secondaryAttackDuration, this.secondaryAttackRadius, this.secondaryAttackPushbackForce, 0, 0.3));
        }



    }

}