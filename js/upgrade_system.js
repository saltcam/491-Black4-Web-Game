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

        /** This array holds generic upgrade types for all weapons types. */
        //this.genericWeaponUpgrades = ["Attack Size +15%", "Primary CD -10%", "Secondary CD -10%", "Attack Size +15%", "Primary CD -10%", "Secondary CD -10%"];

        /** Cooldown in seconds of when the player can input another selection key. */
        this.selectionCooldown = 0.5;
        /** Tracks when the last selection key was pressed. Initialize with a negative value to allow immediate input. We use real time because we need to account for when the game is paused*/
        this.lastRealTimeKeyPress = Date.now(); // Use real-time

        this.player = null;

        this.weaponUISprites = ["./sprites/upgrade_scythe.png", "./sprites/upgrade_tome.png", "./sprites/upgrade_staff.png"]
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

        // Decrease cooldown if necessary
        if ((realTimeNow - this.lastRealTimeKeyPress) < this.selectionCooldown * 1000) {
            return; // Still in cooldown period, ignore input
        }

        // Check for player selection (keys 1 - 3)
        // Check to see if the selection cooldown is over
        if (realTimeNow - this.lastRealTimeKeyPress >= this.selectionCooldown * 1000) {
            // Check for input on menu zero - 'Choose a Weapon to Upgrade'
            if (this.currentMenu === 0) {

                // there MUST be a better way...
                if (this.game.keys["1"]) {
                    this.weaponChoice = 0;
                    this.currentMenu = 1;
                    this.lastRealTimeKeyPress = Date.now();
                    // makes a list of 3 random upgrades available to the chosen weapon
                    this.upgradeOptions = this.game.player.weapons[this.weaponChoice].threeRandomUpgrades();
                } else if (this.game.keys["2"]) {
                    this.weaponChoice = 1;
                    this.currentMenu = 1;
                    this.lastRealTimeKeyPress = Date.now();
                    // makes a list of 3 random upgrades available to the chosen weapon
                    this.upgradeOptions = this.game.player.weapons[this.weaponChoice].threeRandomUpgrades();
                } else if (this.game.keys["3"]) {
                    this.weaponChoice = 2;
                    this.currentMenu = 1;
                    this.lastRealTimeKeyPress = Date.now();
                    // makes a list of 3 random upgrades available to the chosen weapon
                    this.upgradeOptions = this.game.player.weapons[this.weaponChoice].threeRandomUpgrades();
                }
            }
            // Check for input on menu one - 'Choose a Weapon Upgrade'
            else if (this.currentMenu === 1) {
                let upgradeChoice = -1;
                if (this.game.keys["1"]) {
                    upgradeChoice = 0;
                    this.waitingForSelection = false;
                    if (this.game.pauseGame) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastRealTimeKeyPress = Date.now();
                } else if (this.game.keys["2"]) {
                    upgradeChoice = 1;
                    this.waitingForSelection = false;
                    if (this.game.pauseGame) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastRealTimeKeyPress = Date.now();
                } else if (this.game.keys["3"]) {
                    upgradeChoice = 2;
                    this.waitingForSelection = false;
                    if (this.game.pauseGame) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastRealTimeKeyPress = Date.now();
                }
                if (upgradeChoice !== -1) {
                    // Set the upgrade to active
                    this.upgradeOptions[upgradeChoice].active = true;

                    // Handle turning on the upgrade (Both Generic and Specific handled here)
                    this.game.player.weapons[this.weaponChoice].handleUpgrade();
                }
            }
            // Check for input on player upgrade screen
            else if (this.currentMenu === 4) {
                if (this.game.keys["1"]) {
                    this.waitingForSelection = false;
                    if (this.game.pauseGame) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastRealTimeKeyPress = Date.now();
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
                    this.lastRealTimeKeyPress = Date.now();
                } else if (this.game.keys["3"]) {
                    this.waitingForSelection = false;
                    if (this.game.pauseGame) {
                        this.game.togglePause();
                    }
                    this.currentMenu = -1;
                    this.lastRealTimeKeyPress = Date.now();
                }
            }
        }
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
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade.png"), 0, 0, 388, 413, 1, 1);
        this.animator.scale = 1.5;
    }

    /** Call this to draw menu #1 - 'Choose a Weapon Upgrade'. */
    drawMenuOne(ctx) {
        // Draw menu title
        ctx.font = 'bold 36px Arial';
        ctx.fillText("Choose a " + this.game.player.weapons[this.weaponChoice].name + " Upgrade", (ctx.canvas.width / 2) - 15, 150);

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
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_weapon_upgrade.png"), 0, 0, 388, 413, 1, 1);
        this.animator.scale = 1.5;
    }

    /** Call this to draw menu #0 - 'Choose Player to Upgrade'. */
    //TODO reconsider structuring this like the other menu
    drawMenuFour(ctx) {
        // Draw menu title
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px Arial';
        ctx.fillText("Choose a Player Upgrade", (ctx.canvas.width / 2) - 15, 150);

        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/upgrade_size.png"), 0, 0, 178, 178, 1, 1);
        this.animator.scale = 0.45;
        this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - (this.animator.width * this.animator.scale) - 150, (250 + (150 * 0))-72);

        ctx.textAlign = 'left';
        ctx.font = '26px Arial';
        ctx.fillText("Health +10", (ctx.canvas.width / 2) - 85, 275 + 0);

        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/upgrade_size.png"), 0, 0, 178, 178, 1, 1);
        this.animator.scale = 0.45;
        this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - (this.animator.width * this.animator.scale) - 150, (250 + (150 * 1))-72);

        ctx.textAlign = 'left';
        ctx.font = '26px Arial';
        ctx.fillText("Speed +5%", (ctx.canvas.width / 2) - 85, 275 + 150);

        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/upgrade_size.png"), 0, 0, 178, 178, 1, 1);
        this.animator.scale = 0.45;
        this.animator.drawFrame(this.game.clockTick, ctx, (ctx.canvas.width / 2) - (this.animator.width * this.animator.scale) - 150, (250 + (150 * 2))-72);

        ctx.textAlign = 'left';
        ctx.font = '26px Arial';
        ctx.fillText("Dash CD -10%", (ctx.canvas.width / 2) - 85, 275 + 300);

        // Set animator back to original menu sprite sheet
        this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/menu_player_upgrade.png"), 0, 0, 388, 413, 1, 1);
        this.animator.scale = 1.5;
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
        }


        // Reset shadow properties to avoid affecting other drawings
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}