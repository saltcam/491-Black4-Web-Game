class Weapon_tome extends Weapon {
    constructor(game) {
        let upgrades = [
            new Upgrade("Attack Size +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_size.png", 75),
            new Upgrade("Primary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png", 35),
            new Upgrade("Secondary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png", 50),
            new Upgrade("Primary Piercing +3", "(Stackable, Additive).", false, "./sprites/upgrade_piercing.png", 40),
            new Upgrade("Projectile Speed +15%", "(Stackable, Multiplicative) Primary attack only.", false, "./sprites/upgrade_projectile_speed.png", 25),
            new Upgrade("Double Shot", "(Unique) Primary fires a second time.", true, "./sprites/upgrade_piercing.png", 120),
            new Upgrade("Bouncing Shots", "(Unique) Primary attacks bounce.", true, "./sprites/upgrade_piercing.png", 120),
            new Upgrade("Doubletime", "(Unique) Secondary hits more often.", true, "./sprites/upgrade_piercing.png", 120),
            new Upgrade("Expansion", "(Unique) Attack size grows as it moves.", true, "./sprites/upgrade_piercing.png", 120)
            //new Upgrade("Big Finish", "(Unique) Attacks explode once expired", true, "./sprites/upgrade_piercing.png", 120)
            //new Upgrade("Singularity", "(Unique) Secondary attack pulls enemies in.", true, "./sprites/upgrade_piercing.png", 120)
        ];

        super(game, "Tome", 1, 7,
            0, 0,
            1, 1,
            20, 75,
            3, 5,
            "./sprites/Tome.png",
            "./sounds/SE_tome_primary.mp3", "./sounds/SE_tome_secondary.mp3", 40, 40, upgrades);

        // Save these values for calculations later
        this.initialPrimaryAttackRadius = this.primaryAttackRadius;
        this.initialSecondaryAttackRadius = this.secondaryAttackRadius;
``
        // Effectively acts as max pierced targets before deleting projectiles
        this.maxPrimaryHits = 2;
        this.maxSecondaryHits = -1; // -1 Means infinite pierce
        this.primaryProjectileMovementSpeed = 45;
        this.secondaryProjectileMovementSpeed = 3.5;

        // Stats tracking
        this.initialPrimaryProjectileMovementSpeed = this.primaryProjectileMovementSpeed;
    }

    performPrimaryAttack(player, cheating) {
        let doubleShotUpgrade = false;
        let bouncingShotUpgrade = false;
        let bigFinishUpgrade = false;
        let expansionUpgrade = false;
        let doubleShotDamageMultiplier = 0.5;

        this.upgrades.forEach(upgrade => {
            if (upgrade.name === "Double Shot") {
                doubleShotUpgrade = upgrade.active;
            } else if (upgrade.name === "Bouncing Shots") {
                bouncingShotUpgrade = upgrade.active;
            } else if (upgrade.name === "Expansion") {
                expansionUpgrade = upgrade.active;
            } else if (upgrade.name === "Big Finish") {
                bigFinishUpgrade = upgrade.active;
            }
        });

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

            const offsetDistance = this.primaryAttackRadius * 0.6;
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;


            this.lastPrimaryAttackTime = currentTime;

            const projectile = this.addPrimaryProjectile(player, dx, dy, 0.75);

            if (expansionUpgrade) {
                for (let i = 0; i < 3; i++)
                    this.game.setManagedTimeout(() => {
                        projectile.attackCirc.radius += 10;
                    }, 950 * i);
            }

            if (projectile && bouncingShotUpgrade) {
                projectile.bouncesLeft = this.maxPrimaryHits;
            }

            if (bigFinishUpgrade) {

            }

            if (doubleShotUpgrade) {
                this.game.setManagedTimeout(() => {
                    const secondProjectile = this.addPrimaryProjectile(player, dx, dy, doubleShotDamageMultiplier);
                    if (secondProjectile && bouncingShotUpgrade) {
                        secondProjectile.bouncesLeft = this.maxPrimaryHits;
                    }
                }, 100);
            }
        }
    }

    addPrimaryProjectile(player, dx, dy, damageMultiplier) {
        let defaultPrimaryDamage = player.atkPow * damageMultiplier;
        let newProjectile = this.game.addEntity(new Projectile(this.game, defaultPrimaryDamage,
            player.worldX, player.worldY, 10, 10, "playerAttack_TomeAttack", this.primaryProjectileMovementSpeed,
            "./sprites/MagicBall.png",
            0, 0, 30, 30, 2, 0.2, 2 * (this.primaryAttackRadius/this.initialPrimaryAttackRadius), dx, dy,
            this.primaryAttackDuration, this.primaryAttackRadius, this.primaryAttackPushbackForce, 0, 0.3));
        newProjectile.maxHits = this.maxPrimaryHits;

        return newProjectile;
    }

    performSecondaryAttack(player, cheating) {

        let doubletimeUpgrade = false;
        let singularityUpgrade = false;
        let expansionUpgrade = false;

        let secondaryAttackTickRate = 0.35

        this.upgrades.forEach(upgrade => {
            if (upgrade.name === "Doubletime") {
                doubletimeUpgrade = upgrade.active;
            } else if (upgrade.name === "Singularity") {
                singularityUpgrade = upgrade.active;
            } else if (upgrade.name === "Expansion") {
                expansionUpgrade = upgrade.active;
            }
        });

        // Change these values for balancing (If you don't see what you want to balance here, change it in the constructor)
        let defaultSecondaryDamage = player.atkPow / 1.75;

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

            const offsetDistance = this.secondaryAttackRadius * 0.6;
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;


            this.lastSecondAttackTime = currentTime;

            if (doubletimeUpgrade) {
                secondaryAttackTickRate /= 2;
            }

            if (singularityUpgrade) {

            }

            let newProjectile = this.game.addEntity(new Projectile(this.game, defaultSecondaryDamage,
                player.worldX, player.worldY, 10, 10, "playerAttack_TomeAttack", this.secondaryProjectileMovementSpeed,
                "./sprites/ElectricOrb.png",
                0, 0, 32.5, 32, 6, 0.15, 4.75 * (this.secondaryAttackRadius/this.initialSecondaryAttackRadius), dx, dy,
                this.secondaryAttackDuration, this.secondaryAttackRadius, this.secondaryAttackPushbackForce, 0, secondaryAttackTickRate));

            newProjectile.maxHits = this.maxSecondaryHits; // Apply max pierce
            newProjectile.attackCirc.pulsatingDamage = true; // Tell the projectile that this attack pulsates damage.

            if (expansionUpgrade) {
                for (let i = 0; i < 5; i++)
                    this.game.setManagedTimeout(() => {
                        newProjectile.attackCirc.radius += 10;
                    }, 950 * i);
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
                    case "Primary Piercing +3":
                        this.maxPrimaryHits += 3;
                        break;
                    case "Projectile Speed +10%":
                        this.primaryProjectileMovementSpeed *= 1.15;
                }
                // Set generic to 'not active' so it can be re-used/activated in the future
                this.upgrades[i].active = false;
            }
        }
    }
}