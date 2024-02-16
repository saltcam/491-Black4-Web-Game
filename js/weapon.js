class Weapon {
    constructor(game, name, primaryCool, secondCool,
                primaryAttackDamage, secondaryAttackDamage,
                primaryAttackPushbackForce, secondaryAttackPushbackForce,
                primaryAttackRadius, secondaryAttackRadius,
                primaryAttackDuration, secondaryAttackDuration,
                spritePath, primarySound, secondarySound, spriteW, spriteH, upgradeList) {
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

        this.animator = new Animator(game, ASSET_MANAGER.getAsset(spritePath), 0, 0, spriteW, spriteH, 1, 60, 1);

        this.spritePath = spritePath;

        // list of all upgrade objects tied to the weapon
        this.upgradeList = upgradeList;
    }

    draw(ctx, slotNum){

        // Primary attacks
        ctx.beginPath();
        ctx.fillStyle = "Black";
        if (this.game.player.currentWeapon === slotNum) {
            ctx.fillStyle = "Yellow";
        }
        ctx.fillRect(40 * slotNum, 0, 40, 40);
        ctx.closePath();

        this.animator.drawFrame(this.game.clockTick, ctx, (40 * slotNum), 0, "right");

        ctx.beginPath();
        ctx.fillStyle = "Red";
        ctx.fillRect(40 * slotNum + 5, 40, 30, 10);
        ctx.closePath();

        //draw the primary cooldown
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
        let diff = this.game.timer.gameTime - this.lastPrimaryAttackTime;
        if (diff > this.primaryCool) {
            diff = this.primaryCool;
            ctx.fillStyle = 'rgba(0, 255, 0, 1)';
        }
        ctx.fillRect(40 * slotNum + 5, 40,
            30 * (diff / this.primaryCool), 10);
        ctx.closePath();

        // Secondary attacks
        ctx.beginPath();
        ctx.fillStyle = "Red";
        ctx.fillRect(40 * slotNum + 5, 60, 30, 10);
        ctx.closePath();

        //draw the secondary cooldown
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';
        diff = this.game.timer.gameTime - this.lastSecondAttackTime;
        if (diff > this.secondCool) {
            diff = this.secondCool;
            ctx.fillStyle = 'rgba(0, 100, 255, 1)';
        }
        ctx.fillRect(40 * slotNum + 5, 60,
            30 * (diff / this.secondCool), 10);
        ctx.closePath();

        for (let i = 0; i < this.upgradeList.length; i++) {
            console.log(this.upgradeList[i].name + ": " + this.upgradeList[i].active);
        }

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
                let randomIndex = Math.floor(Math.random() * this.upgradeList.length);
                console.log("CHOSE " + randomIndex);
                if (!indexes.has(randomIndex) && !this.upgradeList[randomIndex].active) {
                    indexes.add(randomIndex);
                    result.push(this.upgradeList[randomIndex]);
                }
            }
            return result;

    }


}