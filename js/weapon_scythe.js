class Weapon_scythe extends Weapon {
    constructor(game) {
        //"./sprites/upgrade_size.png"
        let upgrades = [
            new Upgrade("Attack Size +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_size.png", 75),
            new Upgrade("Primary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png", 35),
            new Upgrade("Secondary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png", 50),
            new Upgrade("Knockback +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_knockback.png", 25),
            new Upgrade("Blood Scythe", "(Unique) Heal 1.5% HP per attack.", true, "./sprites/upgrade_blood_scythe.png", 150),
            new Upgrade("Dual Blade", "(Unique) Adds primary back attack.", true, "./sprites/upgrade_dual_blade.png", 175),
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
        this.primaryEchoDelay = 0.33;
        this.secondaryEchoDelay = 0.66;
    }

    performPrimaryAttack(player, cheating) {
        // Change these values for balancing (If you don't see what you want to balance here, change it in the constructor)
        let defaultPrimaryDamage = player.atkPow / 1.5;
        let defaultDualBladeRadius = this.primaryAttackRadius * .67;

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

            const offsetDistance = this.primaryAttackRadius * 0.45;
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;

            this.lastPrimaryAttackTime = currentTime;

            // If blood scythe is active
            if (this.upgrades[4].active) {
                this.game.addEntity(new AttackCirc(this.game, player,
                this.primaryAttackRadius,
                'playerAttack',
                dx, dy,
                this.primaryAttackDuration,
                "./sprites/weapon_blood_scythe_primaryattack.png",
                defaultPrimaryDamage, 0,
                this.primaryAttackPushbackForce,
                0, 1));

                this.game.player.heal(this.game.player.maxHP * 0.015);

                // If dual blade is active
                if (this.upgrades[5].active) {
                    this.game.addEntity(new AttackCirc(this.game, player,
                        defaultDualBladeRadius,
                        'VAMP_playerAttack',
                        -dx, -dy,
                        this.primaryAttackDuration,
                        "./sprites/weapon_blood_scythe_primaryattack.png",
                        defaultPrimaryDamage, 0,
                        this.primaryAttackPushbackForce,
                        0, 1));

                    // If echo slash is active
                    if (this.upgrades[6].active) {
                        this.game.setManagedTimeout(() => {
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

                // If echo blade is active
                if (this.upgrades[6].active) {
                    this.game.setManagedTimeout(() => {
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

                // If dual blade is active
                if (this.upgrades[5].active) {
                    this.game.addEntity(new AttackCirc(this.game, player,
                        defaultDualBladeRadius,
                        'playerAttack',
                        -dx, -dy,
                        this.primaryAttackDuration,
                        "./sprites/weapon_scythe_primaryattack.png",
                        defaultPrimaryDamage, 0,
                        this.primaryAttackPushbackForce,
                        0, 1));
                    // If echo blade is active
                    if (this.upgrades[6].active) {
                        this.game.setManagedTimeout(() => {
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

                // If echo slash
                if (this.upgrades[6].active) {
                    this.game.setManagedTimeout(() => {
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

    performSecondaryAttack(player, cheating) {
        // Change these values for balancing (If you don't see what you want to balance here, change it in the constructor)
        let defaultSecondaryDamage = player.atkPow * 1.15;

        const currentTime = this.game.elapsedTime / 1000;

        // if true, perform the attack
        if ((currentTime - this.lastSecondAttackTime >= this.secondCool) || cheating) {
            ASSET_MANAGER.playAsset(this.secondarySound);
            this.lastSecondAttackTime = currentTime;

            // If blood scythe is active
            if (this.upgrades[4].active) {
                this.game.addEntity(new AttackCirc(this.game, player,
                    this.secondaryAttackRadius,
                    'VAMP_playerAttack',
                    0, 0,
                    this.secondaryAttackDuration,
                    "./sprites/weapon_blood_scythe_secondaryattack.png",
                    defaultSecondaryDamage, 0,
                    this.secondaryAttackPushbackForce,
                    0.3, 1));

                this.game.player.heal(this.game.player.maxHP * 0.015);

                // If echo slash is active
                if (this.upgrades[6].active) {
                    this.game.setManagedTimeout(() => {
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

                // If echo slash is active
                if (this.upgrades[6].active) {
                    this.game.setManagedTimeout(() => {
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

                        // If dual blade is active, apply dual blade blood scythe
                        if (this.upgrades[5].active) {
                            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_blood_scythe_dual.png"), 0, 0, 41, 49, 1, 1);
                            this.spritePath = "./sprites/weapon_blood_scythe_dual.png";
                        }
                        // If dual blade is NOT active, apply regular blood scythe
                        else if (!this.upgrades[5].active) {
                            // Set upgrade icon of dual blade to its blood scythe variant
                            this.upgrades[5].sprite = "./sprites/upgrade_dual_blade(blood).png";

                            // Set the weapon sprite of this weapon to regular blood scythe
                            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_blood_scythe.png"), 0, 0, 41, 49, 1, 1);
                            this.spritePath = "./sprites/weapon_blood_scythe.png";
                        }
                        break;
                    case "Dual Blade":
                            // If blood scythe is active, apply dual blade blood scythe
                            if (this.upgrades[4].active) {
                                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_blood_scythe_dual.png"), 0, 0, 41, 49, 1, 1);
                                this.spritePath = "./sprites/weapon_blood_scythe_dual.png";
                            }
                            // If blood scythe is NOT active, apply regular dual blade
                            else if (!this.upgrades[4].active) {
                                // Set upgrade icon of blood scythe to it dual blade variant
                                this.upgrades[4].sprite = "./sprites/upgrade_blood_scythe(dual).png";

                                // Apply regular dual blade as this weapon's sprite
                                this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_scythe_dual.png"), 0, 0, 41, 49, 1, 1);
                                this.spritePath = "./sprites/weapon_scythe_dual.png";
                            }
                        break;
                    case "Echo Slash":
                        if (this.primaryCool === this.initialPrimaryCool && this.secondCool === this.initialSecondaryCool) {
                            this.primaryCool *= 1.3;
                            this.secondCool *= 1.3;
                        }
                        break;
                }
            }

        }
    }
}