class Upgrade {

    constructor(name, description, special, sprite, goldCost = 0, rarity = 1){
        this.name = name;
        this.description = description;
        // this is the flag saying whether the weapon has this effect
        this.active = false;
        this.special = special;
        this.sprite = sprite;
        this.goldCost = goldCost;
        this.relevant = true; // if the upgrade does not need to be a menu option anymore, remove
        this.rarity = rarity; // 1 for 100% common, 0.01 for 1% chance to show up
    }

}