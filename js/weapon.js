class Weapon {
    constructor(game, name, primaryCool, secondCool,
                primaryAttackDamage, secondaryAttackDamage,
                primaryAttackPushbackForce, secondaryAttackPushbackForce,
                primaryAttackRadius, secondaryAttackRadius,
                primaryAttackDuration, secondaryAttackDuration,
                spritePath, primarySound, secondarySound, spriteW, spriteH, upgrades) {
        this.game = game;
        this.name = name;
        this.primaryCool = primaryCool;
        this.secondCool = secondCool;

        this.primaryAttackDamage = primaryAttackDamage;
        this.secondaryAttackDamage = secondaryAttackDamage;

        this.primaryAttackPushbackForce = primaryAttackPushbackForce;
        this.secondaryAttackPushbackForce = secondaryAttackPushbackForce;

        this.primaryAttackRadius = primaryAttackRadius;
        this.secondaryAttackRadius = secondaryAttackRadius;

        this.primaryAttackDuration = primaryAttackDuration; // Duration of the attack animation
        this.secondaryAttackDuration = secondaryAttackDuration; // Duration of the spin attack in seconds

        this.primarySound = primarySound;
        this.secondarySound = secondarySound;

        // For whatever reason, having huge negatives numbers here allows the player to use their attacks immediately as
        // soon as the game starts. Without this the attack cooldowns are on cooldown as soon as the game starts.
        this.lastPrimaryAttackTime = -100;
        this.lastSecondAttackTime = -100;

        this.animator = new Animator(game, ASSET_MANAGER.getAsset(spritePath), 0, 0, spriteW, spriteH, 1, 60, 1.6);

        this.spritePath = spritePath;

        // list of all upgrade objects tied to the weapon
        this.upgrades = upgrades;
    }

    draw(ctx, slotNum){
        // adjust these for easier menu debugging
        const weaponBoxHeight = 125;
        const weaponBoxWidth = 100;
        const barHeight = weaponBoxHeight - 15;
        const barWidth = weaponBoxWidth/8;
        // bow before my mathematical prowess!
        const slotX = canvas.width/2 - (weaponBoxWidth * this.game.player.weapons.length)/2 + slotNum * weaponBoxWidth;
        const slotY = canvas.height - weaponBoxHeight;

        // Primary attacks
        ctx.beginPath();
        ctx.fillStyle = "Black";
        if (this.game.player.currentWeapon === slotNum) {
            ctx.fillStyle = "Yellow";
        }

        ctx.fillRect(slotX, slotY, weaponBoxWidth, weaponBoxHeight);
        ctx.closePath();

        this.animator.drawFrame(this.game.clockTick, ctx, slotX + 10, slotY + 30, "right");

        ctx.beginPath();
        ctx.fillStyle = "Red";
        ctx.fillRect(slotX + weaponBoxWidth/2 + 10, slotY + 5, barWidth, barHeight);
        ctx.closePath();

        //draw the primary cooldown
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
        let diff = this.game.timer.gameTime - this.lastPrimaryAttackTime;
        if (diff > this.primaryCool) {
            diff = this.primaryCool;
            ctx.fillStyle = 'rgba(0, 255, 0, 1)';
        }
        ctx.fillRect(slotX + weaponBoxWidth/2 + 10, slotY + 5 + barHeight, barWidth, -1 * barHeight * (diff / this.primaryCool));
        ctx.closePath();

        // Secondary attacks
        ctx.beginPath();
        ctx.fillStyle = "Red";
        ctx.fillRect(slotX + weaponBoxWidth/2 + barWidth*2, slotY + 5, barWidth, barHeight);
        ctx.closePath();

        //draw the secondary cooldown
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';
        diff = this.game.timer.gameTime - this.lastSecondAttackTime;
        if (diff > this.secondCool) {
            diff = this.secondCool;
            ctx.fillStyle = 'rgba(0, 100, 255, 1)';
        }
        ctx.fillRect(slotX + weaponBoxWidth/2 + barWidth*2, slotY + 5 + barHeight, barWidth, -1 * barHeight * (diff / this.secondCool));
        ctx.closePath();

        // for (let i = 0; i < this.upgrades.length; i++) {
        //     //console.log(this.upgradeList[i].name + ": " + this.upgradeList[i].active);
        // }

    }

    /**
     * Randomly choose 3 upgrades to show for a weapon upgrade screen.
     * Returns a randomly generated array of size 3 (contains 3 random weapon upgrades from the this.genericWeaponUpgrades array)
     * TODO still needs to handle what happens when you can't fill 3 slots
     */
    threeRandomUpgrades(){
        // Check if the input array has less than 3 elements

            let result = [];
            let indexes = new Set(); // To keep track of already selected indexes
            while (indexes.size < 3) {
                let randomIndex = Math.floor(Math.random() * this.upgrades.length);
                //console.log("CHOSE " + randomIndex);
                if (!indexes.has(randomIndex) && !this.upgrades[randomIndex].active) {
                    // If the upgrade selected is 'special' lets add a rarity to it even being chosen
                    if (this.upgrades[randomIndex].special && (Math.random() < 1)) { // % chance that we let special upgrades show up (0.75 means 75% chance)
                        indexes.add(randomIndex);
                        result.push(this.upgrades[randomIndex]);
                    }
                    // Else if not special just add it to the list of upgrades then
                    else if (!this.upgrades[randomIndex].special){
                        indexes.add(randomIndex);
                        result.push(this.upgrades[randomIndex]);
                    }
                }
            }
            return result;
    }
}