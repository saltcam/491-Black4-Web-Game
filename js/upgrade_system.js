/**
 * This will be the class that manages all weapon and player upgrade systems.
 */
class Upgrade_System {
    /**
     * Default Constructor
     * @param game A reference to the game engine.
     */
    constructor(game) {
        /** References the game engine. */
        this.game = game;
        /** The animator that will control the UI elements of the upgrade screens. */
        this.animator = new Animator(game, null, 0, 0, 388, 413, 1, 1, 1);
        /** Tracks if we are still waiting for the player to make a selection. */
        this.waitingForSelection = false;

        /** Stores the weapon choice. */
        this.weaponChoice = 0;

        this.upgradeOptions = null;

        /**
         * Tracks what type of menu is currently open.
         * 0 === Weapon Upgrade Screen - Choose a Weapon to Upgrade
         * 1 === Scythe Upgrade Screen - Choose a Scythe Upgrade
         * 2 === Tome Upgrade Screen - Choose a Tome Upgrade
         * 3 === Staff Upgrade Screen - Choose a Staff Upgrade
         * 4 === Player Upgrade Screen - Choose a Player Upgrade
         */
        this.currentMenu = -1;

        /** Cooldown in seconds of when the player can input another selection key. */
        this.selectionCooldown = 0.5;
        /** Tracks when the last selection key was pressed. Initialize with a negative value to allow immediate input. We use real time because we need to account for when the game is paused*/
        this.lastRealTimeKeyPress = Date.now(); // Use real-time

        //this.player = game.player;

        this.weaponUISprites = ["./sprites/upgrade_scythe.png", "./sprites/upgrade_tome.png", "./sprites/upgrade_staff.png"]

        // How long player gets iFrames after exiting the upgrade menus
        this.menuInvincibilityTime = 0.5;

        this.spendGoldSound = "./sounds/spend_gold.mp3";
    }

