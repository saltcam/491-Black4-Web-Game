class Weapon_scytoff extends Weapon {
    constructor(game) {
        //"./sprites/upgrade_size.png"
        let upgrades = [
            new Upgrade("Attack Size +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_size.png", 75),
            new Upgrade("Primary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png", 35),
            new Upgrade("Secondary CD -10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_reduce_cd.png", 50),
            new Upgrade("Knockback +10%", "(Stackable, Multiplicative).", false, "./sprites/upgrade_knockback.png", 25),
            ];

        super(game, "Scytoff", 0.1, 0.1,
            0, 0,
            0, 0,
            73, 115,
            0.6, 0.85,
            "./sprites/weapon_scythe.png",
            "./sounds/SE_scythe_primary.mp3", "./sounds/SE_scythe_secondary.mp3", 30, 50, upgrades);

        this.initialPrimaryCool = this.primaryCool;
        this.initialSecondaryCool = this.secondCool;
    }

    performPrimaryAttack(player, cheating) {
        player.weapons[0].performPrimaryAttack(player, true);
        player.weapons[1].performPrimaryAttack(player, true);
        player.weapons[2].performPrimaryAttack(player, true);
    }

    performSecondaryAttack(player, cheating) {
        player.weapons[0].performSecondaryAttack(player, true);
        player.weapons[1].performSecondaryAttack(player, true);
        player.weapons[2].performSecondaryAttack(player, true);
    }

    // Handles code for turning on upgrades (Generic and Specific)

}