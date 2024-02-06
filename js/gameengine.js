/** This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011. */
class GameEngine {
    constructor(options) {
        /** What you will use to draw (HTML Canvas).
         * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
         */
        this.ctx = null;

        // The fields below is where we will be storing all our different types of entities
        /** Everything else aka 'other entities'. */
        this.entities = [];
        /** Tracks object entities. */
        this.objects = [];
        /** Tracks enemy entities. */
        this.enemies = [];
        /** Tracks the portal entity (with this setup - there should only ever be ONE portal active at once). */
        this.portal = null;
        /** Tracks the attack entities like projectiles and attackCirc. */
        this.attacks = [];
        /** Tracks the player entity. */
        this.player = null;

        // Information on the input
        /** Tracks clicks. */
        this.click = null;
        /** Tracks the mouse. */
        this.mouse = null;
        /** Tracks the mouse wheel. */
        this.wheel = null;
        /** Tracks the keyboard keys. */
        this.keys = {};

        /** Stores a reference to the camera. */
        this.camera = null;

        /**
         * Stores an int for what map we are on.
         * 0 == Rest Area
         * 1 == Grasslands
         * 2 == Cave
         * 3 == Space
         */
        this.currMap = 1

        // Map Scaling Variables
        /** Map scale for map 0 (Rest Area) */
        this.mapZeroScaleFactor = 1.5;
        /** Map scale for map 1 (Grasslands Map) */
        this.mapOneScaleFactor = 2;
        /** Map scale for map 2 (Cave Map) */
        this.mapTwoScaleFactor = 0.25;
        /** Map scale for map 3 (Space Map) */
        this.mapThreeScaleFactor = 0.25;

        /**
         * Tracks whether the map has been initialized.
         * Set to true once we set the position of the map directly behind the player.
         */
        this.mapInitialized = false;
        /** Initial horizontal offset for the grass texture. */
        this.mapTextureOffsetX = 0;
        /** Initial vertical offset for the grass texture. */
        this.mapTextureOffsetY = 0;

        /** Tracks map boundaries. */
        this.mapBoundaries = {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
        };

        /** An offset of how close the player can get to the map's boundaries. */
        this.mapBoundaryOffset = 25;

        /** Tracks if the map objects for the current map have been placed/initialized. */
        this.mapObjectsInitialized = false;

        /** Flag to tell whether the current round is over. */
        this.roundOver = false;

        /** Options and the Details. */
        this.options = options || {
            debugging: false,
        };

        /** Initialize the startTime. */
        this.startTime = null;
        /** Initialize the elapsedTime. */
        this.elapsedTime = 0;

        /** Toggle to enable debug mode features. */
        this.debugMode = false;

        this.totalEnemiesSpawned = 0;

        this.enemyTypes = [
            { name: "Zombie", maxHP: 100, currHP: 100, atkPow: 1, worldX: 0, worldY: 0, boxWidth: 19/2,
                boxHeight: 28/2, boxType: "enemy", speed: 100, spritePath: "./sprites/Zombie_Run.png", animXStart: 0,
                animYStart: 0, animW: 34, animH: 27, animFCount: 8, animFDur: 0.2, scale: 3, exp: 5},
            { name: "Slime", maxHP: 5, currHP: 5, atkPow: 1, worldX: 0, worldY: 0, boxWidth: 19/2,
                boxHeight: 28/2, boxType: "enemy", speed: 75, spritePath: "./sprites/SlimeMove.png", animXStart: 0,
                animYStart: 0, animW: 32, animH: 18, animFCount: 8, animFDur: 0.1, scale: 2, exp: 1},
            { name: "Floating Eye", maxHP: 5, currHP: 5, atkPow: 1, worldX: 0, worldY: 0,
                boxWidth: 19/2, boxHeight: 28/2, boxType: "enemy", speed: 150, spritePath: "./sprites/FloatingEye.png",
                animXStart: -3, animYStart: 0, animW: 128, animH: 128, animFCount: 80, animFDur: 0.05, scale: 2, exp: 2}
        ];
    }

