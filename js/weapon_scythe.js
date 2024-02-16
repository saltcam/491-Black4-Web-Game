class Weapon_scythe extends Weapon{
    constructor(game) {
        //"./sprites/upgrade_size.png"
        let upgrades = [
            new Upgrade("Attack Size +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_size.png"),
            new Upgrade("Primary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png"),
            new Upgrade("Secondary CD -10%", "(Stackable, Multiplicative).", false,"./sprites/upgrade_reduce_cd.png"),
            new Upgrade("Knockback +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_knockback.png"),
            new Upgrade("Blood Scythe", "(Unique) Life Leech +15%.", true, "./sprites/upgrade_blood_scythe.png"),
            new Upgrade("Dual Blade", "(Unique) Primary attack behind too.", true, "./sprites/upgrade_dual_blade.png")];

        super(game, "Scythe", 1, 2,
            0, 0,
            5, 10,
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
                this.game.player.atkPow, 0,
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
                this.game.player.atkPow*2, 0,
                this.secondaryAttackPushbackForce,
                0.3, 1));
        }
    }

    // Handles code for turning on upgrades (Generic and Specific)
    handleUpgrade(){
        for (let i = 0; i < this.upgradeList.length; i++) {
            // If generic has been turned on
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
                    case "Knockback +10%":
                        this.primaryAttackPushbackForce *= 1.1;
                        this.secondaryAttackPushbackForce *= 1.1;
                        break;
                }
                // Set generic to not active so it can be re-used/activated in the future
                this.upgradeList[i].active = false;
            }
            else if(this.upgradeList[i].active && this.upgradeList[i].special){
                switch (this.upgradeList[i].name){
                    case "Blood Scythe":
                        // Switch weapon to blood scythe sprite
                        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_blood_scythe.png"), 0, 0, 30, 50, 1, 1);
                        this.spritePath = "./sprites/weapon_blood_scythe.png";
                        // Set upgrade sprites to their relevant blood scythe variants
                        this.upgradeList.forEach(upgrade => {
                            if (upgrade.name === "Dual Blade" && upgrade.active) {
                                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_blood_scythe_dual.png"), 0, 0, 41, 49, 1, 1);
                                this.spritePath = "./sprites/weapon_blood_scythe_dual.png";
                            }
                            else if (upgrade.name === "Dual Blade" && !upgrade.active){
                                upgrade.sprite = "./sprites/upgrade_dual_blade(blood).png";
                                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_blood_scythe.png"), 0, 0, 41, 49, 1, 1);
                                this.spritePath = "./sprites/weapon_blood_scythe.png";
                            }
                        });
                        break;
                    case "Dual Blade":
                        // Set upgrade sprites to their relevant blood scythe variants
                        this.upgradeList.forEach(upgrade => {
                            if (upgrade.name === "Blood Scythe" && upgrade.active) {
                                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_blood_scythe_dual.png"), 0, 0, 41, 49, 1, 1);
                                this.spritePath = "./sprites/weapon_blood_scythe_dual.png";
                            }
                            else if (upgrade.name === "Blood Scythe" && !upgrade.active){
                                upgrade.sprite = "./sprites/upgrade_blood_scythe(dual).png";
                                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_scythe_dual.png"), 0, 0, 41, 49, 1, 1);
                                this.spritePath = "./sprites/weapon_scythe_dual.png";
                            }
                        });
                        break;
                }
            }
        }

    }
}