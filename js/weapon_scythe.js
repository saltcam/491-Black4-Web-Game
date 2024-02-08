class Weapon_scythe extends Weapon{
    constructor(game) {
        super(game, "Scythe", 1, 2,
            30, 60,
            9, 14,
            110, 115,
            0.6, 0.85,
            "./sprites/weapon_scythe.png",
            "./sounds/SE_scythe_primary.mp3", "./sounds/SE_scythe_secondary.mp3", 30, 50);
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

            const offsetDistance = this.primaryAttackRadius * 0.45;
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;

            this.lastPrimaryAttackTime = currentTime;
            this.game.addEntity(new AttackCirc(this.game, player,
                this.primaryAttackRadius / 2,
                'playerAttack',
                dx, dy,
                this.primaryAttackDuration,
                "./sprites/weapon_scythe_primaryattack.png",
                this.primaryAttackDamage,
                this.primaryAttackPushbackForce,
                0, 1));
        }

    }

    performSecondaryAttack(player){
        const currentTime = this.game.timer.gameTime;

        // if true, perform the attack
        if (currentTime - this.lastSecondAttackTime >= this.secondCool) {
            ASSET_MANAGER.playAsset(this.secondarySound);
            this.lastSecondAttackTime = currentTime;
            this.game.addEntity(new AttackCirc(this.game, player,
                this.secondaryAttackRadius,
                'playerAttack',
                0, 0,
                this.secondaryAttackDuration,
                "./sprites/weapon_scythe_secondaryattack.png",
                this.secondaryAttackDamage,
                this.secondaryAttackPushbackForce,
                0.3, 1));
        }
    }
}