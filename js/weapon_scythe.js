class Weapon_scythe extends Weapon {
    constructor(game) {
        //"./sprites/upgrade_size.png"
        let upgrades = [
            new Upgrade("Attack Size +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_size.png", 75),
            new Upgrade("Primary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png", 35),
            new Upgrade("Secondary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png", 50),
            new Upgrade("Knockback +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_knockback.png", 25),
            new Upgrade("Blood Scythe", "(Unique) Heal 1 hp per attack.", true, "./sprites/upgrade_blood_scythe.png", 200),
            new Upgrade("Dual Blade", "(Unique) Adds primary back attack.", true, "./sprites/upgrade_dual_blade.png", 150),
            new Upgrade("Echo Slash", "(Unique) Adds attack echoes. CDs +30%", true, "./sprites/upgrade_echo_slash.png", 175),
            new Upgrade("Crippling Chill", "(Unique) Cripple effect on attacks.", true, "./sprites/upgrade_crippling_chill.png", 125),
            new Upgrade("Bleeding Edge", "(Unique) +50% dmg. Dmg is now over-time.", true, "./sprites/upgrade_bleeding_edge.png", 200)
        ];

        super(game, "Scythe", 1, 5,
            0, 0,
            5, 10,
            73, 115,
            0.6, 0.85,
            "./sprites/weapon_scythe.png",
            "./sounds/SE_scythe_primary.mp3", "./sounds/SE_scythe_secondary.mp3", 30, 50, upgrades);

        this.initialPrimaryCool = this.primaryCool;
        this.initialSecondaryCool = this.secondCool;

        // How many seconds of delay before echoing attack (when echo slash upgrade is on)
        this.primaryEchoDelay = 0.25;
        this.secondaryEchoDelay = 0.5;
    }

    performPrimaryAttack(player) {
        // Change these values for balancing (If you don't see what you want to balance here, change it in the constructor)
        let defaultPrimaryDamage = player.atkPow / 1.5;
        let defaultDualBladeRadius = this.primaryAttackRadius * .67;

        // Check if special upgrade code is going to be used
        let bloodUpgrade = false;
        let dualBladeUpgrade = false;
        let echoSlashUpgrade = false;
        let bleedingEdgeUpgrade = false;

        player.weapons[0].upgrades.forEach(upgrade => {
            if (upgrade.name === "Blood Scythe") {
                bloodUpgrade = upgrade.active;
            } else if (upgrade.name === "Dual Blade") {
                dualBladeUpgrade = upgrade.active;
            } else if (upgrade.name === "Echo Slash") {
                echoSlashUpgrade = upgrade.active;
            } else if (upgrade.name === "Bleeding Edge") {
                bleedingEdgeUpgrade = upgrade.active;
            }
        });

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

            // Use different sprites depending on if we have a 'blood' scythe or not
            if (bloodUpgrade) {
                    this.game.addEntity(new AttackCirc(this.game, player,
                    this.primaryAttackRadius,
                    'playerAttack',
                    dx, dy,
                    this.primaryAttackDuration,
                    "./sprites/weapon_blood_scythe_primaryattack.png",
                    defaultPrimaryDamage, 0,
                    this.primaryAttackPushbackForce,
                    0, 1));

                    this.game.player.heal(1);

                if (dualBladeUpgrade) {
                    this.game.addEntity(new AttackCirc(this.game, player,
                        defaultDualBladeRadius,
                        'VAMP_playerAttack',
                        -dx, -dy,
                        this.primaryAttackDuration,
                        "./sprites/weapon_blood_scythe_primaryattack.png",
                        defaultPrimaryDamage, 0,
                        this.primaryAttackPushbackForce,
                        0, 1));

                    if (echoSlashUpgrade) {
                        setTimeout(() => {
                            this.game.addEntity(new AttackCirc(this.game, player,
                                defaultDualBladeRadius,
                                'VAMP_playerAttack',
                                -dx, -dy,
                                this.primaryAttackDuration,
                                "./sprites/weapon_blood_scythe_primaryattack.png",
                                defaultPrimaryDamage / 2, 0,
                                this.primaryAttackPushbackForce,
                                0, 1));
                        }, this.primaryEchoDelay * 1000);
                    }
                }

                if (echoSlashUpgrade) {
                    setTimeout(() => {
                        this.game.addEntity(new AttackCirc(this.game, player,
                            this.primaryAttackRadius,
                            'VAMP_playerAttack',
                            dx, dy,
                            this.primaryAttackDuration,
                            "./sprites/weapon_blood_scythe_primaryattack.png",
                            defaultPrimaryDamage / 2, 0,
                            this.primaryAttackPushbackForce,
                            0, 1));
                    }, this.primaryEchoDelay * 1000);
                }

            } else {
                this.game.addEntity(new AttackCirc(this.game, player,
                    this.primaryAttackRadius,
                    'playerAttack',
                    dx, dy,
                    this.primaryAttackDuration,
                    "./sprites/weapon_scythe_primaryattack.png",
                    defaultPrimaryDamage, 0,
                    this.primaryAttackPushbackForce,
                    0, 1));

                if (dualBladeUpgrade) {
                    this.game.addEntity(new AttackCirc(this.game, player,
                        defaultDualBladeRadius,
                        'playerAttack',
                        -dx, -dy,
                        this.primaryAttackDuration,
                        "./sprites/weapon_scythe_primaryattack.png",
                        defaultPrimaryDamage, 0,
                        this.primaryAttackPushbackForce,
                        0, 1));
                    if (echoSlashUpgrade) {
                        setTimeout(() => {
                            this.game.addEntity(new AttackCirc(this.game, player,
                                defaultDualBladeRadius,
                                'playerAttack',
                                -dx, -dy,
                                this.primaryAttackDuration,
                                "./sprites/weapon_scythe_primaryattack.png",
                                defaultPrimaryDamage / 2, 0,
                                this.primaryAttackPushbackForce,
                                0, 1));
                        }, this.primaryEchoDelay * 1000);
                    }
                }

                if (echoSlashUpgrade) {
                    setTimeout(() => {
                        this.game.addEntity(new AttackCirc(this.game, player,
                            this.primaryAttackRadius,
                            'playerAttack',
                            dx, dy,
                            this.primaryAttackDuration,
                            "./sprites/weapon_scythe_primaryattack.png",
                            defaultPrimaryDamage / 2, 0,
                            this.primaryAttackPushbackForce,
                            0, 0.6));
                    }, this.primaryEchoDelay * 1000);
                }

            }
        }
    }

    performSecondaryAttack(player) {
        // Change these values for balancing (If you don't see what you want to balance here, change it in the constructor)
        let defaultSecondaryDamage = player.atkPow * 1.15;

        // Check if player has the blood scythe upgrade (life leech)
        let bloodUpgrade = false;
        let echoSlashUpgrade = false;
        let cripplingChillUpgrade = false;

        player.weapons[0].upgrades.forEach(upgrade => {
            if (upgrade.name === "Blood Scythe") {
                bloodUpgrade = upgrade.active;
            } else if (upgrade.name === "Echo Slash") {
                echoSlashUpgrade = upgrade.active;
            } else if (upgrade.name === "Crippling Chill") {
                cripplingChillUpgrade = upgrade.active;
            }
        });

        const currentTime = this.game.timer.gameTime;

        // if true, perform the attack
        if (currentTime - this.lastSecondAttackTime >= this.secondCool) {
            ASSET_MANAGER.playAsset(this.secondarySound);
            this.lastSecondAttackTime = currentTime;

            // Use different sprites depending on if we have a 'blood' scythe or not
            if (bloodUpgrade) {
                this.game.addEntity(new AttackCirc(this.game, player,
                    this.secondaryAttackRadius,
                    'VAMP_playerAttack',
                    0, 0,
                    this.secondaryAttackDuration,
                    "./sprites/weapon_blood_scythe_secondaryattack.png",
                    defaultSecondaryDamage, 0,
                    this.secondaryAttackPushbackForce,
                    0.3, 1));

                this.game.player.heal(1);

                if (echoSlashUpgrade) {
                    setTimeout(() => {
                        this.game.addEntity(new AttackCirc(this.game, player,
                            this.secondaryAttackRadius,
                            'VAMP_playerAttack',
                            0, 0,
                            this.primaryAttackDuration,
                            "./sprites/weapon_blood_scythe_secondaryattack.png",
                            defaultSecondaryDamage / 2, 0,
                            this.primaryAttackPushbackForce,
                            0.3, 1));
                    }, this.secondaryEchoDelay * 1000);
                }
            } else {
                this.game.addEntity(new AttackCirc(this.game, player,
                    this.secondaryAttackRadius,
                    'playerAttack',
                    0, 0,
                    this.secondaryAttackDuration,
                    "./sprites/weapon_scythe_secondaryattack.png",
                    defaultSecondaryDamage, 0,
                    this.secondaryAttackPushbackForce,
                    0.3, 1));

                if (echoSlashUpgrade) {
                    setTimeout(() => {
                        this.game.addEntity(new AttackCirc(this.game, player,
                            this.secondaryAttackRadius,
                            'playerAttack',
                            0, 0,
                            this.primaryAttackDuration,
                            "./sprites/weapon_scythe_secondaryattack.png",
                            defaultSecondaryDamage / 2, 0,
                            this.primaryAttackPushbackForce,
                            0.3, 1));
                    }, this.secondaryEchoDelay * 1000);
                }
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
                        break;
                    case "Primary CD -10%":
                        this.primaryCool *= 0.9;
                        this.initialPrimaryCool *= 0.9;
                        break;
                    case "Secondary CD -10%":
                        this.secondCool *= 0.9;
                        this.initialSecondaryCool *= 0.9;
                        break;
                    case "Knockback +10%":
                        this.primaryAttackPushbackForce *= 1.1;
                        this.secondaryAttackPushbackForce *= 1.1;
                        break;
                }
                // Set generic to 'false' so it can be re-used/activated in the future
                this.upgrades[i].active = false;
            }
            // Handle special sprite changes
            else if (this.upgrades[i].active && this.upgrades[i].special) {
                switch (this.upgrades[i].name) {
                    case "Blood Scythe":
                        // Switch weapon to blood scythe sprite
                        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_blood_scythe.png"), 0, 0, 30, 50, 1, 1);
                        this.spritePath = "./sprites/weapon_blood_scythe.png";
                        // Set upgrade sprites to their relevant blood scythe variants
                        this.upgrades.forEach(upgrade => {
                            if (upgrade.name === "Dual Blade" && upgrade.active) {
                                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_blood_scythe_dual.png"), 0, 0, 41, 49, 1, 1);
                                this.spritePath = "./sprites/weapon_blood_scythe_dual.png";
                            } else if (upgrade.name === "Dual Blade" && !upgrade.active) {
                                upgrade.sprite = "./sprites/upgrade_dual_blade(blood).png";
                                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_blood_scythe.png"), 0, 0, 41, 49, 1, 1);
                                this.spritePath = "./sprites/weapon_blood_scythe.png";
                            }
                        });
                        break;
                    case "Dual Blade":
                        // Set upgrade sprites to their relevant blood scythe variants
                        this.upgrades.forEach(upgrade => {
                            if (upgrade.name === "Blood Scythe" && upgrade.active) {
                                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_blood_scythe_dual.png"), 0, 0, 41, 49, 1, 1);
                                this.spritePath = "./sprites/weapon_blood_scythe_dual.png";
                            } else if (upgrade.name === "Blood Scythe" && !upgrade.active) {
                                upgrade.sprite = "./sprites/upgrade_blood_scythe(dual).png";
                                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_scythe_dual.png"), 0, 0, 41, 49, 1, 1);
                                this.spritePath = "./sprites/weapon_scythe_dual.png";
                            }
                        });
                        break;
                    case "Echo Slash":
                        if (this.primaryCool === this.initialPrimaryCool && this.secondCool === this.initialSecondaryCool) {
                            this.primaryCool *= 1.3;
                            this.secondCool *= 1.3;

                            break;
                        }
                }
            }

        }
    }
}