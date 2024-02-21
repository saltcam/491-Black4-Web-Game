class Upgrade {

    constructor(name, description, special, sprite, goldCost = 0){
        this.name = name;
        this.description = description;
        // this is the flag saying whether the weapon has this effect
        this.active = false;
        this.special = special;
        this.sprite = sprite;
        this.goldCost = goldCost;
    }

}