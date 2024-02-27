class Weapon_staff extends Weapon {
    constructor(game) {
        let upgrades = [
            new Upgrade("Attack Size +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_size.png", 175),
            new Upgrade("Primary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png", 70),
            new Upgrade("Secondary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png", 115),
            new Upgrade("Summon Health +5", "Gives Summons +5 Health\n(Stackable, Additive).", false, "./sprites/upgrade_knockback.png", 50),
            new Upgrade("Summon Speed +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_knockback.png", 50),
            new Upgrade("Summon Damage +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_knockback.png", 50),
            new Upgrade("Ranged Summons", "(Unique) Summons have a 50% chance to be ranged.", true, "./sprites/upgrade_knockback.png", 50),
            new Upgrade("Explosive Finish", "(Unique) Summons explode on death.", true, "./sprites/upgrade_knockback.png", 50),
            new Upgrade("Empower Summons", "(Unique) Grants Summons 2x Speed, Damage, and Attack Freq. for 5 Seconds.", true, "./sprites/upgrade_knockback.png", 50),
            new Upgrade("Heal Summons", "(Unique) Heal 50% HP of Summons", true, "./sprites/upgrade_knockback.png", 50),
            new Upgrade("Fiery Explosions", "(Unique) Explosions leave behind fire spaces (Player is immune to these).", true, "./sprites/upgrade_knockback.png", 50),
            new Upgrade("Corpse Explosion", "(Unique) Enemies killed with explosions may explode.", true, "./sprites/upgrade_knockback.png", 350)];

        super(game, "Staff", 7, 11,
            0, 0,
            5, 5,
            115, 2,
            1, 0.5,
            "./sprites/NecromancyStaff.png",
            "./sounds/SE_staff_secondary.mp3", "./sounds/SE_staff_primary.mp3", 26, 70, upgrades);

        this.debugName = "Staff"; // For debug logging

        // Save these values for calculations later (for sprite scaling)
        this.initialPrimaryAttackRadius = 115;
        this.initialSecondaryAttackRadius = 2;

        //this.upgrades[6].active = true;
        //this.upgrades[8].active = true;
        //this.upgrades[9].active = true;
        this.upgrades[10].active = true;    // sets fiery explosion to true
    }

    performPrimaryAttack(player, cheating) {
        // Change these values for balancing (If you don't see what you want to balance here, change it in the constructor)
        let defaultPrimaryDamage = player.atkPow / 4;

        const currentTime = this.game.elapsedTime / 1000;

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
                xWorld + 7, yWorld + 7, 10, 10, "playerAttack_NecromancyAttack", 0,
                "./sprites/ElectricOrb_purple.png",
                0, 0, 32.5, 32, 6, 0.1, 8.5 * (this.secondaryAttackRadius/this.initialSecondaryAttackRadius), 0, 0,
                this.primaryAttackDuration, this.primaryAttackRadius, this.primaryAttackPushbackForce, 0, 1));
            newProjectile.attackCirc.pulsatingDamage = false;
        }
    }

    performSecondaryAttack(player, cheating) {
        // Change these values for balancing (If you don't see what you want to balance here, change it in the constructor)
        // let defaultSecondaryDamage = player.atkPow / 2;
        let defaultSecondaryDamage = 20 + (player.atkPow / 10);

        const currentTime = this.game.elapsedTime / 1000;

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
                xWorld + 7, yWorld + 7, 10, 10, "playerAttack_ExplosionAttack", 0,
                "./sprites/transparent.png",
                0, 0, 17, 17, 3, 0.001, 13 * (this.primaryAttackRadius/this.initialPrimaryAttackRadius), 0, 0,
                this.secondaryAttackDuration, this.secondaryAttackRadius, this.secondaryAttackPushbackForce, 0, 1));
            newProjectile.attackCirc.pulsatingDamage = false;
            newProjectile.attackCirc.drawCircle = true;

            // TODO Align properly and add this logic to any time we make explosions.
            if (this.upgrades[10].active) {
                let coords = newProjectile.calculateCenter()
                let newFireProjectile = this.game.addEntity(new Projectile(this.game, 5,
                    coords.x, coords.y, 10, 10, "playerAttack_Fire", 0,
                    "./sprites/hazard_fire.png",    // may need to keep hidden if debugging
                    0, 0, 765/4, 153, 4, 0.2, 1, 0, 0,
                    3, 75, 0, 0, 1));
                newFireProjectile.attackCirc.pulsatingDamage = true;
            }
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
                    case "Summon Health +5":
                        this.game.player.summonHealth += 5;
                        break;
                    case "Summon Speed +10%":
                        this.game.player.summonSpeed *= 1.10;
                        break;
                    case "Summon Damage +10%":
                        this.game.player.summonDamage *= 1.10;
                        break;
                }
                // Set generic to not active so that it can be re-used/activated in the future
                this.upgrades[i].active = false;
            }
        }
    }
}