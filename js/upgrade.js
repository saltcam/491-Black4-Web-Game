class Upgrade {

    constructor(name, description, special, sprite){
        this.name = name;
        this.description = description;
        // this is the flag saying whether the weapon has this effect
        this.active = false;
        this.special = special;
        //TODO make the sprite a parameter and pass it in
        this.sprite = sprite;
    }

}