    /**
     * This method initializes the game engine, and calls other necessary initialization methods.
     *
     * @param ctx   The canvas being passed from the HTML page.
     */
    init(ctx) {
        this.ctx = ctx;
        this.startInput();
        this.timer = new Timer();
        this.spawnBossOne();
    }

    /** Call this method to spawn boss one (Knight - Orange Bro). This was made to be a test method. */
    spawnBossOne() {
        this.addEntity(new BossOne(this, 250, 0));
    }

    /** Call this to initialize the grassmands (Map #1) objects. */
    initGrasslandsObjects() {
        this.addEntity(new Map_object(this, -250, 0, 86, 56-30, "./sprites/map_rock_object.png", 0, 0, 86, 56, 1, 1, 2));
        this.mapObjectsInitialized = true;
    }

    /** Call this method to initialize the camera at the start of the game. */
    initCamera() {
        // Assuming the player is already created and added to the entities list.
        if(!this.player) {
            console.log("gameengine.initCamera(): Player not found!");
        }
        else {
            this.camera = new Camera(this.player, this.ctx.canvas.width, this.ctx.canvas.height);
        }
    }

    /** Starts the time game engine's clock and looped methods. */
   start() {
        this.running = true; // Store this in-case we need to check later if the game engine is actually running.
        this.startTime = Date.now();
        const gameLoop = () => {
            this.loop();
            requestAnimFrame(gameLoop, this.ctx.canvas);
        };
        gameLoop();
    }

    /** Starts user input tracking/event listeners. */
    startInput() {
        const getXandY = e => ({
            x: e.clientX - this.ctx.canvas.getBoundingClientRect().left,
            y: e.clientY - this.ctx.canvas.getBoundingClientRect().top
        });
        
        this.ctx.canvas.addEventListener("mousemove", e => {
            if (this.options.debugging) {
                console.log("MOUSE_MOVE", getXandY(e));
            }
            this.mouse = getXandY(e);
        });

        this.ctx.canvas.addEventListener("click", e => {
            if (this.options.debugging) {
                console.log("LEFT_CLICK", getXandY(e));
            }
        });

        this.ctx.canvas.addEventListener("mousedown", e => {
            if (e.button === 0) { // Left mouse button.
                this.leftMouseDown = true;
            } else if (e.button === 2) { // Right mouse button.
                this.rightMouseDown = true;
            }
        });

        this.ctx.canvas.addEventListener("mouseup", e => {
            if (e.button === 0) { // Left mouse button.
                this.leftMouseDown = false;
            } else if (e.button === 2) { // Right mouse button.
                this.rightMouseDown = false;
            }
        });

        this.ctx.canvas.addEventListener("wheel", e => {
            if (this.options.debugging) {
                console.log("WHEEL", getXandY(e), e.deltaY);
            }
            e.preventDefault(); // Prevent Scrolling.
            this.wheel = e;
        });

        this.ctx.canvas.addEventListener("contextmenu", e => {
            e.preventDefault(); // Prevent the default context menu.
            if (this.options.debugging) {
                console.log("RIGHT_CLICK", getXandY(e));
            }
            this.rightClick = true; // Set the right-click flag.
        });

        this.ctx.canvas.addEventListener("keydown", event => this.keys[event.key] = true);
        this.ctx.canvas.addEventListener("keyup", event => this.keys[event.key] = false);
    }

    /**
     * This method is what we call whenever we add entities to our game, whether it's spawning the player, an enemy, or
     * an object in the world.
     *
     * @param entity    The entity being added.
     */
    addEntity(entity) {
        // New way of adding entities.
        // This allows us to do a performance friendly draw() method.
        // Which lets us layer the most important entities over the less important ones (ex: player will be drawn over EVERYTHING.)
        if (entity.boundingBox.type === "player") {
            this.player = entity;
        } else if (entity.boundingBox.type === "portal") {
            this.portal = entity;
        } else if (entity.boundingBox.type === "enemy" || entity.boundingBox.type === "enemyBoss") {
            this.enemies.push(entity);
        } else if (entity.boundingBox.type === "attack") {
            this.attacks.push(entity);
        } else if (entity.boundingBox.type === "object") {
            this.objects.push(entity);
        }
        // Everything else is stored in entities list (Attack collision objects etc.)
        else {
            this.entities.push(entity);
        }

        return entity;
    }

