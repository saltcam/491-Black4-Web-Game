class Weapon_staff extends Weapon {
    constructor(game) {
        let upgrades = [
            new Upgrade("Attack Size +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_size.png", 75),
            new Upgrade("Primary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png", 35),
            new Upgrade("Secondary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png", 50),
            new Upgrade("Knockback +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_knockback.png", 25),
            new Upgrade("Corpse Explosion", "Enemies killed with explosions may explode.", true, "./sprites/upgrade_knockback.png", 25)];

        super(game, "Staff", 7, 7,
            0, 0,
            5, 5,
            115, 2,
            1, 0.5,
            "./sprites/NecromancyStaff.png",
            "./sounds/SE_staff_secondary.mp3", "./sounds/SE_staff_primary.mp3", 26, 70, upgrades);

        // Save these values for calculations later (for sprite scaling)
        this.initialPrimaryAttackRadius = 115;
        this.initialSecondaryAttackRadius = 2;
    }

    performPrimaryAttack(player, cheating) {
        // Change these values for balancing (If you don't see what you want to balance here, change it in the constructor)
        let defaultPrimaryDamage = player.atkPow / 4;

        const currentTime = this.game.timer.gameTime;

        // if true, perform the attack
        if ((currentTime - this.lastPrimaryAttackTime >= this.primaryCool) || cheating) {
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

            let newProjectile = this.game.addEntity(new Projectile(this.game, defaultPrimaryDamage,
                xWorld + 7, yWorld + 7, 10, 10, "necromancyAttack", 0,
                "./sprites/exp_orb.png",
                0, 0, 17, 17, 3, 0.2, 13 * (this.primaryAttackRadius/this.initialPrimaryAttackRadius), 0, 0,
                this.primaryAttackDuration, this.primaryAttackRadius, this.primaryAttackPushbackForce, 0, 1));
            newProjectile.attackCirc.pulsatingDamage = false;
        }
    }

    performSecondaryAttack(player, cheating) {
        // Change these values for balancing (If you don't see what you want to balance here, change it in the constructor)
        let defaultSecondaryDamage = player.atkPow / 2;

        const currentTime = this.game.timer.gameTime;

        // if true, perform the attack
        if ((currentTime - this.lastSecondAttackTime >= this.secondCool) || cheating) {
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

            let newProjectile = this.game.addEntity(new Projectile(this.game, defaultSecondaryDamage,
                xWorld + 7, yWorld + 7, 10, 10, "explosionAttack", 0,
                "./sprites/transparent.png",
                0, 0, 17, 17, 3, 0.001, 13 * (this.primaryAttackRadius/this.initialPrimaryAttackRadius), 0, 0,
                this.secondaryAttackDuration, this.secondaryAttackRadius, this.secondaryAttackPushbackForce, 0, 1));
            newProjectile.attackCirc.pulsatingDamage = false;
            newProjectile.attackCirc.drawCircle = true;
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
                        this.secondaryAttackDuration *= 1.10;
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
                // Set generic to not active so that it can be re-used/activated in the future
                this.upgrades[i].active = false;
            }
        }
    }
}