    /** Called every tick. */
    update() {
        // For debugging purposes
        // if(!this.waitingForSelection) {
        //     this.showWeaponUpgradeScreen();
        // }

        // Only perform updates when still waiting for player to make a menu selection.
        if (!this.waitingForSelection) {
            return;
        }

        const realTimeNow = Date.now();

        // If no menu, reset the upgrade options
        if (this.currentMenu === -1) {
            this.upgradeOptions = null;
        }

        // Decrease cooldown if necessary
        if ((realTimeNow - this.lastRealTimeKeyPress) < this.selectionCooldown * 1000) {
            return; // Still in cooldown period, ignore input
        }

        // Check for player selection (keys 1 - 3)
        // Check to see if the selection cooldown is over
        if (realTimeNow - this.lastRealTimeKeyPress >= this.selectionCooldown * 1000) {
            // Check for input on menu #0 - 'Choose a Weapon to Upgrade'
            if (this.currentMenu === 0) {
                this.game.player.menuInvincibility = true;
                // there MUST be a better way...
                if (this.game.keys["1"]) {
                    this.weaponChoice = 0;
                    this.currentMenu = 1;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                    // makes a list of 3 random upgrades available to the chosen weapon
                    this.upgradeOptions = this.game.player.weapons[this.weaponChoice].threeRandomUpgrades();
                } else if (this.game.keys["2"]) {
                    this.weaponChoice = 1;
                    this.currentMenu = 1;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                    // makes a list of 3 random upgrades available to the chosen weapon
                    this.upgradeOptions = this.game.player.weapons[this.weaponChoice].threeRandomUpgrades();
                } else if (this.game.keys["3"]) {
                    this.weaponChoice = 2;
                    this.currentMenu = 1;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                    // makes a list of 3 random upgrades available to the chosen weapon
                    this.upgradeOptions = this.game.player.weapons[this.weaponChoice].threeRandomUpgrades();
                }
            }
            // Check for input on menu #1 - 'Choose a Weapon Upgrade'
            else if (this.currentMenu === 1) {
                this.game.player.menuInvincibility = true;
                let upgradeChoice = -1;
                if (this.game.keys["1"]) {
                    upgradeChoice = 0;
                    this.game.player.setWeaponSwitchDelay();
                    this.waitingForSelection = false;
                    if (this.game.isGamePaused) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                } else if (this.game.keys["2"]) {
                    upgradeChoice = 1;
                    this.game.player.setWeaponSwitchDelay();
                    this.waitingForSelection = false;
                    if (this.game.isGamePaused) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                } else if (this.game.keys["3"]) {
                    upgradeChoice = 2;
                    this.game.player.setWeaponSwitchDelay();
                    this.waitingForSelection = false;
                    if (this.game.isGamePaused) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                }
                if (upgradeChoice !== -1) {
                    // Set the upgrade to active
                    this.upgradeOptions[upgradeChoice].active = true;

                    // Handle turning on the upgrade (Both Generic and Specific handled here)
                    this.game.player.weapons[this.weaponChoice].handleUpgrade();
                }
            }
            // Check for input on player upgrade menu #4
            else if (this.currentMenu === 4) {
                this.game.player.menuInvincibility = true;
                let upgradeChoice = -1;
                if (this.game.keys["1"]) {
                    upgradeChoice = 0;
                    this.game.player.setWeaponSwitchDelay();
                    this.waitingForSelection = false;
                    if (this.game.isGamePaused) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastRealTimeKeyPress = Date.now();

                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                } else if (this.game.keys["2"]) {
                    upgradeChoice = 1;
                    this.game.player.setWeaponSwitchDelay();
                    this.waitingForSelection = false;
                    if (this.game.isGamePaused) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                } else if (this.game.keys["3"]) {
                    upgradeChoice = 2;
                    this.game.player.setWeaponSwitchDelay();
                    this.waitingForSelection = false;
                    if (this.game.isGamePaused) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                }
                if (upgradeChoice !== -1) {
                    // Set the upgrade to active
                    this.upgradeOptions[upgradeChoice].active = true;

                    // Handle turning on the upgrade (Both Generic and Specific handled here)
                    this.game.player.handleUpgrade();
                }
            }
            // Check for input on anvil upgrade menu #5 - 'Choose a Weapon to Upgrade'
            else if (this.currentMenu === 5) {
                this.game.player.menuInvincibility = true;
                // there MUST be a better way...
                if (this.game.keys["1"]) {
                    this.weaponChoice = 0;
                    this.currentMenu = 6;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                } else if (this.game.keys["2"]) {
                    this.weaponChoice = 1;
                    this.currentMenu = 6;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                } else if (this.game.keys["3"]) {
                    this.weaponChoice = 2;
                    this.currentMenu = 6;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                }
                // Close menu if the player presses 'E'
                else if (this.game.keys["e"]) {
                    this.weaponChoice = -1;
                    this.game.player.setWeaponSwitchDelay();
                    this.currentMenu = -1;
                    this.lastRealTimeKeyPress = Date.now();
                    this.waitingForSelection = false;
                    if (this.game.isGamePaused) {
                        this.game.togglePause();
                    }
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                    // Reset anvil interaction CD after 1 sec
                    for (let object of this.game.objects) {
                        if (object.boundingBox.type === "anvil") {
                            setTimeout(() => {
                                object.hasBeenOpened = false;
                            }, 1000);
                        }
                    }
                }
            }
            // Check for input on anvil upgrade menu #6 - 'Choose Generic or Special'
            else if (this.currentMenu === 6) {
                let upgradeChoice = -1;
                this.game.player.menuInvincibility = true;
                if (this.game.keys["1"]) {
                    upgradeChoice = 0;
                    this.currentMenu = 7;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                } else if (this.game.keys["2"]) {
                    upgradeChoice = 1;
                    this.currentMenu = 7;
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                }
                // Close menu if the player presses 'E'
                else if (this.game.keys["e"]) {
                    upgradeChoice = -1;
                    this.weaponChoice = -1;
                    this.game.player.setWeaponSwitchDelay();
                    this.currentMenu = -1;
                    this.waitingForSelection = false;
                    if (this.game.isGamePaused) {
                        this.game.togglePause();
                    }
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                    // Reset anvil interaction CD after 1 sec
                    for (let object of this.game.objects) {
                        if (object.boundingBox.type === "anvil") {
                            this.game.setManagedTimeout(() => {
                                object.hasBeenOpened = false;
                            }, 1000);
                        }
                    }
                }
                if (upgradeChoice !== -1) {
                    if (upgradeChoice === 0) {
                        this.getGenericUpgrades(this.game.player.weapons[this.weaponChoice]);
                    } else if (upgradeChoice === 1) {
                        this.getSpecialUpgrades(this.game.player.weapons[this.weaponChoice]);
                    }
                }
            }
            // Check for input for anvil menu #7 - 'Choose a Weapon Upgrade'
            else if (this.currentMenu === 7) {
                this.game.player.menuInvincibility = true;
                let upgradeChoice = -1;
                if (this.upgradeOptions.length >= 1 && this.game.keys["1"]) {
                    // Ignore input if player doesn't have enough gold
                    if (this.upgradeOptions[0].goldCost <= this.game.player.gold) {
                        upgradeChoice = 0;
                        this.game.player.setWeaponSwitchDelay();
                        this.waitingForSelection = false;
                        if (this.game.isGamePaused) {
                            this.game.togglePause();
                        }
                        this.currentMenu = -1;
                        this.lastRealTimeKeyPress = Date.now();
                        // After ~1 sec of exiting menu, turn player's menu invincibility off
                        setTimeout(() => {
                            this.game.player.menuInvincibility = false;
                        }, this.menuInvincibilityTime * 1000);
                        // Reset anvil interaction CD after 1 sec
                        for (let object of this.game.objects) {
                            if (object.boundingBox.type === "anvil") {
                                this.game.setManagedTimeout(() => {
                                    object.hasBeenOpened = false;
                                }, 1000);
                            }
                        }
                    }
                } else if (this.upgradeOptions.length >= 2 && this.game.keys["2"]) {
                    // Ignore input if player doesn't have enough gold
                    if (this.upgradeOptions[1].goldCost <= this.game.player.gold) {
                        upgradeChoice = 1;
                        this.game.player.setWeaponSwitchDelay();
                        this.waitingForSelection = false;
                        if (this.game.isGamePaused) {
                            this.game.togglePause();
                        }
                        this.currentMenu = -1;
                        this.lastRealTimeKeyPress = Date.now();
                        // After ~1 sec of exiting menu, turn player's menu invincibility off
                        setTimeout(() => {
                            this.game.player.menuInvincibility = false;
                        }, this.menuInvincibilityTime * 1000);
                        // Reset anvil interaction CD after 1 sec
                        for (let object of this.game.objects) {
                            if (object.boundingBox.type === "anvil") {
                                this.game.setManagedTimeout(() => {
                                    object.hasBeenOpened = false;
                                }, 1000);
                            }
                        }
                    }
                } else if (this.upgradeOptions.length >= 3 && this.game.keys["3"]) {
                    // Ignore input if player doesn't have enough gold
                    if (this.upgradeOptions[2].goldCost <= this.game.player.gold) {
                        upgradeChoice = 2;
                        this.game.player.setWeaponSwitchDelay();
                        this.waitingForSelection = false;
                        if (this.game.isGamePaused) {
                            this.game.togglePause();
                        }
                        this.currentMenu = -1;
                        this.lastRealTimeKeyPress = Date.now();
                        // After ~1 sec of exiting menu, turn player's menu invincibility off
                        setTimeout(() => {
                            this.game.player.menuInvincibility = false;
                        }, this.menuInvincibilityTime * 1000);
                        // Reset anvil interaction CD after 1 sec
                        for (let object of this.game.objects) {
                            if (object.boundingBox.type === "anvil") {
                                this.game.setManagedTimeout(() => {
                                    object.hasBeenOpened = false;
                                }, 1000);
                            }
                        }
                    }
                } else if (this.upgradeOptions.length >= 4 && this.game.keys["4"]) {
                    // Ignore input if player doesn't have enough gold
                    if (this.upgradeOptions[3].goldCost <= this.game.player.gold) {
                        upgradeChoice = 3;
                        this.game.player.setWeaponSwitchDelay();
                        this.waitingForSelection = false;
                        if (this.game.isGamePaused) {
                            this.game.togglePause();
                        }
                        this.currentMenu = -1;
                        this.lastRealTimeKeyPress = Date.now();
                        // After ~1 sec of exiting menu, turn player's menu invincibility off
                        setTimeout(() => {
                            this.game.player.menuInvincibility = false;
                        }, this.menuInvincibilityTime * 1000);
                        // Reset anvil interaction CD after 1 sec
                        for (let object of this.game.objects) {
                            if (object.boundingBox.type === "anvil") {
                                this.game.setManagedTimeout(() => {
                                    object.hasBeenOpened = false;
                                }, 1000);
                            }
                        }
                    }
                } else if (this.upgradeOptions.length >= 5 && this.game.keys["5"]) {
                    // Ignore input if player doesn't have enough gold
                    if (this.upgradeOptions[4].goldCost <= this.game.player.gold) {
                        upgradeChoice = 4;
                        this.game.player.setWeaponSwitchDelay();
                        this.waitingForSelection = false;
                        if (this.game.isGamePaused) {
                            this.game.togglePause();
                        }
                        this.currentMenu = -1;
                        this.lastRealTimeKeyPress = Date.now();
                        // After ~1 sec of exiting menu, turn player's menu invincibility off
                        setTimeout(() => {
                            this.game.player.menuInvincibility = false;
                        }, this.menuInvincibilityTime * 1000);
                        // Reset anvil interaction CD after 1 sec
                        for (let object of this.game.objects) {
                            if (object.boundingBox.type === "anvil") {
                                this.game.setManagedTimeout(() => {
                                    object.hasBeenOpened = false;
                                }, 1000);
                            }
                        }
                    }
                } else if (this.upgradeOptions.length >= 6 && this.game.keys["6"]) {
                    // Ignore input if player doesn't have enough gold
                    if (this.upgradeOptions[5].goldCost <= this.game.player.gold) {
                        upgradeChoice = 5;
                        this.game.player.setWeaponSwitchDelay();
                        this.waitingForSelection = false;
                        if (this.game.isGamePaused) {
                            this.game.togglePause();
                        }
                        this.currentMenu = -1;
                        this.lastRealTimeKeyPress = Date.now();
                        // After ~1 sec of exiting menu, turn player's menu invincibility off
                        setTimeout(() => {
                            this.game.player.menuInvincibility = false;
                        }, this.menuInvincibilityTime * 1000);
                        // Reset anvil interaction CD after 1 sec
                        for (let object of this.game.objects) {
                            if (object.boundingBox.type === "anvil") {
                                this.game.setManagedTimeout(() => {
                                    object.hasBeenOpened = false;
                                }, 1000);
                            }
                        }
                    }
                }
                // Close menu if the player presses 'E'
                else if (this.game.keys["e"]) {
                    upgradeChoice = -1;
                    this.weaponChoice = -1;
                    this.game.player.setWeaponSwitchDelay();
                    this.currentMenu = -1;
                    this.waitingForSelection = false;
                    if (this.game.isGamePaused) {
                        this.game.togglePause();
                    }
                    this.lastRealTimeKeyPress = Date.now();
                    // After ~1 sec of exiting menu, turn player's menu invincibility off
                    setTimeout(() => {
                        this.game.player.menuInvincibility = false;
                    }, this.menuInvincibilityTime * 1000);
                    // Reset anvil interaction CD after 1 sec
                    for (let object of this.game.objects) {
                        if (object.boundingBox.type === "anvil") {
                            this.game.setManagedTimeout(() => {
                                object.hasBeenOpened = false;
                            }, 1000);
                        }
                    }
                }
                if (upgradeChoice !== -1 && this.upgradeOptions[upgradeChoice].goldCost <= this.game.player.gold) {
                    // Subtract the gold
                    this.game.player.gold -= this.upgradeOptions[upgradeChoice].goldCost;
                    ASSET_MANAGER.playAsset(this.spendGoldSound, 0.3);

                    // Set the upgrade to active
                    this.upgradeOptions[upgradeChoice].active = true;

                    // Handle turning on the upgrade (Both Generic and Specific handled here)
                    this.game.player.weapons[this.weaponChoice].handleUpgrade();
                }
            }
        }
    }