    spawnRandomEnemy() {
        if (this.enemies.length >= 50 || this.totalEnemiesSpawned >=  50) {
            return;
        }

        let randomXNumber, randomYNumber;
        const buffer = 100;

        //Enemies Spawn outside the player camera + an offset
        if(Math.random() < 0.5) {
           randomXNumber = Math.random() < 0.5 ? this.camera.x - buffer : this.camera.x + this.camera.width + buffer;
           randomYNumber = Math.random() * (this.camera.height) + this.camera.y;
        } else {
           randomXNumber = Math.random() * (this.camera.width) + this.camera.x;
           randomYNumber = Math.random() < 0.5 ? this.camera.y - buffer : this.camera.y + this.camera.height + buffer;
        }


        //Selects a random enemy from the enemyTypes array
        const randomEnemyType =  this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];

        //Creates the new random enemy at a random location
        const newEnemy = new Enemy_Contact(randomEnemyType.name, randomEnemyType.maxHP, randomEnemyType.currHP,
            randomEnemyType.atkPow, this, randomXNumber, randomYNumber, randomEnemyType.boxWidth,
            randomEnemyType.boxHeight, "enemy", randomEnemyType.speed, randomEnemyType.spritePath,
            randomEnemyType.animXStart, randomEnemyType.animYStart, randomEnemyType.animW, randomEnemyType.animH,
            randomEnemyType.animFCount, randomEnemyType.animFDur, randomEnemyType.scale, randomEnemyType.exp);

        // After 5 seconds there is a 10% chance for a new enemy to spawn as an elite
        if(this.elapsedTime > 5000) {
            if (Math.random() < 0.1) {
                newEnemy.makeElite();
            }
        }

