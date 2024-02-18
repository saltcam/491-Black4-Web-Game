class Weapon_tome extends Weapon {
    constructor(game) {
        let upgrades = [
            new Upgrade("Attack Size +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_size.png"),
            new Upgrade("Primary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png"),
            new Upgrade("Secondary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png"),
            new Upgrade("Knockback +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_knockback.png"),
            new Upgrade("Primary Piercing +3", "(Stackable, Additive).", false, "./sprites/upgrade_piercing.png"),
            new Upgrade("Projectile Speed +10%", "(Stackable, Multiplicative) Primary attack only.", false, "./sprites/upgrade_projectile_speed.png")];

        super(game, "Tome", 1, 2,
            0, 0,
            6, 1,
            7, 55,
            3, 5,
            "./sprites/Tome.png",
            "./sounds/SE_tome_primary.mp3", "./sounds/SE_tome_secondary.mp3", 40, 40, upgrades);

        // Save these values for calculations later
        this.initialPrimaryAttackRadius = 10;//this.primaryAttackRadius;
        this.initialSecondaryAttackRadius = 90;//this.secondaryAttackRadius;

        // Effectively acts as max pierced targets before deleting projectiles
        this.maxPrimaryHits = 1;
        this.maxSecondaryHits = -1; // -1 Means infinite pierce
        this.primaryProjectileMovementSpeed = 60;
        this.secondaryProjectileMovementSpeed = 3.5;
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

            const offsetDistance = this.primaryAttackRadius * 0.6;
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;


            this.lastPrimaryAttackTime = currentTime;
            let newProjectile = this.game.addEntity(new Projectile(this.game, this.game.player.atkPow / 1.2,
                player.worldX, player.worldY, 10, 10, "playerAttack", this.primaryProjectileMovementSpeed,
                "./sprites/MagicBall.png",
                0, 0, 30, 30, 2, 0.2, 2.2 * (this.primaryAttackRadius/this.initialPrimaryAttackRadius), dx, dy,
                this.primaryAttackDuration, this.primaryAttackRadius, this.primaryAttackPushbackForce, 0, 0.3));
            newProjectile.maxHits = this.maxPrimaryHits; // Apply max pierce
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

            const offsetDistance = this.secondaryAttackRadius * 0.6;
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;


            this.lastSecondAttackTime = currentTime;
            let newProjectile = this.game.addEntity(new Projectile(this.game, this.game.player.atkPow / 3,
                player.worldX, player.worldY, 10, 10, "playerAttack", this.secondaryProjectileMovementSpeed,
                "./sprites/ElectricOrb.png",
                0, 0, 32.5, 32, 6, 0.15, 5.6 * (this.secondaryAttackRadius/this.initialSecondaryAttackRadius), dx, dy,
                this.secondaryAttackDuration, this.secondaryAttackRadius, this.secondaryAttackPushbackForce, 0, 0.25));
            newProjectile.maxHits = this.maxSecondaryHits; // Apply max pierce
            newProjectile.attackCirc.pulsatingDamage = true; // Tell the projectile that this attack pulsates damage.
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

                        // Fixes a bug where size affected projectile movement speed
                        // TODO THIS IS NOT A PERFECT BUG-FIX, need to find the real issue!!!
                        this.primaryProjectileMovementSpeed *= 0.9;
                        this.secondaryProjectileMovementSpeed *= 0.9;
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
                    case "Primary Piercing +3":
                        this.maxPrimaryHits += 3;
                        break;
                    case "Projectile Speed +10%":
                        this.primaryProjectileMovementSpeed *= 1.1;
                }
                // Set generic to 'not active' so it can be re-used/activated in the future
                this.upgrades[i].active = false;
            }
        }
    }
}