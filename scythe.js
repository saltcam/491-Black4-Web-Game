const PRIMARY_ATTACK_RADIUS = 135; // Default value
const SECONDARY_ATTACK_RADIUS = 115; // Default value

class Scythe extends Weapon{
    constructor(game, name, primaryCool, secondCool) {
        super(game, name, primaryCool, secondCool);

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

            const offsetDistance = PRIMARY_ATTACK_RADIUS * 0.6;
            dx = Math.cos(this.attackAngle) * offsetDistance;
            dy = Math.sin(this.attackAngle) * offsetDistance;


            this.attackDuration = 0.1; // Duration of the attack animation
            this.lastPrimaryAttackTime = currentTime;
            this.game.addEntity(new AttackCirc(this.game, player,
                PRIMARY_ATTACK_RADIUS/2,
                'playerAttack',
                dx, dy,
                this.attackDuration,
                "./sprites/scythe_attack_slash.png"));
        }

    }

    performSecondaryAttack(player){
        const currentTime = this.game.timer.gameTime;

        // Removed the click check and just use the cooldown check
        if (currentTime - this.lastSecondAttackTime >= this.secondCool) {
            this.secondAttackDuration = 0.1; // Duration of the spin attack in seconds
            this.lastSecondAttackTime = currentTime;
            this.game.addEntity(new AttackCirc(this.game, player,
                SECONDARY_ATTACK_RADIUS,
                'playerAttack',
                0, 0,
                this.secondAttackDuration,
                null));
        }

    }




}