        this.totalEnemiesSpawned++;
        //Add the new enemy into the game
        this.addEntity(newEnemy);
    }

    /** Call this method on every frame to draw each entity or UI elements on the canvas. */
    draw() {
        // Clear the canvas.
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw the background of the map.
        this.drawBackground('./sprites/map_space_background.png', 1);

        // Draw the map texture.
        this.drawMap();

        // Draw 'other' entities.
        for (let entity of this.entities) {
            entity.draw(this.ctx, this);

            // If debug mode, then draw debug features.
            if (this.debugMode && entity instanceof Entity) {
                //entity.drawHealth(this.ctx);
                entity.boundingBox.draw(this.ctx, this);
            }
        }

        // Draw 'object' entities.
        for (let object of this.objects) {
            object.draw(this.ctx, this);

            // If debug mode, then draw debug features.
            if (this.debugMode) {
                object.drawHealth(this.ctx);
                object.boundingBox.draw(this.ctx, this);
            }
        }

        // Define a threshold for sorting (e.g., 5 pixels)
        const sortingThreshold = 5;

        // Sort enemies based on their worldY position with a threshold
        this.enemies.sort((a, b) => {
            // Calculate the difference in worldY positions
            const diff = a.worldY - b.worldY;

            // Only consider them different if the difference exceeds the threshold
            if (Math.abs(diff) < sortingThreshold) {
                return 0; // Consider them as equal for sorting purposes
            }
            return diff;
        });

        // Track if there is a boss spawned
        let bossEnemy = null;

        // Draw 'enemy' entities.
        for (let enemy of this.enemies) {
            enemy.draw(this.ctx, this);

            // If debug mode, then draw debug features.
            if (this.debugMode) {
                enemy.drawHealth(this.ctx);
            }

            if (enemy.boundingBox.type === "enemyBoss") {
                bossEnemy = enemy;
            }
        }

        // Draw 'attack' entities.
        for (let attack of this.attacks) {
            attack.draw(this.ctx, this);

            // If debug mode, then draw debug features.
            if (this.debugMode) {
                //attack.drawHealth(this.ctx);
                attack.boundingBox.draw(this.ctx, this);
            }
        }

        // Draw 'portal' entity.
        if (this.portal) {
            this.portal.draw(this.ctx, this);

            // If debug mode, then draw debug features.
            if (this.debugMode) {
                //this.portal.drawHealth(this.ctx);
                this.portal.boundingBox.draw(this.ctx, this);
            }
        }

        // Draw 'player' entity.
        if (this.player) {
            this.player.draw(this.ctx, this);

            // If debug mode, then draw debug features.
            if (this.debugMode) {
                //this.player.drawHealth(this.ctx); // We don't need to call this, it is already always called in dude.draw().
            }
        }

        // Draw UI elemnts
        // Boss health bar
        if (bossEnemy) {
            bossEnemy.drawBossHealthBar(this.ctx);
        }

        // Draw the mouse tracker.
        this.drawMouseTracker(this.ctx);
        this.drawTimer(this.ctx);

        // If the player is dead, display 'You Died!' text.
        if (this.player && this.player.isDead) {
            this.ctx.beginPath();

            this.ctx.fillStyle = "black";
            this.ctx.fillRect(this.ctx.canvas.width / 2 - 175, this.ctx.canvas.height / 2 - 75, 350, 95);
            // Draw "You Died!" text in large red font at the center of the canvas
            this.ctx.font = '75px Arial';
            this.ctx.fillStyle = 'red';
            this.ctx.textAlign = 'center'
            this.ctx.fillText('You Died!', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
            this.ctx.closePath();
        }

        // If the defeated all enemies, display 'You Won!' text.
        if (this.enemies.length <= 0 && this.currMap === 3) {
            this.ctx.beginPath();

            // Draw "You Won!" text in large yellow font at the center of the canvas
            this.ctx.font = '75px Arial';
            this.ctx.fillStyle = 'yellow';
            this.ctx.textAlign = 'center'
            this.ctx.fillText('You Won!', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
            this.ctx.closePath();
        }
    }

    /** Draws the game-time tracker on top of the game screen. */
    drawTimer(ctx) {
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center'
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        ctx.fillText(formattedTime, this.ctx.canvas.width / 2, 30);
    }

    /** Called in gameengine.draw() to draw the map textures. */
    drawMap() {

        // Check if the camera and player are initialized.
        // This is necessary as they are needed, but may not be initialized during the first few calls of this method.
        if (!this.camera || !this.player) {
            return; // Skip drawing the map if the camera or player is not initialized.
        }

        // If 0, then Rest Area Map is used.
        if (this.currMap === 0) {
            //console.log("Drawing Rest Area Map...");

            // Spawn a new portal once all enemies are defeated
            if (this.enemies.length === 0 && !this.portal) {
                this.addEntity(new Portal(this, this.player.worldX + 350, this.player.worldY, 2));
            }

            const spawnOffsetX = 170;
            const spawnOffsetY = 60;

            const map = ASSET_MANAGER.getAsset("./sprites/map_rest_area.png");

            this.mapWidth = map.width;
            this.mapHeight = map.height;

            // Calculate the scaled width and height of the textures.
            const scaledWidth = this.mapWidth * this.mapZeroScaleFactor;
            const scaledHeight = this.mapHeight * this.mapZeroScaleFactor;

            // If the map has not been centered yet, initialize its position.
            if (!this.mapInitialized) {
                this.mapTextureOffsetX = this.player.worldX - scaledWidth / 2 + this.player.animator.width / 2;
                this.mapTextureOffsetY = this.player.worldY - scaledHeight / 2 + this.player.animator.height / 2;
                this.mapInitialized = true;
            }

            // Adjust the texture's position to move inversely to the player's movement.
            const textureX = this.mapTextureOffsetX - this.camera.x + spawnOffsetX;
            const textureY = this.mapTextureOffsetY - this.camera.y - spawnOffsetY;

            // Draw the scaled texture centered on the player's position accounting for the camera.
            this.ctx.drawImage(map, textureX, textureY, scaledWidth, scaledHeight);

            // Calculate the actual boundaries considering the scaling
            this.mapBoundaries = {
                left: -((this.mapWidth) * this.mapZeroScaleFactor)/2 + this.mapBoundaryOffset * 2 + spawnOffsetX,
                top: -((this.mapHeight) * this.mapZeroScaleFactor)/2 + this.mapBoundaryOffset * 7 - spawnOffsetY,
                right: ((this.mapWidth) * this.mapZeroScaleFactor)/2 - this.mapBoundaryOffset * 2 + spawnOffsetX,
                bottom: ((this.mapHeight) * this.mapZeroScaleFactor)/2 - this.mapBoundaryOffset * 1.75 - spawnOffsetY
            };

            //this.loadRestAreaMap = false;
        }
        // If 1, then Grasslands Map is used.
        else if (this.currMap === 1) {
            // console.log("Drawing grass map!")
            // Initialize the map objects if we haven't already
            // if (!this.mapObjectsInitialized) {
            //     this.initGrasslandsObjects();
            // }
            const map = ASSET_MANAGER.getAsset("./sprites/map_grasslands.png");

            // Spawn a new portal once all enemies are defeated
            if (this.enemies.length === 0 && !this.portal) {
                this.addEntity(new Portal(this, this.player.worldX + 350, this.player.worldY, 0));
            }

            this.mapWidth = map.width;
            this.mapHeight = map.height;

            // Calculate the scaled width and height of the textures.
            const scaledWidth = this.mapWidth * this.mapOneScaleFactor;
            const scaledHeight = this.mapHeight * this.mapOneScaleFactor;

            // If the map has not been centered yet, initialize its position.
            if (!this.mapInitialized) {
                this.mapTextureOffsetX = this.player.worldX - scaledWidth / 2 + this.player.animator.width / 2;
                this.mapTextureOffsetY = this.player.worldY - scaledHeight / 2 + this.player.animator.height / 2;
                this.mapInitialized = true;
            }

            // Adjust the texture's position to move inversely to the player's movement.
            const textureX = this.mapTextureOffsetX - this.camera.x;
            const textureY = this.mapTextureOffsetY - this.camera.y;

            // Draw the scaled texture centered on the player's position accounting for the camera.
            this.ctx.drawImage(map, textureX, textureY, scaledWidth, scaledHeight);

            // Calculate the actual boundaries considering the scaling
            this.mapBoundaries = {
                left: -((this.mapWidth) * this.mapOneScaleFactor)/2 + this.mapBoundaryOffset,
                top: -((this.mapHeight) * this.mapOneScaleFactor)/2 + this.mapBoundaryOffset,
                right: ((this.mapWidth) * this.mapOneScaleFactor)/2 - this.mapBoundaryOffset,
                bottom: ((this.mapHeight) * this.mapOneScaleFactor)/2 - this.mapBoundaryOffset
            };
        }
        // If 2, then Cave Map is used.
        else if (this.currMap === 2){
            // Initialize the map objects if we haven't already
            // if (!this.mapObjectsInitialized) {
            //     this.initGrasslandsObjects();
            // }
            const map = ASSET_MANAGER.getAsset("./sprites/map_stone_background.png");

            this.mapWidth = map.width;
            this.mapHeight = map.height;

            // Calculate the scaled width and height of the textures.
            const scaledWidth = this.mapWidth * this.mapOneScaleFactor;
            const scaledHeight = this.mapHeight * this.mapOneScaleFactor;

            // If the map has not been centered yet, initialize its position.
            if (!this.mapInitialized) {
                this.mapTextureOffsetX = this.player.worldX - scaledWidth / 2 + this.player.animator.width / 2;
                this.mapTextureOffsetY = this.player.worldY - scaledHeight / 2 + this.player.animator.height / 2;
                this.mapInitialized = true;
            }

            // Adjust the texture's position to move inversely to the player's movement.
            const textureX = this.mapTextureOffsetX - this.camera.x;
            const textureY = this.mapTextureOffsetY - this.camera.y;

            // Draw the scaled texture centered on the player's position accounting for the camera.
            this.ctx.drawImage(map, textureX, textureY, scaledWidth, scaledHeight);

            // Calculate the actual boundaries considering the scaling
            this.mapBoundaries = {
                left: -((this.mapWidth) * this.mapOneScaleFactor)/2 + this.mapBoundaryOffset,
                top: -((this.mapHeight) * this.mapOneScaleFactor)/2 + this.mapBoundaryOffset,
                right: ((this.mapWidth) * this.mapOneScaleFactor)/2 - this.mapBoundaryOffset,
                bottom: ((this.mapHeight) * this.mapOneScaleFactor)/2 - this.mapBoundaryOffset
            };
        }
        // If 3, then Space Map is used.
        else if (this.currMap === 3){

        }
    }

    /**
     * Draws the background of the map (Out of bounds area).
     * This is drawn in a way where it moves with the camera/player, thus it does not simulate traversal
     * like the gameengine.drawMap() method does.
     *
     * @param spritePath    The path of the sprite we are drawing.
     * @param scaleFactor   The scale of the sprite we want to use.
     */
    drawBackground(spritePath, scaleFactor) {
        const texture = ASSET_MANAGER.getAsset(spritePath);
        const textureWidth = Math.round(texture.width * scaleFactor);
        const textureHeight = Math.round(texture.height * scaleFactor);

        // Calculate how many times the texture needs to be repeated horizontally and vertically.
        const timesToRepeatHorizontally = Math.ceil(this.ctx.canvas.width / textureWidth);
        const timesToRepeatVertically = Math.ceil(this.ctx.canvas.height / textureHeight);

        // Use two nested loops to draw the image multiple times across the canvas.
        for (let x = 0; x < timesToRepeatHorizontally; x++) {
            for (let y = 0; y < timesToRepeatVertically; y++) {
                this.ctx.drawImage(texture, x * textureWidth, y * textureHeight, textureWidth, textureHeight);
            }
        }
    }

    /** This method is called every tick to update all entities etc. */
    update() {
        let entitiesCount = this.entities.length;

        // Check if all enemies have been defeated
        // If so, spawn the portal to the next area
        if (this.enemies.length <= 0 && !this.portal) {
            // Spawn a portal to rest area
            this.addEntity(new Portal(this, this.player.worldX + 200, this.player.worldY, 0));
        }

        // Update 'other' entities.
        for (let i = 0; i < entitiesCount; i++) {
            if (!this.entities[i].removeFromWorld) {
                this.entities[i].update();
            }
        }

        // Update 'object' entities.
        for (let i = 0; i < this.objects.length; i++) {
            if (!this.objects[i].removeFromWorld) {
                this.objects[i].update();
            }
        }

        // Update 'enemy' entities.
        for (let i = 0; i < this.enemies.length; i++) {
            if (!this.enemies[i].removeFromWorld) {
                this.enemies[i].update();
            }
        }

        // Update 'attack' entities.
        for (let i = 0; i < this.attacks.length; i++) {
            if (!this.attacks[i].removeFromWorld) {
                this.attacks[i].update();
            }
        }

        // Update 'portal' entity.
        if (this.portal && !this.portal.removeFromWorld) {
            this.portal.update();
        }

        // Update 'player' entity.
        if (this.player && !this.player.removeFromWorld) {
            //console.log("Player exists, checking for portal interaction...");
            // Check if player has collided with portal
            if (this.portal) {
                //console.log("Portal exists, handling player interaction...");
                // Call a method in the portal to handle player interaction (if needed)
                this.portal.handlePlayerInteraction(this.player);
            }

            // // Check if player's bounding box is colliding with the portal's bounding box
            // if (this.portal && this.portal.boundingBox.isColliding(this.player.boundingBox)) {
            //     //console.log("Player colliding with portal, removing player from world...");
            //     this.currMap = 0;
            // }
            this.player.update();
        } else {
            //console.log("No player or player removed from world.");
        }

        // Remove 'other' entities that are marked for deletion.
        for (let i = this.entities.length - 1; i >= 0; --i) {
            if (this.entities[i].removeFromWorld) {
                this.entities.splice(i, 1);
            }
        }

        // Remove 'object' entities that are marked for deletion.
        for (let i = this.objects.length - 1; i >= 0; --i) {
            if (this.objects[i].removeFromWorld) {
                this.objects.splice(i, 1);
            }
        }

        // Remove 'enemy' entities that are marked for deletion.
        for (let i = this.enemies.length - 1; i >= 0; --i) {
            if (this.enemies[i].removeFromWorld) {
                this.addEntity(new Exp_Orb(this, this.enemies[i].worldX, this.enemies[i].worldY, this.enemies[i].exp));
                this.enemies.splice(i, 1);
            }
        }

        // Remove 'attack' entities that are marked for deletion.
        for (let i = this.attacks.length - 1; i >= 0; --i) {
            if (this.attacks[i].removeFromWorld) {
                //this.addEntity(new Exp_Orb(this, this.attacks[i].worldX, this.attacks[i].worldY, this.attacks[i].exp));
                this.attacks.splice(i, 1);
            }
        }

        // Remove 'portal' entity if marked for deletion.
        if (this.portal && this.portal.removeFromWorld) {
            this.portal = null;
        }

        // Remove 'player' entity if marked for deletion.
        if (this.player && this.player.removeFromWorld) {
            //this.player = null;   // If this is commented out, we don't delete the player entity on death.
        }

        // Update the elapsed time.
        this.elapsedTime = Date.now() - this.startTime;

        // Loop through 'other' entities and set removeFromWorld flags.
        // for (let i = 0; i < this.entities.length; i++) {
        //
        // }

        // Update enemy collisions
        // Check for collisions between enemies
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                let enemy1 = this.enemies[i];
                let enemy2 = this.enemies[j];

                if (enemy1.boundingBox.isColliding(enemy2.boundingBox)) {
                    this.respondToCollision(enemy1, enemy2);
                }
            }
        }

        // Loop through 'enemy' entities and set removeFromWorld flags.
        for (let i = 0; i < this.enemies.length; i++) {
            // If dead Zombie, mark for deletion.
            if (this.enemies[i].isDead) {
                this.enemies[i].removeFromWorld = true;
            }
        }

        // Loop through 'attack' entities and set removeFromWorld flags.
        for (let i = 0; i < this.attacks.length; i++) {
            // Removes any playerAttack attack circles if their duration is depleted.
            if((this.attacks[i].type === "playerAttack" || this.attacks[i].type === "enemyAttack" || this.attacks[i].type === "attack") && this.attacks[i].duration <= 0){
                this.attacks[i].removeFromWorld = true;
            }
        }

        // Check if player is dead, if so: mark player for deletion.
        if (this.player && this.player.isDead) {
            this.player.removeFromWorld = true;
        }

        if(this.elapsedTime % 1000 < 100) {
            this.spawnRandomEnemy();
        }
    }

    respondToCollision(enemy1, enemy2) {
        // Calculate the direction vector between the two enemies
        const directionX = enemy1.worldX - enemy2.worldX;
        const directionY = enemy1.worldY - enemy2.worldY;

        // Normalize the direction vector
        const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
        const normalizedDirectionX = directionX / magnitude;
        const normalizedDirectionY = directionY / magnitude;

        // Set a small bounce distance
        const bounceDistance = 1; // Adjust this value as needed

        // Move each enemy away from the other by the bounce distance
        if (enemy1.boundingBox.type !== "enemyBoss" && enemy1.boundingBox.type !== "player") {
            enemy1.worldX += normalizedDirectionX * bounceDistance;
            enemy1.worldY += normalizedDirectionY * bounceDistance;
        }
        if (enemy2.boundingBox.type !== "enemyBoss" && enemy2.boundingBox.type !== "player") {
            enemy2.worldX -= normalizedDirectionX * bounceDistance;
            enemy2.worldY -= normalizedDirectionY * bounceDistance;

        }

        // Immediately update bounding boxes after changing positions
        enemy1.updateBoundingBox();
        enemy2.updateBoundingBox();
    }

    /** Starts the game engine loop system. This makes the update and draw methods loop. */
    loop() {
        this.clockTick = this.timer.tick();
        this.update();
        this.draw();
    }

    /** Draws the mouse tracks on the screen. */
    drawMouseTracker(ctx) {
        if (this.mouse) {
            const crossSize = 10; // Size of the cross
            ctx.strokeStyle = 'white'; // Color of the cross

            ctx.beginPath();

            // Draw horizontal line
            ctx.moveTo(this.mouse.x - crossSize, this.mouse.y);
            ctx.lineTo(this.mouse.x + crossSize, this.mouse.y);

            // Draw vertical line
            ctx.moveTo(this.mouse.x, this.mouse.y - crossSize);
            ctx.lineTo(this.mouse.x, this.mouse.y + crossSize);

            ctx.stroke();
        }
    }

}
