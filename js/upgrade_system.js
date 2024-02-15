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

        /**
         * Tracks what type of menu is currently open.
         * 0 === Weapon Upgrade Screen - Choose a Weapon to Upgrade
         * 1 === Scythe Upgrade Screen - Choose a Scythe Upgrade
         * 2 === Tome Upgrade Screen - Choose a Tome Upgrade
         * 3 === Staff Upgrade Screen - Choose a Staff Upgrade
         * 4 === Player Upgrade Screen - Choose a Player Upgrade
         */
        this.currentMenu = -1;

        /** This array holds generic upgrade types for all weapons types. */
        this.genericWeaponUpgrades = ["Attack Size +15%", "Primary CD -10%", "Secondary CD -10%"];

        /** Cooldown in seconds of when the player can input another selection key. */
        this.selectionCooldown = 0.5;
        /** Tracks when the last selection key was pressed. Initialize with a negative value to allow immediate input. */
        this.lastKeyPressTime = -1;

        this.player = null;
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

        const currentTime = this.game.timer.gameTime;

        // Decrease cooldown if necessary
        if (currentTime - this.lastKeyPressTime < this.selectionCooldown) {
            return; // Still in cooldown period, ignore input
        }

        // Check for player selection (keys 1 - 3)
        // Check to see if the selection cooldown is over
        if (currentTime - this.lastKeyPressTime >= this.selectionCooldown) {
            // Check for input on menu zero - 'Choose a Weapon to Upgrade'
            if (this.currentMenu === 0) {

                if (this.game.keys["1"]) {
                    this.weaponChoice = 0;
                    this.currentMenu = 1;
                    this.lastKeyPressTime = this.game.timer.gameTime;
                } else if (this.game.keys["2"]) {
                    this.weaponChoice = 1;
                    this.currentMenu = 1;
                    this.lastKeyPressTime = this.game.timer.gameTime;
                } else if (this.game.keys["3"]) {
                    this.weaponChoice = 2;
                    this.currentMenu = 1;
                    this.lastKeyPressTime = this.game.timer.gameTime;
                }
            }
            // Check for input on menu one - 'Choose a Scythe Upgrade'
            else if (this.currentMenu === 1) {
                let upgradeChoice = 0;


                if (this.game.keys["1"]) {
                    upgradeChoice = 1;
                    this.waitingForSelection = false;
                    if (this.game.pauseGame) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastKeyPressTime = this.game.timer.gameTime;
                } else if (this.game.keys["2"]) {
                    upgradeChoice = 2;
                    this.waitingForSelection = false;
                    if (this.game.pauseGame) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastKeyPressTime = this.game.timer.gameTime;
                } else if (this.game.keys["3"]) {
                    upgradeChoice = 3;
                    this.waitingForSelection = false;
                    if (this.game.pauseGame) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastKeyPressTime = this.game.timer.gameTime;
                }
                //this.game.player.weapons[this.weaponChoice].upgrade(upgradeChoice);
            }
            // Check for input on player upgrade screen
            else if (this.currentMenu === 4) {
                if (this.game.keys["1"]) {
                    this.waitingForSelection = false;
                    if (this.game.pauseGame) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastKeyPressTime = this.game.timer.gameTime;
                    // for (let object of this.game.objects) {
                    //     console.log(object.boundingBox.type);
                    //     if (object.boundingBox.type === "anvil") {
                    //         setTimeout(() => {
                    //             object.hasBeenOpened = false;
                    //         }, 1000);
                    //     }
                    // }
                } else if (this.game.keys["2"]) {
                    this.waitingForSelection = false;
                    if (this.game.pauseGame) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastKeyPressTime = this.game.timer.gameTime;
                } else if (this.game.keys["3"]) {
                    this.waitingForSelection = false;
                    if (this.game.pauseGame) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastKeyPressTime = this.game.timer.gameTime;
                }
            }
        }
    }

    /** Upgrade for player's base movement speed */
    upgradePlayerMovementSpeed() {
        this.player.movementSpeed += 1;
    }
    /** Upgrade for player's base health */
    upgradePlayerHealth() {
        this.player.maxHP += 100;
    }
    /** Upgrade for player's dash duration */
    upgradeDashDuration() {
        this.player.dashDuration += 1;
    }

    /** Randomly choose 3 upgrades to show for a weapon upgrade screen. */
    generateRandomUpgradeList() {

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
        if (!this.game.pauseGame) {
            this.game.togglePause();
        }

        // Tell the upgrade system which menu type we are currently on (refer to the java doc for more info)
        this.currentMenu = 0;
    }

    /** Call this to pop up a player upgrade screen for the player. */
    showPlayerUpgradeScreen() {
        // Set the animator to use the player upgrade menu sprite if it's not already set to that.
        if (this.animator.spritesheet !== ASSET_MANAGER.getAsset("./sprites/menu_player_upgrade.png")) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_player_upgrade.png"), 0, 0, 388, 413, 1, 1);
        }

        // Declare that we are now going to be waiting for the player to make a menu selection.
        this.waitingForSelection = true;

        // Pause the game while we wait for the player to make a selection.
        if (!this.game.pauseGame) {
            this.game.togglePause();
        }

        // Tell the upgrade system which menu type we are currently on (refer to the java doc for more info)
        this.currentMenu = 4;
    }

    /** Returns a sprite for an upgrade text. */
    setUpgradeSprite(ctx, upgradeText, entryNumber) {
        // If upgrade is +Attack Size
        if (upgradeText === this.genericWeaponUpgrades[0]) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/upgrade_size.png"), 0, 0, 178, 178, 1, 1);
            this.animator.scale = 0.3;
            this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 60 - (this.animator.width * this.animator.scale)-70, (270 + (100 * entryNumber))-48);
        }
        // If upgrade is -PrimaryCD
        else if (upgradeText === this.genericWeaponUpgrades[1]) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/upgrade_reduce_cd.png"), 0, 0, 178, 178, 1, 1);
            this.animator.scale = 0.3;
            this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 60 - (this.animator.width * this.animator.scale)-70, (270 + (100 * entryNumber))-48);
        }
        // If upgrade is -SecondaryCD
        else if (upgradeText === this.genericWeaponUpgrades[2]) {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/upgrade_reduce_cd.png"), 0, 0, 178, 178, 1, 1);
            this.animator.scale = 0.3;
            this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 60 - (this.animator.width * this.animator.scale)-70, (270 + (100 * entryNumber))-48);
        }
        // If no associated sprite found, use debug icon
        else {
            this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/debug_warning.png"), 0, 0, 74, 74, 1, 1);
            this.animator.scale = 0.5;
            this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 95 - (this.animator.width * this.animator.scale), (270 + (100 * entryNumber)));
        }
    }

    /** Call this to draw menu #0 - 'Choose a Weapon to Upgrade'. */
    drawMenuZero(ctx) {
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
        ctx.font = 'bold 24px Arial';
        ctx.fillText("Choose a Weapon to Upgrade", (ctx.canvas.width / 2) - 15, 225);

        // Draw the Scythe entry icon
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_scythe.png"), 0, 0, 30, 50, 1, 1);
        this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 110, 280);

        // Draw the Scythe text entry
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText("Upgrade Scythe", (ctx.canvas.width / 2) - 50, 318);

        // Draw the Tome entry icon
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/Tome.png"), 0, 0, 40, 40, 1, 1);
        this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 110, 388);

        // Draw the Tome text entry
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText("Upgrade Tome", (ctx.canvas.width / 2) - 50, 418);

        // Draw the Staff entry icon
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/NecromancyStaff.png"), 0, 0, 26, 70, 1, 1);
        this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 110, 473);

        // Draw the Staff text entry
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText("Upgrade Staff", (ctx.canvas.width / 2) - 50, 518);

        // Set animator back to original menu sprite sheet
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade.png"), 0, 0, 388, 413, 1, 1);
    }

    /** Call this to draw menu #1 - 'Choose a Weapon Upgrade'. */
    drawMenuOne(ctx) {
        // Draw menu title
        ctx.font = 'bold 24px Arial';
        ctx.fillText("Choose a Scythe Upgrade", (ctx.canvas.width / 2) - 15, 225);

        // Draw the first upgrade entry icon
        this.setUpgradeSprite(ctx, this.genericWeaponUpgrades[0], 0);
        //this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - (this.animator.width), 270 - (this.animator.height/3.8));

        // Draw the first upgrade text entry
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(this.genericWeaponUpgrades[0], (ctx.canvas.width / 2) - 50, 318);

        // Draw the second upgrade entry icon
        this.setUpgradeSprite(ctx, this.genericWeaponUpgrades[1], 1);
        //this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 130, 370);

        // Draw the second upgrade text entry
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(this.genericWeaponUpgrades[1], (ctx.canvas.width / 2) - 50, 418);

        // Draw the third upgrade entry icon
        this.setUpgradeSprite(ctx, this.genericWeaponUpgrades[2], 2);
        //this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 130, 470);

        // Draw the third upgrade text entry
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(this.genericWeaponUpgrades[2], (ctx.canvas.width / 2) - 50, 518);

        // Set animator back to original menu sprite sheet
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade.png"), 0, 0, 388, 413, 1, 1);
        this.animator.scale = 1;
    }

    /** Call this to draw menu #0 - 'Choose a Weapon to Upgrade'. */
    drawMenuFour(ctx) {
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
        ctx.font = 'bold 24px Arial';
        ctx.fillText("Choose an Upgrade", (ctx.canvas.width / 2) - 15, 225);

        // Draw the Scythe entry icon
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/weapon_scythe.png"), 0, 0, 30, 50, 1, 1);
        this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 110, 280);

        // Draw the Scythe text entry
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText("Upgrade health", (ctx.canvas.width / 2) - 50, 318);

        // Draw the Tome entry icon
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/Tome.png"), 0, 0, 40, 40, 1, 1);
        this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 110, 388);

        // Draw the Tome text entry
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText("Upgrade speed", (ctx.canvas.width / 2) - 50, 418);

        // Draw the Staff entry icon
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/NecromancyStaff.png"), 0, 0, 26, 70, 1, 1);
        this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - 110, 473);

        // Draw the Staff text entry
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText("Upgrade dash", (ctx.canvas.width / 2) - 50, 518);

        // Set animator back to original menu sprite sheet
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_player_upgrade.png"), 0, 0, 388, 413, 1, 1);
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
        }


        // Reset shadow properties to avoid affecting other drawings
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}