class Scythe extends Weapon{
    constructor(game, name, primaryCool, secondCool) {
        super(game, name, primaryCool, secondCool);

        this.primaryAttackDamage = 15;
        this.secondaryAttackDamage = 30;

        this.primaryAttackPushbackForce = 9;
        this.secondaryAttackPushbackForce = 14;

        this.primaryAttackRadius = 110;
        this.secondaryAttackRadius = 115;

        this.primaryAttackDuration = 0.6; // Duration of the attack animation
        this.secondaryAttackDuration = 0.85; // Duration of the spin attack in seconds
    }

    performPrimaryAttack(player){
        const currentTime = this.game.timer.gameTime;

        // Removed the click check and just use the cooldown check
        if (currentTime - this.lastPrimaryAttackTime >= this.primaryCool) {
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
            this.game.addEntity(new AttackCirc(this.game, player,
                this.primaryAttackRadius / 2,
                'playerAttack',
                dx, dy,
                this.primaryAttackDuration,
                "./sprites/weapon_scythe_primaryattack.png",
                this.primaryAttackDamage,
                this.primaryAttackPushbackForce,
                0));
        }

    }

    performSecondaryAttack(player){
        const currentTime = this.game.timer.gameTime;

        // Removed the click check and just use the cooldown check
        if (currentTime - this.lastSecondAttackTime >= this.secondCool) {
            this.lastSecondAttackTime = currentTime;
            this.game.addEntity(new AttackCirc(this.game, player,
                this.secondaryAttackRadius,
                'playerAttack',
                0, 0,
                this.secondaryAttackDuration,
                "./sprites/weapon_scythe_secondaryattack.png",
                this.secondaryAttackDamage,
                this.secondaryAttackPushbackForce,
                0.1));
        }
    }
}