    /** Call this on player or weapon to get all generic upgrades. */
    getGenericUpgrades(entity) {
        this.upgradeOptions = [];
        let i = 0;

        entity.upgrades.forEach(upgrade => {
            if (!upgrade.special) {
                this.upgradeOptions[i] = upgrade;
                i++;
            }
        });
    }

    /** Call this on player or weapon to get all special upgrades. */
    getSpecialUpgrades(entity) {
        this.upgradeOptions = [];
        let i = 0;

        entity.upgrades.forEach(upgrade => {
            if (upgrade.special && !upgrade.active) {
                this.upgradeOptions[i] = upgrade;
                i++
            }
        });
    }

    /** Call this to pop up a weapon upgrade screen for the player. */
    showWeaponUpgradeScreen() {
        // Set the animator to use the weapon upgrade menu sprite if it's not already set to that.
        if (this.animator.spritesheet !== ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade.png")) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade.png"), 0, 0, 388, 413, 1, 1);
        }

        // Declare that we are now going to be waiting for the player to make a menu selection.
        this.waitingForSelection = true;

        // Pause the game while we wait for the player to make a selection.
        if (!this.game.isGamePaused) {
            this.game.togglePause();
        }

        // Tell the upgrade system which menu type we are currently on (refer to the java doc for more info)
        this.currentMenu = 0;
    }

    /** Call this to pop up a player upgrade screen for the player. */
    showPlayerUpgradeScreen() {
        // Reset upgrade options (fail-safe)
        this.upgradeOptions = null;

        // Set the animator to use the player upgrade menu sprite if it's not already set to that.
        if (this.animator.spritesheet !== ASSET_MANAGER.getAsset("./sprites/menu_player_upgrade.png")) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_player_upgrade.png"), 0, 0, 388, 413, 1, 1);
        }

        // Declare that we are now going to be waiting for the player to make a menu selection.
        this.waitingForSelection = true;

        // Pause the game while we wait for the player to make a selection.
        if (!this.game.isGamePaused) {
            this.game.togglePause();
        }

        // Tell the upgrade system which menu type we are currently on (refer to the java doc for more info)
        this.currentMenu = 4;
    }

    /** Call this to draw menu #5 - 'Choose a Weapon to Upgrade' for anvil menu. */
    showAnvilWeaponUpgradeScreen() {
        // Set the animator to use the weapon upgrade menu sprite if it's not already set to that.
        if (this.animator.spritesheet !== ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade_withclosebutton.png")) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade_withclosebutton.png"), 0, 0, 388, 413, 1, 1);
        }

        // Declare that we are now going to be waiting for the player to make a menu selection.
        this.waitingForSelection = true;

        // Pause the game while we wait for the player to make a selection.
        if (!this.game.isGamePaused) {
            this.game.togglePause();
        }

        // Tell the upgrade system which menu type we are currently on (refer to the java doc for more info)
        this.currentMenu = 5;
    }

    /** Call this to draw menu #0 - 'Choose a Weapon to Upgrade'. */
    drawMenuZero(ctx) {
        // Also draw player stats menu
        this.drawPlayerStatsMenu(ctx);

        // Handle drawing the text to each upgrade menu entry
        // Set text font properties
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        // Set shadow properties
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; // Shadow color (black with some transparency)
        ctx.shadowBlur = 0; // How much the shadow should be blurred
        ctx.shadowOffsetX = 2; // Horizontal shadow offset
        ctx.shadowOffsetY = 2; // Vertical shadow offset

        // Draw menu title
        ctx.font = 'bold 36px Arial';
        ctx.fillText("Choose a Weapon to Upgrade", (ctx.canvas.width / 2) - 15, 150);


        for (let i = 0; i < /*this.game.player.weapons.length*/ 3; i++) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.weaponUISprites[i]), 0, 0, 178, 178, 1, 1);
            this.animator.scale = 0.55;
            this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - (this.animator.width * this.animator.scale) - 130, (250 + (150 * i))-72);
            ctx.font = '30px Arial';
            ctx.textAlign = 'left';
            ctx.fillText("Upgrade " + this.game.player.weapons[i].name, (ctx.canvas.width / 2) - 60, 275 + i*150);
        }


        // Set animator back to original menu sprite sheet
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade.png"), 0, 0, 388, 413, 1, 1);
        this.animator.scale = 1.5;
    }

    /** Call this to draw menu #1 - 'Choose a Weapon Upgrade'. */
    drawMenuOne(ctx) {
        // Also draw player stats menu
        this.drawPlayerStatsMenu(ctx);

        // Draw menu title
        ctx.font = 'bold 36px Arial';
        ctx.fillText("Choose a " + this.game.player.weapons[this.weaponChoice].name + " Upgrade", (ctx.canvas.width / 2) - 15, 150);

        for (let i = 0; i < 3; i++) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.upgradeOptions[i].sprite), 0, 0, 178, 178, 1, 1);
            this.animator.scale = 0.45;
            this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - (this.animator.width * this.animator.scale) - 150, (250 + (150 * i))-72);

            ctx.textAlign = 'left';
            ctx.font = '24px Arial';
            ctx.fillText(this.upgradeOptions[i].name, (ctx.canvas.width / 2) - 85, 260 + i*150);
            ctx.font = '16px Arial';
            ctx.fillText(this.upgradeOptions[i].description, (ctx.canvas.width / 2) - 85, 250 + i*150 + 37);
        }

        // Set animator back to original menu sprite sheet
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade.png"), 0, 0, 388, 413, 1, 1);
        this.animator.scale = 1.5;
    }

    /** Call this to draw menu #4 - 'Choose a Player Upgrade'. */
    drawMenuFour(ctx) {
        // Also draw player stats menu
        this.drawPlayerStatsMenu(ctx);

        // Draw menu title
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px Arial';
        ctx.fillText("Choose a Player Upgrade", (ctx.canvas.width / 2) - 15, 150);

        // Not ready yet - we haven't generated an upgrade list in update() yet
        if (!this.upgradeOptions) {
            this.upgradeOptions = this.game.player.threeRandomUpgrades();
        }

        for (let i = 0; i < 3; i++) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.upgradeOptions[i].sprite), 0, 0, 178, 178, 1, 1);
            this.animator.scale = 0.45;
            this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - (this.animator.width * this.animator.scale) - 150, (250 + (150 * i))-72);

            ctx.textAlign = 'left';
            ctx.font = '26px Arial';
            ctx.fillText(this.upgradeOptions[i].name, (ctx.canvas.width / 2) - 85, 260 + i*150);
            ctx.font = '18px Arial';
            ctx.fillText(this.upgradeOptions[i].description, (ctx.canvas.width / 2) - 85, 260 + i*150 + 37);
        }

        // Set animator back to original menu sprite sheet
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_player_upgrade.png"), 0, 0, 388, 413, 1, 1);
        this.animator.scale = 1.5;
    }

    /** Call this to draw anvil menu #5 - 'Choose a Weapon to Upgrade'. */
    drawMenuFive(ctx) {
        // Also draw player stats menu
        this.drawPlayerStatsMenu(ctx);

        // Draw menu title
        ctx.font = 'bold 36px Arial';
        ctx.fillText("Choose a Weapon to Upgrade", (ctx.canvas.width / 2) - 15, 150);

        for (let i = 0; i < this.game.player.weapons.length; i++) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.weaponUISprites[i]), 0, 0, 178, 178, 1, 1);
            this.animator.scale = 0.55;
            this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - (this.animator.width * this.animator.scale) - 130, (250 + (150 * i))-72);
            ctx.font = '30px Arial';
            ctx.textAlign = 'left';
            ctx.fillText("Upgrade " + this.game.player.weapons[i].name, (ctx.canvas.width / 2) - 60, 275 + i*150);
        }

        // Set animator back to original menu sprite sheet
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade_withclosebutton.png"), 0, 0, 388, 413, 1, 1);
        this.animator.scale = 1.5;
    }

    /** Call this to draw anvil menu #6 - 'Choose Upgrade Type'. */
    drawMenuSix(ctx) {
        // Also draw player stats menu
        this.drawPlayerStatsMenu(ctx);

        // Draw menu title
        ctx.font = 'bold 36px Arial';
        ctx.fillText("Choose Upgrade Type", (ctx.canvas.width / 2) - 15, 150+70);

        // Generic Upgrades
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/upgrade_generic.png"), 0, 0, 178, 178, 1, 1);
        this.animator.scale = 0.55;
        this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - (this.animator.width * this.animator.scale) - 130, (250 + (150 * 0))-72+70);
        ctx.font = '26px Arial';
        ctx.textAlign = 'left';
        ctx.fillText("Generic Upgrades", (ctx.canvas.width / 2) - 85, 260 + 0*150+70);
        ctx.font = '18px Arial';
        ctx.fillText("Cheap and repeatable upgrades.", (ctx.canvas.width / 2) - 85, 260 + 0*150 + 37+70);

        // Special Upgrades
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/upgrade_special.png"), 0, 0, 178, 178, 1, 1);
        this.animator.scale = 0.55;
        this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - (this.animator.width * this.animator.scale) - 130, (250 + (150 * 1))-72+70);
        ctx.font = '30px Arial';
        ctx.textAlign = 'left';
        ctx.fillText("Special Upgrades", (ctx.canvas.width / 2) - 85, 260 + 1*150+70);
        ctx.font = '18px Arial';
        ctx.fillText("Expensive and unique upgrades.", (ctx.canvas.width / 2) - 85, 260 + 1*150 + 37+70);

        // Set animator back to original menu sprite sheet
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade_2options.png"), 0, 0, 388, 313, 1, 1);
        this.animator.scale = 1.5;
    }

    /** Call this to draw anvil menu #7 - 'Choose a Weapon Upgrade'. */
    drawMenuSeven(ctx) {
        // Also draw player stats menu
        this.drawPlayerStatsMenu(ctx);

        let scale = .66;
        // Draw menu title
        ctx.font = 'bold 27px Arial';
        ctx.fillText("Choose a " + this.game.player.weapons[this.weaponChoice].name + " Upgrade", (ctx.canvas.width / 2) - 15, (125) * scale);

        // Set shadow properties
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; // Shadow color (black with some transparency)
        ctx.shadowBlur = 0; // How much the shadow should be blurred
        ctx.shadowOffsetX = 1.33; // Horizontal shadow offset
        ctx.shadowOffsetY = 1.33; // Vertical shadow offset

        for (let i = 0; i < this.upgradeOptions.length; i++) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset(this.upgradeOptions[i].sprite), 0, 0, 178, 178, 1, 1);
            this.animator.scale = 0.40 * scale;
            this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - (this.animator.width * this.animator.scale) - 150, (108 + 150 * i) * scale);

            ctx.textAlign = 'left';
            ctx.font = '20px Arial';
            ctx.fillText(this.upgradeOptions[i].name, (ctx.canvas.width / 2) - 70, (215 + i * 150) * scale);
            ctx.font = '11px Arial';
            ctx.fillText(this.upgradeOptions[i].description, (ctx.canvas.width / 2) - 70, (245 + i * 150) * scale);
            ctx.font = 'bold 15px Arial';

            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/object_coin.png"), 0, 0, 46, 46, 1, 1);
            this.animator.scale = 0.45 * scale;
            this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 85, (236 + i * 150) * scale);

            // Red gold cost if player cannot afford.
            if (this.upgradeOptions[i].goldCost > this.game.player.gold) {
                ctx.fillStyle = 'red';
            } else {
                ctx.fillStyle = 'white';
            }
            ctx.fillText("-" + this.upgradeOptions[i].goldCost, (ctx.canvas.width / 2) - 50, (280 + i * 150) * scale);
            ctx.fillStyle = 'white';    // Reset to white
        }

        // Reset font stuff
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; // Shadow color (black with some transparency)
        ctx.shadowBlur = 0; // How much the shadow should be blurred
        ctx.shadowOffsetX = 2; // Horizontal shadow offset
        ctx.shadowOffsetY = 2; // Vertical shadow offset

        // Set animator back to original menu sprite sheet
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade_6options.png"), 0, 0, 388, 714, 1, 1);
        this.animator.scale = (1.5) * scale;
    }

    /**
     * Call this to draw the character/weapon statistics menu.
     */
    drawPlayerStatsMenu(ctx) {
        let scale = 1;

        // Set animator back to original menu sprite sheet
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_player_stats.png"), 0, 0, 259, 394, 1, 1);
        this.animator.scale = (1.5) * scale;

        // Calculate the center of the screen
        let screenX = this.game.player.worldX - this.game.camera.x - (this.animator.width / 2);
        let screenY = this.game.player.worldY - this.game.camera.y - (this.animator.height / 2);

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX-520, screenY, "right");

        // Draw menu title
        ctx.font = 'bold 45px Arial';
        ctx.textAlign = "center";
        ctx.fillText("Stats", screenX-400, screenY-32);

        // Prepare stats text settings
        ctx.font = '15px Arial';
        ctx.textAlign = "left";
        screenX -= 500;
        screenY += 45;

        // Set shadow properties
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; // Shadow color (black with some transparency)
        ctx.shadowBlur = 0; // How much the shadow should be blurred
        ctx.shadowOffsetX = 1.33; // Horizontal shadow offset
        ctx.shadowOffsetY = 1.33; // Vertical shadow offset

        let yIncrement = 24;

        // Player Attack Power
        ctx.fillText("Atk Pow: " + Math.round((this.game.player.atkPow / this.game.player.initialAtkPow) * 100) + "%", screenX, screenY);
        // Player Crit Chance
        ctx.fillText("Crit Chance: " + (Math.round((this.game.player.critChance * 100) * 10) / 10) + "%", screenX, screenY+(yIncrement));
        // Player Crit Dmg
        ctx.fillText("Crit Dmg: " + (Math.round((this.game.player.critDamage * 100) * 10) / 10) + "%", screenX, screenY+(yIncrement * 2));
        // Player Max Health
        ctx.fillText("Max HP: " + Math.round(this.game.player.maxHP), screenX, screenY+(yIncrement * 3));
        // Player Health Regen CD
        ctx.fillText("Regen: 1 hp / " + (Math.round(this.game.player.healthRegenTime * 10) / 10) + "s", screenX, screenY+(yIncrement * 4));

        // Next column
        screenX += 140;

        // Player Dash CD
        ctx.fillText("Dash CD: " + (Math.round(this.game.player.dashCooldown * 10) / 10) + "s", screenX, screenY);
        // Player Dash Distance
        ctx.fillText("Dash Dur: " + (Math.round(this.game.player.dashDuration * 10) / 10) + "s", screenX, screenY+(yIncrement));
        // Player Movement Speed
        ctx.fillText("Speed: " + Math.round((this.game.player.movementSpeed / this.game.player.initialMovementSpeed) * 100) + "%", screenX, screenY+(yIncrement * 2));
        // Player Pickup Range
        ctx.fillText("Pickup Range: " + Math.round((this.game.player.pickupRange / this.game.player.initialPickupRange) * 100) + "%", screenX, screenY+(yIncrement * 3));
        // Player Pickup Range
        ctx.fillText("Exp Gain: " + Math.round((this.game.player.expGain / this.game.player.initialExpGain) * 100) + "%", screenX, screenY+(yIncrement * 4));

        // Back to first column
        screenX -= 140;
        // Next row
        screenY += 107;

        // Scythe Attack Size
        ctx.fillText("Attack Size: " + Math.round((this.game.player.weapons[0].primaryAttackRadius / this.game.player.weapons[0].initialPrimaryAttackRadius) * 100) + "%", screenX, screenY+(yIncrement));
        // Scythe Primary CD
        ctx.fillText("Primary CD: " + (Math.round((this.game.player.weapons[0].primaryCool) * 10) / 10) + "s", screenX, screenY+(yIncrement * 2));
        // Scythe Secondary CD
        ctx.fillText("Secondary CD: " + (Math.round((this.game.player.weapons[0].secondCool) * 10) / 10) + "s", screenX, screenY+(yIncrement * 3));

        // Next column
        screenX += 140;

        // Scythe Knockback force
        ctx.fillText("Knockback: " + Math.round((this.game.player.weapons[0].primaryAttackPushbackForce / this.game.player.weapons[0].initialPrimaryAttackPushbackForce) * 100) + "%", screenX, screenY+(yIncrement));

        // Back to first column
        screenX -= 140;
        // Next row
        screenY += 90;

        // Tome Attack Size
        ctx.fillText("Attack Size: " + Math.round((this.game.player.weapons[1].primaryAttackRadius / this.game.player.weapons[1].initialPrimaryAttackRadius) * 100) + "%", screenX, screenY+(yIncrement));
        // Tome Primary CD
        ctx.fillText("Primary CD: " + (Math.round((this.game.player.weapons[1].primaryCool) * 10) / 10) + "s", screenX, screenY+(yIncrement * 2));
        // Tome Secondary CD
        ctx.fillText("Secondary CD: " + (Math.round((this.game.player.weapons[1].secondCool) * 10) / 10) + "s", screenX, screenY+(yIncrement * 3));

        // Next column
        screenX += 140;

        // Tome Piercing
        ctx.fillText("Piercing: " + this.game.player.weapons[1].maxPrimaryHits, screenX, screenY+(yIncrement));
        // Tome Projectile Speed
        ctx.fillText("Proj Speed: " + Math.round((this.game.player.weapons[1].primaryProjectileMovementSpeed / this.game.player.weapons[1].initialPrimaryProjectileMovementSpeed) * 100) + "%", screenX, screenY+(yIncrement * 2));

        // Back to first column
        screenX -= 140;
        // Next row
        screenY += 90;

        // Staff Attack Size
        ctx.fillText("Attack Size: " + Math.round((this.game.player.weapons[2].primaryAttackRadius / this.game.player.weapons[2].initialPrimaryAttackRadius) * 100) + "%", screenX, screenY+(yIncrement));
        // Staff Primary CD
        ctx.fillText("Primary CD: " + (Math.round((this.game.player.weapons[2].primaryCool) * 10) / 10) + "s", screenX, screenY+(yIncrement * 2));
        // Staff Secondary CD
        ctx.fillText("Secondary CD: " + (Math.round((this.game.player.weapons[2].secondCool) * 10) / 10) + "s", screenX, screenY+(yIncrement * 3));
        // Staff Knockback force (Assuming we only affect primary pushback)
        ctx.fillText("Knockback: " + Math.round((this.game.player.weapons[2].secondaryAttackPushbackForce / this.game.player.weapons[0].initialSecondaryAttackPushbackForce) * 100) + "%", screenX, screenY+(yIncrement * 4));

        // Next column
        screenX += 140;

        // Summons' Health
        ctx.fillText("Summ HP: " + Math.round(this.game.player.summonHealth), screenX, screenY+(yIncrement));
        // Summons' Speed
        ctx.fillText("Summ Speed: " + Math.round(this.game.player.summonSpeed), screenX, screenY+(yIncrement * 2));
        // Summons' Dmg
        ctx.fillText("Graves / 10s: " + Math.round(this.game.player.graveWalkCount), screenX, screenY+(yIncrement * 3));
        // Summons' Dmg
        ctx.fillText("Tomb Chance: " + Math.round(this.game.player.tombstoneChance * 100) + "%", screenX, screenY+(yIncrement * 4));



        // Reset text font properties
        ctx.font = '24px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; // Shadow color (black with some transparency)
        ctx.shadowBlur = 0; // How much the shadow should be blurred
        ctx.shadowOffsetX = 2; // Horizontal shadow offset
        ctx.shadowOffsetY = 2; // Vertical shadow offset
    }

    /**
     * Call this every frame to draw the UI elements.
     * @param ctx The canvas context being passed in.
     */
    draw(ctx) {
        // We should only be drawing if we are still waiting for the player to make a menu selection. */
        if (!this.waitingForSelection) {
            return;
        }

        // Calculate the center of the screen
        let screenX = this.game.player.worldX - this.game.camera.x - (this.animator.width / 2);
        let screenY = this.game.player.worldY - this.game.camera.y - (this.animator.height / 2);

        // Draw the player at the calculated screen position
        this.animator.drawFrame(this.game.clockTick, ctx, screenX, screenY, "right");
        this.animator.scale = 1;    // Reset scale fail-safe

        // Handle drawing the text to each upgrade menu entry
        // Set text font properties
        ctx.font = '24px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        // Set shadow properties
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; // Shadow color (black with some transparency)
        ctx.shadowBlur = 0; // How much the shadow should be blurred
        ctx.shadowOffsetX = 2; // Horizontal shadow offset
        ctx.shadowOffsetY = 2; // Vertical shadow offset

        if (this.currentMenu === 0) {
            this.drawMenuZero(ctx);
        } else if (this.currentMenu === 1) {
            this.drawMenuOne(ctx);
        } else if(this.currentMenu === 4) {
            this.drawMenuFour(ctx);
        } else if(this.currentMenu === 5) {
            this.drawMenuFive(ctx);
        } else if(this.currentMenu === 6) {
            this.drawMenuSix(ctx);
        } else if(this.currentMenu === 7) {
            this.drawMenuSeven(ctx);
        }

        // Reset shadow properties to avoid affecting other drawings
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}