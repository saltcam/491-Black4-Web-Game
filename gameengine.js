// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

class GameEngine {
    constructor(options) {
        // What you will use to draw
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        this.ctx = null;

        // Everything that will be updated and drawn each frame
        this.entities = [];

        // Information on the input
        this.click = null;
        this.mouse = null;
        this.wheel = null;
        this.keys = {};

        // this.worldX = 0;
        // this.worldY = 0;

        // Initialize the Camera
        this.camera = null;

        // What is the current map?
        // 0 == Rest Area
        // 1 == Grasslands
        // 2 == Cave
        // 3 == Space?
        this.currMap = 1

        // Define the scaling factors for each map
        this.mapZeroScaleFactor = 0.25;
        this.mapOneScaleFactor = 0.3;
        this.mapTwoScaleFactor = 0.25;
        this.mapThreeScaleFactor = 0.25;

        this.initialized = false; // To check if initial positions are set
        this.textureOffsetX = 0; // Initial horizontal offset for the grass texture
        this.textureOffsetY = 0; // Initial vertical offset for the grass texture


        // this.mapComplete = false; // Used to track when map is complete to load the upgrade screen

        // Tracks how many enemies are spawned
        this.enemyCount = 0;

        // Flag to tell whether the current round is over.
        this.roundOver = false;

        // Tracks object entities
        this.objects = [];

        // Tracks enemy entities
        this.enemies = [];

        // Tracks the player entity
        this.player = null;

        // Tracks the portal entity (with this setup - there should only ever be ONE portal active at once)
        this.portal = null;

        // Options and the Details
        this.options = options || {
            debugging: false,
        };
        this.startTime = null;
        this.elapsedTime = 0;
    }

    init(ctx) {
        this.ctx = ctx;
        this.startInput();
        this.timer = new Timer();
        //this.initEnemySpawns();
    }

    initEnemySpawns() {
        // Spawn 50 zombies
        while (this.enemyCount < 5) {
            let randomXNumber, randomYNumber;

            do {
                // Set min X = -(horizontal canvas resolution)
                let minX = -(1440);
                let maxX = minX * (-1);
                randomXNumber = Math.floor(Math.random() * (maxX - minX + 1)) + minX;

                // Set min Y = -(vertical canvas resolution)
                let minY = -(810);
                let maxY = minY * (-1);
                randomYNumber = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
            } while (Math.abs(randomXNumber) <= 1440/1.8 && Math.abs(randomYNumber) <= 810/1.5);

            this.addEntity(new Enemy_Contact("Zombie", 100, 100, 1, gameEngine, randomXNumber, randomYNumber, 38, 56.66, "enemy", 270,
                "./sprites/zombie-spritesheet-walk.png",
                0, 0, 48, 55, 4, 0.35, 1.5
            ));

            this.enemyCount++;
        }
    }

    initCamera() {
        // Assuming the player is already created and added to the entities list
        if(!this.player) {
            console.log("gameengine.initCamera(): Player not found!");
        }
        else {
            this.camera = new Camera(this.player, this.ctx.canvas.width, this.ctx.canvas.height);
        }
    }

