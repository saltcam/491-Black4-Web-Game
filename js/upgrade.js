class Upgrade {

    constructor(name, description){
        this.name = name;
        this.description = description;
        // this is the flag saying whether the weapon has this effect
        this.active = false;
        //TODO make the sprite a parameter and pass it in
        this.sprite = "./sprites/upgrade_size.png";
    }

}