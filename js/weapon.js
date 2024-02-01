class Weapon {
    constructor(game, name, primaryCool, secondCool) {
        this.game = game;
        this.name = name;
        this.primaryCool = primaryCool;
        this.secondCool = secondCool;

        // For whatever reason, having huge negatives numbers here allows the player to use their attacks immediately as
        // soon as the game starts. Without this the attack cooldowns are on cooldown as soon as the game starts.
        this.lastPrimaryAttackTime = -100;
        this.lastSecondAttackTime = -100;
    }




}