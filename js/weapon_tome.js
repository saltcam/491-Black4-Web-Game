class Weapon_tome extends Weapon {
    constructor(game) {
        super(game, "Tome", 1, 2,
            15, 15,
            5, 1,
            20, 115,
            2, 5,
            "./sprites/Tome.png", "./sounds/SE_1.mp3", "./sounds/SE_1.mp3", 40, 40);

    }

    performPrimaryAttack(player){

        const currentTime = this.game.timer.gameTime;

        // if true, perform the attack
        if (currentTime - this.lastPrimaryAttackTime >= this.primaryCool) {
            ASSET_MANAGER.playAsset(this.primarySound);
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

        // if true, perform the attack
        if (currentTime - this.lastSecondAttackTime >= this.secondCool) {
            ASSET_MANAGER.playAsset(this.secondarySound);
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