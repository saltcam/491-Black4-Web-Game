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

        // Options and the Details
        this.options = options || {
            debugging: false,
        };
    };

    init(ctx) {
        this.ctx = ctx;
        this.startInput();
        this.timer = new Timer();
    };

    initCamera() {
        // Assuming the player is already created and added to the entities list
        if(!this.entities.find(entity => entity instanceof Dude)) {
            console.log("Player not found!");
        }
        else {
            const player = this.entities.find(entity => entity instanceof Dude);
            this.camera = new Camera(player, this.ctx.canvas.width, this.ctx.canvas.height);
        }
    }

   start() {
        this.running = true;
        const gameLoop = () => {
            this.loop();
            requestAnimFrame(gameLoop, this.ctx.canvas);
        };
        gameLoop();
    };

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
                console.log("WHEEL", getXandY(e), e.wheelDelta);
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
    };

    addEntity(entity) {
        if (entity instanceof Dude) {
            this.player = entity; // Keep a reference to the player for tracking
        }
        this.entities.push(entity);
    };

    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw the grass texture relative to the camera
        this.drawGrassBackground();
        
        // Draw entities relative to the camera
        for (let i = 0; i < this.entities.length; i++) {
            // Adjust the position of each entitiy to the camera
            this.entities[i].draw(this.ctx, this.camera.x, this.camera.y);
        }

        // // Draw game entities ORIGINAL
        // for (let i = this.entities.length - 1; i >= 0; i--) {
        //     this.entities[i].draw(this.ctx, this);
        // }

        //draw the mouse tracker
        this.drawMouseTracker(this.ctx);
    };

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
        const mapWidth = map.width;
        const mapHeight = map.height;

        // Map's fixed position in the game world (top-left corner)
        const mapWorldX = 0;
        const mapWorldY = 0;

        // Adjust the position based on the camera
        const screenX = mapWorldX - this.camera.x - this.ctx.canvas.width / 2;
        const screenY = mapWorldY - this.camera.y - this.ctx.canvas.height / 2;

        // Draw the map
        this.ctx.drawImage(map, screenX, screenY, mapWidth, mapHeight);
    }

    update() {
        let entitiesCount = this.entities.length;

        for (let i = 0; i < entitiesCount; i++) {
            let entity = this.entities[i];

            if (!entity.removeFromWorld) {
                entity.update();
            }
        }

        for (let i = this.entities.length - 1; i >= 0; --i) {
            if (this.entities[i].removeFromWorld) {
                this.entities.splice(i, 1);
            }
        }
    };

    loop() {
        this.clockTick = this.timer.tick();
        this.update();
        this.draw();
    };

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

};

// KV Le was here :)