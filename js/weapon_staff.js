class Weapon_staff extends Weapon {
    constructor(game) {
        let upgrades = [
            new Upgrade("Attack Size +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_size.png"),
            new Upgrade("Primary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png"),
            new Upgrade("Secondary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png"),
            new Upgrade("Knockback +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_knockback.png")];

        super(game, "Staff", 1, 2,
            0, 0,
            5, 5,
            115, 115,
            1, 1,
            "./sprites/NecromancyStaff.png",
            "./sounds/SE_staff_primary.mp3", "./sounds/SE_staff_secondary.mp3", 26, 70, upgrades);
    }

    performPrimaryAttack(player) {
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

            let distX = clickPos.x - canvas.width / 2;
            let distY = clickPos.y - canvas.height / 2;
            //width="1440" height="810"

            const offsetDistance = Math.sqrt(distX * distX + distY * distY);
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;

            let xWorld = this.game.player.worldX + dx;
            let yWorld = this.game.player.worldY + dy;

            this.lastPrimaryAttackTime = currentTime;

            let newProjectile = this.game.addEntity(new Projectile(this.game, this.game.player.atkPow / 3,
                xWorld + 7, yWorld + 7, 10, 10, "necromancyAttack", 0,
                "./sprites/exp_orb.png",
                0, 0, 17, 17, 3, 0.2, 10, 0, 0,
                this.primaryAttackDuration, this.primaryAttackRadius, this.primaryAttackPushbackForce, 0, 1));
            newProjectile.attackCirc.pulsatingDamage = true;

        }
    }

    performSecondaryAttack(player) {
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

            let distX = clickPos.x - canvas.width / 2;
            let distY = clickPos.y - canvas.height / 2;
            //width="1440" height="810"

            const offsetDistance = Math.sqrt(distX * distX + distY * distY);
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;

            let xWorld = this.game.player.worldX + dx;
            let yWorld = this.game.player.worldY + dy;

            this.lastSecondAttackTime = currentTime;

            let newProjectile = this.game.addEntity(new Projectile(this.game, this.game.player.atkPow / 3,
                xWorld + 7, yWorld + 7, 10, 10, "explosionAttack", 0,
                "./sprites/exp_orb.png",
                0, 0, 17, 17, 3, 0.2, 10, 0, 0,
                this.secondaryAttackDuration, this.secondaryAttackRadius, this.secondaryAttackPushbackForce, 0, 1));
            newProjectile.attackCirc.pulsatingDamage = true;
        }
    }

    // Handles code for turning on upgrades (Generic and Specific)
    handleUpgrade() {
        for (let i = 0; i < this.upgrades.length; i++) {
            // If generic has been turned on
            if (this.upgrades[i].active && !this.upgrades[i].special) {
                switch (this.upgrades[i].name) {
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
                this.upgrades[i].active = false;
            }
        }
    }
}