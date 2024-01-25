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
        this.mapOneScaleFactor = 0.25;
        this.mapTwoScaleFactor = 0.25;
        this.mapThreeScaleFactor = 0.25;

        // this.mapComplete = false; // Used to track when map is complete to load the upgrade screen

        // Tracks how many enemies are spawned
        this.enemyCount = 0;

        // Flag to tell whether the current round is over.
        this.roundOver = false;

        // Tracks the player object
        this.player = null;

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
        this.initEnemySpawns();
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

    initMap() {
        // const map = ASSET_MANAGER.getAsset("./sprites/map_grasslands.png");
        //
        // // Store original map dimensions
        // this.mapWidth = map.width;
        // this.mapHeight = map.height;
        //
        // // Calculate the scaled dimensions of the map
        // const scaledMapWidth = this.mapWidth * this.mapOneScaleFactor;
        // const scaledMapHeight = this.mapHeight * this.mapOneScaleFactor;
        //
        // // Assuming the player is already created and added to the entities list
        // if (!this.entities.find(entity => entity instanceof Dude)) {
        //     console.log("gameengine.initMap(): Player not found!");
        // } else {
        //     const player = this.entities.find(entity => entity instanceof Dude);
        //
        //     // Set the initial map position to center the scaled map under the player
        //     this.mapX = player.worldX - scaledMapWidth / 2;
        //     this.mapY = player.worldY - scaledMapHeight / 2;
        // }
    }


    initCamera() {
        // Assuming the player is already created and added to the entities list
        if(!this.entities.find(entity => entity instanceof Dude)) {
            console.log("gameengine.initCamera(): Player not found!");
        }
        else {
            const player = this.entities.find(entity => entity instanceof Dude);
            this.camera = new Camera(player, this.ctx.canvas.width, this.ctx.canvas.height);
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
        if (entity instanceof Dude) {
            this.player = entity; // Keep a reference to the player for tracking
        }
        this.entities.push(entity);
    }

    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw the grass texture behind the player
        this.drawMap();

        // Draw the mouse tracker
        this.drawMouseTracker(this.ctx);
        this.drawTimer(this.ctx);

        // Draw entities relative to the camera
        for (let i = 0; i < this.entities.length; i++) {
            // Adjust the position of each entity to the camera
            this.entities[i].draw(this.ctx);
        }

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
        // If 0, then Rest Area Map is used
        if (this.currMap === 0) {

        }
        // If 1, then Grasslands Map is used
        else if (this.currMap === 1) {
            const map = ASSET_MANAGER.getAsset("./sprites/grass.png");
            this.mapWidth = map.width;
            this.mapHeight = map.height;

            // Calculate the scaled width and height of the map
            const scaledWidth = this.mapWidth * this.mapOneScaleFactor;
            const scaledHeight = this.mapHeight * this.mapOneScaleFactor;

            // Draw the scaled map centered on the canvas
            this.ctx.drawImage(map, 0, 0, scaledWidth, scaledHeight);
        }
        // If 2, then Cave Map is used
        else if (this.currMap === 2){

        }
        // If 3, then Space Map is used
        else if (this.currMap === 3){

        }
    }

    update() {
        let entitiesCount = this.entities.length;

        // Check if all enemies have been defeated
        // If so, spawn the portal to the next area
        if (this.enemyCount <= 0 && !this.roundOver) {
            this.addEntity(new Portal(this, this.player.worldX + 200, this.player.worldY));
            this.roundOver = true;
        }

        for (let i = 0; i < entitiesCount; i++) {
            let entity = this.entities[i];

            if (!this.entities[i].removeFromWorld) {
                entity.update();
            }
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