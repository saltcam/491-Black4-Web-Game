class Weapon_scythe extends Weapon{
    constructor(game) {
        //"./sprites/upgrade_size.png"
        let upgrades = [
            new Upgrade("Attack Size +10%", "Stackable, Multiplicative.", false, "./sprites/upgrade_size.png"),
            new Upgrade("Primary CD -10%", "Stackable, Multiplicative.", false, "./sprites/upgrade_reduce_cd.png"),
            new Upgrade("Secondary CD -10%", "Stackable, Multiplicative.", false,"./sprites/upgrade_reduce_cd.png"),
            new Upgrade("Knockback +10%", "Stackable, Multiplicative.", false, "./sprites/upgrade_size.png"),
            new Upgrade("Blood Scythe", "Unique: Scythe Attack Life Leech +15%.", true, "./sprites/upgrade_size.png"),
            new Upgrade("Dual Blade", "Unique: Primary Scythe attack hits behind you as well.", true, "./sprites/upgrade_size.png")];

        super(game, "Scythe", 1, 2,
            30, 60,
            9, 14,
            110, 115,
            0.6, 0.85,
            "./sprites/weapon_scythe.png",
            "./sounds/SE_scythe_primary.mp3", "./sounds/SE_scythe_secondary.mp3", 30, 50, upgrades);
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

    // handles generic upgrades, add a switch case for the index of your
    genericUpgrade(){

        for (let i = 0; i < this.upgradeList.length; i++) {
            if(this.upgradeList[i].active && !this.upgradeList[i].special){
                switch (this.upgradeList[i].name){
                    case "Attack Size +10%":
                        this.primaryAttackRadius *= 1.10;
                        this.secondaryAttackRadius *= 1.10;
                        break;
                    case "Primary CD -10%":
                        this.primaryCool *= 0.9;
                        break;
                    case "Secondary CD -10%":
                        this.secondCool *= 0.9;
                        break;
                }
                this.upgradeList[i].active = false;
            }

        }

    }
}