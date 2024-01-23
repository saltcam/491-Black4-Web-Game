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

        // this.mapComplete = false; // Used to track when map is complete to load the upgrade screen

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
    }

    initMap() {
        const map = ASSET_MANAGER.getAsset("./sprites/map_grasslands.png");
        this.mapWidth = map.width;
        this.mapHeight = map.height;

        // Assuming the player is already created and added to the entities list
        if(!this.entities.find(entity => entity instanceof Dude)) {
            console.log("gameengine.initMaP(): Player not found!");
        }
        else {
            // Center the map behind the player
            this.mapX = -this.mapWidth / 2 + this.player.animator.width / 2;
            this.mapY = -this.mapHeight / 2 + this.player.animator.height / 2;
        }
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

        // If the player is dead
        if (this.player.isDead) {
            // Draw "You Died!" text in large red font at the center of the canvas
            this.ctx.font = '75px Arial';
            this.ctx.fillStyle = 'red';
            this.ctx.textAlign = 'center'
            this.ctx.fillText('You Died!', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
        }

        // Draw entities relative to the camera
        for (let i = 0; i < this.entities.length; i++) {
            // Adjust the position of each entity to the camera
            this.entities[i].draw(this.ctx);
        }
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
        const map = ASSET_MANAGER.getAsset("./sprites/map_grasslands.png");

        // Adjust the position based on the camera
        // Note: The map moves in the opposite direction of the camera to simulate player movement
        const screenX = this.mapX - this.camera.x;
        const screenY = this.mapY - this.camera.y;

        // Draw the map
        this.ctx.drawImage(map, screenX, screenY, this.mapWidth, this.mapHeight);
    }

    update() {
        let entitiesCount = this.entities.length;

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

        if (this.entities.length < 100) {
            let randomXNumber, randomYNumber;

            do {
                // Set min X = -(horizontal canvas resolution) * modifier
                let minX = -(1440);
                let maxX = minX * (-1);
                randomXNumber = Math.floor(Math.random() * (maxX - minX + 1)) + minX; // Random x-coordinate between -700 and 700 units

                // Set min Y = -(vertical canvas resolution) * modifier
                let minY = -(810);
                let maxY = minY * (-1);
                randomYNumber = Math.floor(Math.random() * (maxY - minY + 1)) + minY; // Random y-coordinate between -405 and 405 units
            } while (Math.abs(randomXNumber) <= 1440/1.8 && Math.abs(randomYNumber) <= 810/1.5);

            this.addEntity(new Enemy_Contact("Zombie", 15, 15, 1, gameEngine, randomXNumber, randomYNumber, 38, 56.66, "enemy", 37,
                "./sprites/zombie-spritesheet-walk.png",
                0, 0, 48, 55, 4, 0.35, 1.5));
        }


        // Loop through entities and set removeFromWorld to true for each
        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i].isDead) {
                this.entities[i].removeFromWorld = true;
            }
        }
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