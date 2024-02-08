class Weapon_staff extends Weapon {
    constructor(game) {
        super(game, "Staff", 1, 2,
            10, 10,
            15, 15,
            115, 115,
            1, 1,
            "./sprites/NecromancyStaff.png", "./sounds/SE_1.mp3", "./sounds/SE_1.mp3", 26, 70);

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

            let distX = clickPos.x - canvas.width/2;
            let distY = clickPos.y - canvas.height/2;
            //width="1440" height="810"

            const offsetDistance = Math.sqrt(distX*distX + distY*distY);
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;

            let xWorld = this.game.player.worldX + dx;
            let yWorld = this.game.player.worldY + dy;

            this.lastPrimaryAttackTime = currentTime;

            this.game.addEntity(new Projectile(this.game, this.primaryAttackDamage,
                xWorld + 7, yWorld + 7, 10, 10, "necromancyAttack", 0,
                "./sprites/exp_orb.png",
                0, 0, 17, 17, 3, 0.2, 10, 0, 0,
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

            let distX = clickPos.x - canvas.width/2;
            let distY = clickPos.y - canvas.height/2;
            //width="1440" height="810"

            const offsetDistance = Math.sqrt(distX*distX + distY*distY);
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;

            let xWorld = this.game.player.worldX + dx;
            let yWorld = this.game.player.worldY + dy;

            this.lastSecondAttackTime = currentTime;

            this.game.addEntity(new Projectile(this.game, this.secondaryAttackDamage,
                xWorld + 7, yWorld + 7, 10, 10, "explosionAttack", 0,
                "./sprites/exp_orb.png",
                0, 0, 17, 17, 3, 0.2, 10, 0, 0,
                this.secondaryAttackDuration, this.secondaryAttackRadius, this.secondaryAttackPushbackForce, 0, 1));
        }



    }

}