   start() {
        //this.running = true; // Not being used?
        this.startTime = Date.now();
        const gameLoop = () => {
            this.loop();
            requestAnimFrame(gameLoop, this.ctx.canvas);
        };
        gameLoop();
    }

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
            this.leftClick = getXandY(e);
        });

        this.ctx.canvas.addEventListener("wheel", e => {
            if (this.options.debugging) {
                console.log("WHEEL", getXandY(e), e.deltaY);
            }
            e.preventDefault(); // Prevent Scrolling
            this.wheel = e;
        });

        this.ctx.canvas.addEventListener("contextmenu", e => {
            e.preventDefault(); // Prevent the default context menu
            if (this.options.debugging) {
                console.log("RIGHT_CLICK", getXandY(e));
            }
            this.rightClick = true; // Set the right-click flag
        });

        this.ctx.canvas.addEventListener("keydown", event => this.keys[event.key] = true);
        this.ctx.canvas.addEventListener("keyup", event => this.keys[event.key] = false);
    }

    addEntity(entity) {
        // if (entity instanceof Dude) {
        //     this.player = entity; // Keep a reference to the player for tracking
        // }
        // this.entities.push(entity);

        // New way of adding entities
        // This allows us to do a performance friendly draw() method
        // Which lets us layer the most important entities over the less important ones (ex: player will be drawn over EVERYTHING)
        if (entity.boundingBox.type === "player") {
            this.player = entity;
        } else if (entity.boundingBox.type === "portal") {
            this.portal = entity;
        } else if (entity.boundingBox.type === "enemy") {
            this.enemies.push(entity);
        } else if (entity.boundingBox.type === "object") {
            this.objects.push(entity);
        }
        // Everything else is stored in entities list
        else {
            this.entities.push(entity);
        }
    }

    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw the background of the canvas
        this.drawBackground('./sprites/map_space_background.png', 1);

        // Draw the grass texture behind the player
        this.drawMap();

        // Draw 'other' entities
        for (let entity of this.entities) {
            entity.draw(this.ctx);
        }

        // Draw objects
        for (let object of this.objects) {
            object.draw(this.ctx);
        }

        // Draw enemies
        for (let enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        // Draw portal
        if (this.portal) {
            this.portal.draw(this.ctx);
        }

        // Draw player
        if (this.player) {
            this.player.draw(this.ctx);
        }

        // Draw the mouse tracker
        this.drawMouseTracker(this.ctx);
        this.drawTimer(this.ctx);

        // If the player is dead
        if (this.player.isDead) {
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

        // // If the defeated all enemies, display 'You Won!'
        // if (this.enemyCount <= 0) {
        //     this.ctx.beginPath();
        //
        //     // Draw "You Won!" text in large yellow font at the center of the canvas
        //     this.ctx.font = '75px Arial';
        //     this.ctx.fillStyle = 'yellow';
        //     this.ctx.textAlign = 'center'
        //     this.ctx.fillText('You Won!', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        //     this.ctx.closePath();
        // }
    }

    drawTimer(ctx) {
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center'
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        ctx.fillText(formattedTime, this.ctx.canvas.width / 2, 30);
    }

    drawMap() {
        // Check if the camera and player are initialized
        // This is necessary as they are needed, but may not be initialized on the first few calls of this method
        // at the start of the game.
        if (!this.camera || !this.player) {
            return; // Skip drawing the map if the camera or player is not initialized
        }

        // If 0, then Rest Area Map is used
        if (this.currMap === 0) {

        }
        // If 1, then Grasslands Map is used
        else if (this.currMap === 1) {
            const map = ASSET_MANAGER.getAsset("./sprites/map_grasslands.png");

            this.mapWidth = map.width;
            this.mapHeight = map.height;

            // Calculate the scaled width and height of the textures
            const scaledWidth = this.mapWidth * this.mapOneScaleFactor;
            const scaledHeight = this.mapHeight * this.mapOneScaleFactor;

            // If the map has not been centered yet, initialize its position
            if (!this.initialized) {
                this.textureOffsetX = this.player.worldX - scaledWidth / 2 + this.player.animator.width / 2;
                this.textureOffsetY = this.player.worldY - scaledHeight / 2 + this.player.animator.height / 2;
                this.initialized = true;
            }

            // Adjust the texture's position to move inversely to the player's movement
            const textureX = this.textureOffsetX - this.camera.x;
            const textureY = this.textureOffsetY - this.camera.y;

            // Draw the scaled texture centered on the player's position accounting for the camera
            this.ctx.drawImage(map, textureX, textureY, scaledWidth, scaledHeight);
        }
        // If 2, then Cave Map is used
        else if (this.currMap === 2){

        }
        // If 3, then Space Map is used
        else if (this.currMap === 3){

        }
    }

    drawBackground(spritePath, scaleFactor) {
        const texture = ASSET_MANAGER.getAsset(spritePath);
        const textureWidth = Math.round(texture.width * scaleFactor);
        const textureHeight = Math.round(texture.height * scaleFactor);

        // Calculate how many times the texture needs to be repeated horizontally and vertically
        const timesToRepeatHorizontally = Math.ceil(this.ctx.canvas.width / textureWidth);
        const timesToRepeatVertically = Math.ceil(this.ctx.canvas.height / textureHeight);

        // Use two nested loops to draw the image multiple times across the canvas
        for (let x = 0; x < timesToRepeatHorizontally; x++) {
            for (let y = 0; y < timesToRepeatVertically; y++) {
                this.ctx.drawImage(texture, x * textureWidth, y * textureHeight, textureWidth, textureHeight);
            }
        }
    }

    update() {
        let entitiesCount = this.entities.length;

        // // Check if all enemies have been defeated
        // // If so, spawn the portal to the next area
        // if (this.enemyCount <= 0 && !this.roundOver) {
        //     this.addEntity(new Portal(this, this.player.worldX + 200, this.player.worldY));
        //     this.roundOver = true;
        // }

        // The original way to update all entities
        // for (let i = 0; i < entitiesCount; i++) {
        //     let entity = this.entities[i];
        //
        //     if (!this.entities[i].removeFromWorld) {
        //         entity.update();
        //     }
        // }

        // New way of updating all entities
        // Update 'other' entities
        for (let i = 0; i < entitiesCount; i++) {
            let entity = this.entities[i];

            if (!this.entities[i].removeFromWorld) {
                entity.update();
            }
        }

        // Update object entities
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].update();
        }

        // Update enemy entities
        for (let i = 0; i < this.enemies.length; i++) {
            this.enemies[i].update();
        }

        // Update portal entity
        if (this.portal && !this.portal.removeFromWorld) {
            this.portal.update();
        }

        // Update player entity
        if (this.player && !this.player.removeFromWorld) {
            this.player.update();
        }

        for (let i = this.entities.length - 1; i >= 0; --i) {
            if (this.entities[i].removeFromWorld) {
                this.entities.splice(i, 1);
            }
        }

        this.elapsedTime = Date.now() - this.startTime;

        // Loop through entities and set removeFromWorld flags
        for (let i = 0; i < this.entities.length; i++) {
            // If dead Zombie
            if (this.entities[i].name === "Zombie" && this.entities[i].isDead) {
                this.entities[i].removeFromWorld = true;
                this.enemyCount--;
            }

            // Removes any playerAttack attack circles if their duration is depleted
            if(this.entities[i].type === "playerAttack" && this.entities[i].duration <= 0){
                this.entities[i].removeFromWorld = true;
            }
        }

        // // This is for testing purposes.
        // // It will kill all zombies in the game to force the player to 'Win' after 30 seconds
        // if (this.elapsedTime >= 5000) {
        //     for (let i = 0; i < this.entities.length; i++) {
        //         if (this.entities[i].name === "Zombie") {
        //             this.entities[i].currHP = 0;
        //         }
        //     }
        // }
    }

    loop() {
        this.clockTick = this.timer.tick();
        this.update();
        this.draw();
    }

    //draws the mouse tracker
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

// KV Le was here :)