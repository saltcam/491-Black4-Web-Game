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
        /** Tracks arrow pointer entities */
        this.arrowPointers = [];
        /** Tracks enemy entities. */
        this.enemies = [];
        /** Tracks ally entities */
        this.allies = [];
        /** Tracks the portal entity (with this setup - there should only ever be ONE portal active at once). */
        this.portal = null;
        /** Tracks the attack entities like projectiles and attackCirc. */
        this.attacks = [];
        /** Tracks the items on the map. */
        this.items = [];
        /** Tracks the damage numbers on the map. */
        this.damageNumbers = [];
        /** Tracks the player entity. */
        this.player = null;
        /** Tracks the currently spawned boss. */
        this.boss = null;

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
         * -2 == How to Play
         * -1 == Main Menu
         * 0 == Rest Area
         * 1 == Grasslands
         * 2 == Cave
         * 3 == Space
         */
        this.currMap = -1;

        // Map Scaling Variables
        /** Map scale for map 0 (Rest Area) */
        this.mapZeroScaleFactor = 1.5;
        /** Map scale for map 1 (Grasslands Map) */
        this.mapOneScaleFactor = 1;
        /** Map scale for map 2 (Cave Map) */
        this.mapTwoScaleFactor = 1;
        /** Map scale for map 3 (Space Map) */
        this.mapThreeScaleFactor = 1;

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

        /** Tracks if the round is over. */
        this.roundOver = false;

        // Screen fade-to-black variables
        /** The current fade-to-black state of the screen. Ex: 'in', 'out', or 'none' */
        this.fadeState = 'none';
        /** The duration in seconds of fade-to-black animation. */
        this.fadeDuration = 0.8;
        /** The elapsed time since the fade-to-black animation started. */
        this.fadeElapsed = 0;
        /** Whether we are fading to or from black. */
        this.fadeToBlack = false;
        /** Tracks the time when the last frame was drawn. */
        this.lastDrawTime = Date.now();
        /** The calculated FPS value. */
        this.fps = 0;

        /** The spawn system that controls enemy spawning. */
        this.SPAWN_SYSTEM = new Spawn_System(this);
        /** Tracks the Upgrade_System (handles player and weapon upgrade screens/interactions). */
        this.UPGRADE_SYSTEM = new Upgrade_System(this);

        /** If true, pauses all entities from moving/taking action. Also pauses the game timer.*/
        this.isGamePaused = false;
        /** To record when the game was paused. */
        this.pauseStartTime = 0;
        /** To accumulate total paused duration. */
        this.totalPausedTime = 0;

        this.youWon = false; // temp win condition

        /** Stores active custom timeout calls, they respond to the game being paused. */
        this.activeTimeouts = []; // To store active timeouts
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
    }

    /** Call this to toggle the game pausing. */
    togglePause() {
        this.isGamePaused = !this.isGamePaused;

        if (this.isGamePaused) {
            this.pauseStartTime = Date.now();
            this.pauseTimeouts(); // Pause timeouts
        } else {
            this.totalPausedTime += Date.now() - this.pauseStartTime;
            this.resumeTimeouts(); // Resume timeouts
        }
    }

    /** Call this method to spawn boss one (Knight - Orange Bro). This was made to be a test method. */
    spawnBossOne() {
        this.boss = this.addEntity(new BossOne(this, 250, 0));
    }
    spawnBossTwo() {
        this.boss = this.addEntity(new BossTwo(this, 250, 0));
    }

    /**
     * Call this to spawn an upgrade chest at the given coordinates.
     * Returns the chest entity.
     * @param   worldX  The x coordinate on the world to spawn the chest.
     * @param   worldY  The y coordinate on the world to spawn the chest.
     */
    spawnUpgradeChest(worldX, worldY) {
        let newEntity = this.addEntity(new Map_object(this, worldX, worldY, 35, 35, "./sprites/object_treasure_chest.png", 0, 0, 54, 47, 25, 0.03, 1.25));
        newEntity.boundingBox.type = "chest";
        newEntity.animator.pauseAtFrame(0); // Pause the chest animation to the first frame
        newEntity.animator.outlineMode = true; // Turn on the outline
        this.addEntity(new Arrow_Pointer(newEntity, this)); // Attach an arrow pointer to the chest

        return newEntity;
    }

    /** Call this to initialize the Rest Area (Map #0) objects. */
    initRestAreaObjects() {
        let anvil = this.addEntity(new Map_object(this, 150, -65, 40, 20, "./sprites/object_anvil.png", 0, 0, 93, 57, 20 + (32), 0.035, 1));
        anvil.boundingBox.type = "anvil";
        this.mapObjectsInitialized = true;
    }

    /** Call this to initialize the grassmands (Map #1) objects. */
    initGrasslandsObjects() {
        // Visible Objects
        // Collectable Objects
        this.spawnUpgradeChest(-1846, -1943);
        this.spawnUpgradeChest(1797, 2802);

        // Debug Portal
        //this.spawnPortal(0, 100, 0);

        // Rocks
        let newEntity = this.addEntity(new Map_object(this, -250, 0, 55, 56-30, "./sprites/map_rock_object.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -1100, 255, 55, 56-30, "./sprites/map_rock_object.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -1210, 2670, 55, 56-30, "./sprites/map_rock_object.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -2765, -2250, 55, 56-30, "./sprites/map_rock_object.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, 2605, -730, 55, 56-30, "./sprites/map_rock_object.png", 0, 0, 86, 56, 1, 1, 2));

        // Debris
        newEntity = this.addEntity(new Map_object(this, -1950, -2120, 185, 160, "./sprites/object_wall_debris.png", 0, 0, 215, 192, 1, 1, 1));
        newEntity = this.addEntity(new Map_object(this, 1710, 2641, 170, 80, "./sprites/object_wall_debris2.png", 0, 0, 215, 242, 1, 1, 1));
        newEntity = this.addEntity(new Map_object(this, 1125, 2270, 50, 90, "./sprites/object_pillar_debris.png", 0, 0, 50, 164, 1, 1, 1));
        newEntity = this.addEntity(new Map_object(this, -1620, -1210, 50, 90, "./sprites/object_pillar_debris.png", 0, 0, 50, 164, 1, 1, 1));

        // Invisible Objects
        // Center Hole
        newEntity = this.addEntity(new Map_object(this, -750, -1450, 375, 375, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);    // Essentially makes the sprite invisible by pausing on a frame that doesn't exist.
        newEntity = this.addEntity(new Map_object(this, 475, -1375, 2100, 885, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);
        newEntity = this.addEntity(new Map_object(this, 1070, -850, 485, 200, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);

        // Top-Left Hole
        newEntity = this.addEntity(new Map_object(this, -1785, -3000, 3100, 650, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);

        // Left Hole
        newEntity = this.addEntity(new Map_object(this, -2310, 285, 727, 670, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);
        newEntity = this.addEntity(new Map_object(this, -1805, 145, 280, 390, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);

        // Bottom Hole
        newEntity = this.addEntity(new Map_object(this, -130, 2125, 1400, 525, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);
        newEntity = this.addEntity(new Map_object(this, -35, 2420, 1210, 300, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);

        // Bottom-Right Hole
        newEntity = this.addEntity(new Map_object(this, 2475, 1170, 450, 1260, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);
        newEntity = this.addEntity(new Map_object(this, 3025, 1070, 750, 2710, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);

        this.mapObjectsInitialized = true;
    }

    initCaveObjects() {
        // Visible Objects
        // Collectable Objects
        this.spawnUpgradeChest(-1846, -1943);
        this.spawnUpgradeChest(1797, 2802);

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

        this.ctx.canvas.addEventListener("keydown", event => this.keys[event.key.toLowerCase()] = true);
        this.ctx.canvas.addEventListener("keyup", event => this.keys[event.key.toLowerCase()] = false);
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
        } else if (entity.boundingBox.type === "item") {
            this.items.push(entity);
        } else if (entity.boundingBox.type === "portal") {
            this.portal = entity;
        } else if (entity.boundingBox.type === "enemy" || entity.boundingBox.type === "enemyBoss") {
            this.enemies.push(entity);
            if (entity.boundingBox.type === "enemyBoss") {
                this.boss = entity;
            }
        } else if (entity.boundingBox.type === "ally") {
            this.allies.push(entity);
        } else if (entity.boundingBox.type.includes("attack") || entity.boundingBox.type.includes("Attack")) {
            this.attacks.push(entity);
        } else if (entity.boundingBox.type === "object") {
            this.objects.push(entity);
        } else if (entity instanceof Arrow_Pointer) {
            this.arrowPointers.push(entity);
        } else if (entity.boundingBox.type === "damageNumber") {
            this.damageNumbers.push(entity);
        }
        // Everything else is stored in entities list (Attack collision objects etc.)
        else {
            this.entities.push(entity);
        }

        return entity;
    }

    randomOffscreenCoords() {
        const buffer = 250; // Distance outside the camera view
        let x, y;

        // Determine if the enemy will spawn horizontally or vertically outside the camera view
        if(Math.random() < 0.5) {
            // Horizontal spawn
            x = Math.random() < 0.5 ? this.camera.x - buffer : this.camera.x + this.camera.width + buffer;
            y = Math.random() * (this.camera.height) + this.camera.y;
        } else {
            // Vertical spawn
            x = Math.random() * (this.camera.width) + this.camera.x;
            y = Math.random() < 0.5 ? this.camera.y - buffer : this.camera.y + this.camera.height + buffer;
        }

        return { x, y };
    }

    /** This will be called to let the portal execute map switching code only when the game engine is mid-fade-to-black. */
    performPostFadeInActions() {
        if (this.fadeInCompleteAction) {
            this.fadeInCompleteAction();
            this.fadeInCompleteAction = null; // Clear the action to ensure it's only performed once
        }
    }

    /** Call this method on every frame to draw each entity or UI elements on the canvas. */
    draw() {
        // Clear the canvas.
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw the background of the map.
        this.drawBackground('./sprites/map_space_background.png', 1, true);

        // Draw the map texture.
        this.drawMap();

        if (this.currMap >= 0) {
            // Draw 'other' entities.
            for (let entity of this.entities) {
                entity.draw(this.ctx, this);

                // If debug mode, then draw debug features.
                if (this.debugMode && entity instanceof Entity) {
                    //entity.drawHealth(this.ctx);
                    entity.boundingBox.draw(this.ctx, this);
                }
            }

            // Define a threshold for sorting (e.g., 5 pixels)
            const sortingThreshold = 5;

            // Sort enemies based on their worldY position with a threshold
            this.objects.sort((a, b) => {
                // Calculate the difference in worldY positions
                const diff = a.worldY - b.worldY;

                // Only consider them different if the difference exceeds the threshold
                if (Math.abs(diff) < sortingThreshold) {
                    return 0; // Consider them as equal for sorting purposes
                }
                return diff;
            });

            // Draw 'object' entities.
            for (let object of this.objects) {
                object.draw(this.ctx, this);

                // If debug mode, then draw debug features.
                if (this.debugMode) {
                    object.drawHealth(this.ctx);
                    object.boundingBox.draw(this.ctx, this);
                }
            }

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

            // Sort enemies based on their worldY position with a threshold
            this.allies.sort((a, b) => {
                // Calculate the difference in worldY positions
                const diff = a.worldY - b.worldY;

                // Only consider them different if the difference exceeds the threshold
                if (Math.abs(diff) < sortingThreshold) {
                    return 0; // Consider them as equal for sorting purposes
                }
                return diff;
            });


            // Draw 'attack' entities that are labeled as choreographed ('CAR_').
            for (let attack of this.attacks) {
                if (!attack instanceof AttackCirc || !attack.type || !attack.type.includes("CAR_")) {
                    continue;
                }

                attack.draw(this.ctx, this);

                // If debug mode, then draw debug features.
                if (this.debugMode) {
                    //attack.drawHealth(this.ctx);
                    attack.boundingBox.draw(this.ctx, this);
                }
            }

            // Draw 'enemy' entities.
            for (let enemy of this.enemies) {
                enemy.draw(this.ctx, this);

                // If debug mode, then draw debug features.
                if (this.debugMode) {
                    enemy.drawHealth(this.ctx);
                }
            }

            // Draw 'ally' entities.
            for (let enemy of this.allies) {
                enemy.draw(this.ctx, this);

                // If debug mode, then draw debug features.
                if (this.debugMode) {
                    enemy.drawHealth(this.ctx);
                }
            }

            // Draw 'attack' entities not labeled as choreographed ('CAR_').
            for (let attack of this.attacks) {
                if (attack instanceof AttackCirc && attack.type && attack.type.includes("CAR_")) {
                    continue;
                }

                attack.draw(this.ctx, this);

                // If debug mode, then draw debug features.
                if (this.debugMode) {
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

            // Draw 'item' entities.
            for (let item of this.items) {
                item.draw(this.ctx, this);

                // If debug mode, then draw debug features.
                if (this.debugMode) {
                    item.boundingBox.draw(this.ctx, this);
                }
            }

            // Draw exp orbs
            for (let entity of this.entities) {
                if (entity.boundingBox.type === "orb") {
                    entity.draw(this.ctx, this);
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

            // Draw arrow Pointers
            // Draw 'object' entities.
            for (let arrow of this.arrowPointers) {
                arrow.draw(this.ctx, this);
            }

            // Draw UI elements
            // Draw damage/heal numbers
            for (let text of this.damageNumbers) {
                text.draw(this.ctx);
            }
            // Draw boss health bar.
            if (this.boss) {
                this.boss.drawBossHealthBar(this.ctx);
            }

            // Draw gold currency tracker UI
            this.drawGoldTracker(this.ctx);

            // Draw weapon upgrade screen.
            if (this.UPGRADE_SYSTEM) {
                this.UPGRADE_SYSTEM.draw(this.ctx);
            }

            // Draw the mouse tracker.
            this.drawMouseTracker(this.ctx);

            // Draw the timer if we are not in rest area.
            if (this.currMap > 0) {
                this.drawTimer(this.ctx);
            }

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

                // Pause game since we died
                if (this.player.currHP <= 0 && !this.isGamePaused) {
                    this.roundOver = true;
                    this.togglePause();
                }
            }

            // Temp win condition
            if (this.youWon && this.currMap === -1) {
                this.ctx.beginPath();

                this.ctx.fillStyle = "black";
                this.ctx.fillRect(this.ctx.canvas.width / 2 - 175, this.ctx.canvas.height / 2 - 75, 350, 95);
                // Draw "You Died!" text in large red font at the center of the canvas
                this.ctx.font = '75px Arial';
                this.ctx.fillStyle = 'yellow';
                this.ctx.textAlign = 'center'
                this.ctx.fillText('You Won!', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
                this.ctx.closePath();

                this.setManagedTimeout(() => {

                    if (!this.isGamePaused) {
                        this.togglePause();
                    }
                }, 1000);
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

            // Handle fade-to-black screen effect
            if (this.fadeState !== 'none') {
                const alpha = this.fadeElapsed / this.fadeDuration;
                this.ctx.globalAlpha = this.fadeToBlack ? Math.min(1, alpha) : Math.max(0, 1 - alpha);

                // Fill the canvas with black during fade in and out
                this.ctx.fillStyle = 'black';
                this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

                // Update the elapsed time for the current fade state
                this.fadeElapsed += this.clockTick;

                // Check if the fade to black has completed
                if (this.fadeToBlack && this.fadeElapsed >= this.fadeDuration) {
                    // The screen is now fully black, perform the map switch here
                    if (this.fadeInCompleteAction) {
                        this.fadeInCompleteAction(); // Execute the map switch
                        this.fadeInCompleteAction = null; // Prevent re-execution
                    }
                    // Prepare to fade back in by adjusting the fade state and resetting elapsed time
                    this.fadeToBlack = false;
                    this.fadeState = 'out';
                    this.fadeElapsed = 0;
                }
                // Check if the fade back in has completed
                else if (!this.fadeToBlack && this.fadeElapsed >= this.fadeDuration && this.fadeState === 'out') {
                    // Fade back in is complete, reset fade state and re-enable player controls
                    this.fadeState = 'none';
                    this.fadeElapsed = 0;
                    this.player.controlsEnabled = true;
                }
            }

            // Reset globalAlpha to ensure other drawing operations are unaffected
            this.ctx.globalAlpha = 1;

            // Calculate and draw FPS if debugMode is true
            if (this.debugMode) {
                const currentTime = Date.now();
                const timeDelta = currentTime - this.lastDrawTime;
                this.lastDrawTime = currentTime;

                // Avoid division by zero and calculate FPS
                if (timeDelta > 0) {
                    this.fps = 1000 / timeDelta;
                }

                // Draw FPS counter on the screen
                this.ctx.font = '20px Arial';
                this.ctx.fillStyle = 'yellow';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`FPS: ${this.fps.toFixed(2)}`, 10, 400);
            }
        }
    }

    /** Draws the game-time tracker on top of the game screen. */
    drawTimer(ctx)
    {
        // console.log("gameTime = " + this.timer.gameTime);
        // console.log("elapsedTime / 1000 = " + this.elapsedTime / 1000);
        // console.log("elapsedTime = " + this.elapsedTime);

        // Fix elapsed time if negative
        if (this.elapsedTime < 0) {
            this.elapsedTime = 0;
        }

        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        ctx.fillText(formattedTime, this.ctx.canvas.width / 2, 30);
    }

    /** Draws the gold currency tracker onto the game screen. */
    drawGoldTracker(ctx) {
        // Draw the currency bar background
        let scaleFactor = 0.75;    // How much to scale the image
        let image = ASSET_MANAGER.getAsset("./sprites/menu_currency_bar.png");
        let destWidth = image.width * scaleFactor; // scale factor < 1 to reduce size
        let destHeight = image.height * scaleFactor; // scale factor < 1 to reduce size
        ctx.drawImage(image, 1288, 0, destWidth, destHeight);

        // Draw the coin sprite
        scaleFactor = 0.5;    // How much to scale the image
        image = ASSET_MANAGER.getAsset("./sprites/object_coin.png");
        destWidth = image.width * scaleFactor; // scale factor < 1 to reduce size
        destHeight = image.height * scaleFactor; // scale factor < 1 to reduce size
        ctx.drawImage(image, 1293, 13, destWidth, destHeight);

        ctx.font = '26px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left'
        ctx.fillText(this.player.gold, 1320, 34);
    }

    /** Call this method to spawn a portal to the next area. */
    spawnPortal(worldX, worldY, mapIndex) {
        let newPortal = this.addEntity(new Portal(this, worldX, worldY, mapIndex));
        this.addEntity(new Arrow_Pointer(newPortal, this, "./sprites/arrow_pointer_blue.png")); // Attach an arrow pointer
    }

    /** Called in gameengine.draw() to draw the map textures. */
    drawMap() {
        // Check if the camera and player are initialized.
        // This is necessary as they are needed, but may not be initialized during the first few calls of this method.
        if (!this.camera || !this.player) {
            return; // Skip drawing the map if the camera or player is not initialized.
        }

        // If -1, load the main menu
        if (this.currMap === -1) {
            if(!this.isGamePaused){
                this.togglePause();
            }

            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.font = '120px Serif';
            this.ctx.fillStyle = 'black';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Guy with Scythe', this.ctx.canvas.width / 2, 100);

            this.ctx.font = '40px Arial';
            const playButtonWidth = 150;
            const playButtonHeight = 60;
            const playButtonX = (this.ctx.canvas.width - playButtonWidth) / 2;
            const playButtonY = (this.ctx.canvas.height * 2) / 3;
            const playText = this.ctx.measureText('Play');
            this.ctx.fillStyle = 'red';

            this.ctx.fillRect(playButtonX, playButtonY, playButtonWidth, playButtonHeight);
            this.ctx.fillStyle = 'white';
            this.ctx.fillText('Play', this.ctx.canvas.width / 2, playButtonY + playButtonHeight / 2 + playText.actualBoundingBoxAscent / 2);

            const howToPlayButtonWidth = 300;
            const howToPlayButtonHeight = 60;
            const howToPlayButtonX = (this.ctx.canvas.width - howToPlayButtonWidth) / 2;
            const howToPlayButtonY = playButtonY + playButtonHeight + 20;
            const howToPlayText = this.ctx.measureText('How to Play');

            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(howToPlayButtonX, howToPlayButtonY, howToPlayButtonWidth, howToPlayButtonHeight);
            this.ctx.fillStyle = 'white';
            this.ctx.fillText('How to Play', this.ctx.canvas.width / 2, howToPlayButtonY + howToPlayButtonHeight / 2 + howToPlayText.actualBoundingBoxAscent / 2);
            this.drawMouseTracker(this.ctx);

            this.ctx.canvas.addEventListener('click', (event) => {
                const mouseX = event.clientX - this.ctx.canvas.getBoundingClientRect().left;
                const mouseY = event.clientY - this.ctx.canvas.getBoundingClientRect().top;

                if (this.currMap === -1) {
                    if (mouseX >= playButtonX && mouseX <= playButtonX + playButtonWidth &&
                        mouseY >= playButtonY && mouseY <= playButtonY + playButtonHeight) {
                        this.loadGame();
                    }

                    if (mouseX >= howToPlayButtonX && mouseX <= howToPlayButtonX + howToPlayButtonWidth &&
                        mouseY >= howToPlayButtonY && mouseY <= howToPlayButtonY + howToPlayButtonHeight) {
                        this.showInstructions();
                    }
                }
            });
        }

        // If -2, load the how to play screen
        else if (this.currMap === -2) {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.font = '40px Arial';
            this.ctx.fillStyle = 'black';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('How to Play', 600, 50);

            this.ctx.textAlign = 'left';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Controls:', 100, 100);

            this.ctx.fillText('WASD:    movement', 150, 130);
            this.ctx.fillText('Q, Mousewheel, or 1/2/3:     Switch weapons (Scythe, Tome, Staff)', 150, 160);
            this.ctx.fillText('Space:   Dash (with iFrames)', 150, 190);


            const exitButtonWidth = 60;
            const exitButtonHeight = 60;
            const exitButtonX = this.ctx.canvas.width - exitButtonWidth - 20;
            const exitButtonY = 20;
            const exitText = this.ctx.measureText('X');

            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(exitButtonX, exitButtonY, exitButtonWidth, exitButtonHeight);
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('X', exitButtonX + exitButtonWidth / 2, exitButtonY + exitButtonHeight / 2 + exitText.actualBoundingBoxAscent / 2);
            this.drawMouseTracker(this.ctx);

            this.ctx.canvas.addEventListener('click', (event) => {
                const mouseX = event.clientX - this.ctx.canvas.getBoundingClientRect().left;
                const mouseY = event.clientY - this.ctx.canvas.getBoundingClientRect().top;

                if (mouseX >= exitButtonX && mouseX <= exitButtonX + exitButtonWidth &&
                    mouseY >= exitButtonY && mouseY <= exitButtonY + exitButtonHeight) {
                    this.currMap = -1;
                }
            });
        }

        // If 0, then Rest Area Map is used.
        else if (this.currMap === 0) {
            // Initialize the map objects if we haven't already
            if (!this.mapObjectsInitialized) {
                this.initRestAreaObjects();
            }

            // Spawn the rest area exit portal at this precise location if we don't have a portal here already.
            if (!this.portal) {
                this.spawnPortal(this.player.worldX + 350, this.player.worldY, 2)
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
            // Initialize the map objects if we haven't already
            if (!this.mapObjectsInitialized) {
                this.initGrasslandsObjects();
            }

            const map = ASSET_MANAGER.getAsset("./sprites/map_grasslands.png");

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
                left: -((this.mapWidth) * this.mapOneScaleFactor)/2 + this.mapBoundaryOffset + 15,
                top: -((this.mapHeight) * this.mapOneScaleFactor)/2 + this.mapBoundaryOffset - 15,
                right: ((this.mapWidth) * this.mapOneScaleFactor)/2 - this.mapBoundaryOffset - 15,
                bottom: ((this.mapHeight) * this.mapOneScaleFactor)/2 - this.mapBoundaryOffset - 30
            };
        }
        // If 2, then Cave Map is used.
        else if (this.currMap === 2){
            //Initialize the map objects if we haven't already
            if (!this.mapObjectsInitialized) {
                this.initCaveObjects();
            }
            const map = ASSET_MANAGER.getAsset("./sprites/map_cave.png");

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
     * @param enableParallax    If true, then apply parallax effect to the background based on player coordinates.
     */
    drawBackground(spritePath, scaleFactor, enableParallax) {
        const texture = ASSET_MANAGER.getAsset(spritePath);
        const textureWidth = Math.round(texture.width * scaleFactor);
        const textureHeight = Math.round(texture.height * scaleFactor);

        // Initialize offsets for parallax effect
        let offsetX = 0;
        let offsetY = 0;

        // Apply parallax effect if enabled
        if (enableParallax && this.player) {
            const parallaxFactorX = 0.15; // Adjusted lower for a more subtle effect
            const parallaxFactorY = 0.15; // Adjusted lower for a more subtle effect
            offsetX = Math.round(this.player.worldX * parallaxFactorX) % textureWidth;
            offsetY = Math.round(this.player.worldY * parallaxFactorY) % textureHeight;
        }

        // Determine the number of times to repeat the texture, ensuring full coverage
        const timesToRepeatHorizontally = Math.ceil(this.ctx.canvas.width / textureWidth) + 1;
        const timesToRepeatVertically = Math.ceil(this.ctx.canvas.height / textureHeight) + 1;

        // Draw the repeated texture tiles, adjusting for parallax offset
        for (let x = -1; x <= timesToRepeatHorizontally; x++) {
            for (let y = -1; y <= timesToRepeatVertically; y++) {
                let drawX = x * textureWidth - offsetX;
                let drawY = y * textureHeight - offsetY;

                // Round positions to nearest pixel to avoid sub-pixel rendering issues
                drawX = Math.round(drawX);
                drawY = Math.round(drawY);

                this.ctx.drawImage(texture, drawX, drawY, textureWidth, textureHeight);
            }
        }
    }

    /** This method is called every tick to update all entities etc. */
    update() {
        // Handle boss spawn timer
        if ((this.elapsedTime / 60000) >= (this.SPAWN_SYSTEM.bossSpawnTimer / 60) && !this.roundOver && !this.boss && this.currMap === 1) {
            this.spawnBossOne();
        } else if ((this.elapsedTime / 60000) >= (this.SPAWN_SYSTEM.bossSpawnTimer / 60) && !this.roundOver && !this.boss && this.currMap === 2) {
            this.spawnBossTwo();
        }

        // Update entities only while the game is un-paused.
        if (!this.isGamePaused) {
            // Update 'other' entities.
            for (let i = 0; i < this.entities.length; i++) {
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

            // Update 'ally' entities.
            for (let i = 0; i < this.allies.length; i++) {
                if (!this.allies[i].removeFromWorld) {
                    this.allies[i].update();
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

            // Update 'item' entities.
            for (let i = 0; i < this.items.length; i++) {
                if (!this.items[i].removeFromWorld) {
                    this.items[i].update();
                }
            }

            // Update 'player' entity.
            if (this.player && !this.player.removeFromWorld) {
                this.player.update();

                // Check if player has collided with portal
                if (this.portal) {
                    // Call a method in the portal to handle player interaction (if needed)
                    this.portal.handlePlayerInteraction(this.player);
                }
            }

            // Update 'arrow pointer' entities. (If commented, then the update() does not exist atm in arrow class)
            // for (let i = 0; i < this.arrowPointers.length; i++) {
            //     if (!this.arrowPointers[i].removeFromWorld) {
            //         this.arrowPointers[i].update();
            //     }
            // }

            // Update damage numbers
            for (let i = 0; i < this.damageNumbers.length; i++) {
                if (!this.damageNumbers[i].removeFromWorld) {
                    this.damageNumbers[i].update();
                }
            }


            // Remove 'other' entities that are marked for deletion.
            for (let i = this.entities.length - 1; i >= 0; --i) {
                if (this.entities[i].removeFromWorld) {
                    this.entities.splice(i, 1);
                }
            }

            // Remove 'object' entities that are marked for deletion.
            for (let i = this.objects.length - 1; i >= 0; --i) {
                // Treasure chest check
                if (this.objects[i] && this.objects[i].boundingBox && this.objects[i].boundingBox.type === "chest" && this.objects[i].openedAtTime !== null && (this.elapsedTime / 1000) - this.objects[i].openedAtTime >= this.objects[i].deleteAfterOpenTime) {
                    this.objects[i].removeFromWorld = true;
                }

                if (this.objects[i].removeFromWorld) {
                    // internally checks if exploding and then does so if true.
                    this.objects[i].explode();
                    this.objects.splice(i, 1);
                }
            }

            // Remove 'enemy' entities that are marked for deletion.
            for (let i = this.enemies.length - 1; i >= 0; --i) {
                if (this.enemies[i].removeFromWorld) {
                    // Only do the following if the enemy was actually 'killed' ex: currHP === 0
                    if (this.enemies[i].currHP === 0) {
                        // Spawn XP Orb on killed enemies
                        this.addEntity(new Exp_Orb(this, this.enemies[i].worldX, this.enemies[i].worldY, this.enemies[i].exp));

                        let wasKilledByExplosion = false;

                        this.attacks.forEach(attack => {
                            if (attack.type === "explosionAttack" && attack.collisionDetection(this.enemies[i].boundingBox)) {
                                wasKilledByExplosion = true;
                            }
                        });

                        // Spawn Tombstones on killed enemies (only % of the time)
                        if (Math.random() < 0.5 && (!wasKilledByExplosion || this.player.weapons[2].upgrades[4].active)) {
                            // Spawn Tombstone
                            let tombstone = new Map_object(this, this.enemies[i].worldX, this.enemies[i].worldY, 35, 35, "./sprites/object_tombstone.png", 0, 0, 28, 46, 1, 1, 1);
                            this.addEntity(tombstone);
                            tombstone.boundingBox.type = "tombstone";

                            this.setManagedTimeout(() => {
                                tombstone.removeFromWorld = true;
                            }, 70000);
                        }

                        // If elite or boss, drop a weapon upgrade chest
                        if (this.enemies[i].isElite || this.enemies[i].boundingBox.type === "enemyBoss") {
                            this.spawnUpgradeChest(this.enemies[i].worldX, this.enemies[i].worldY);
                        }

                        // % Chance to drop gold (gold amount based off of health)
                        if (Math.random() < 0.1) {
                            let coinBag = new Map_object(this, this.enemies[i].worldX, this.enemies[i].worldY, 17, 17, "./sprites/object_coin_bag.png", 0, 0, 34, 34, 1, 1, 1);
                            this.addEntity(coinBag);
                            coinBag.boundingBox.type = "gold" + Math.ceil(this.enemies[i].maxHP / 10);
                        }
                    }

                    if (this.boss && this.enemies[i] === this.boss) {
                        // Stop tracking this boss since we are deleting it
                        this.boss = null;
                    }

                    // Delete this enemy
                    this.enemies.splice(i, 1);
                }
            }

            // Remove 'ally' entities that are marked for deletion.
            for (let i = this.allies.length - 1; i >= 0; --i) {
                if (this.allies[i].removeFromWorld) {
                    // Delete this enemy
                    this.allies.splice(i, 1);
                }
            }

            // Remove 'attack' entities that are marked for deletion.
            for (let i = this.attacks.length - 1; i >= 0; --i) {
                if (this.attacks[i].removeFromWorld) {
                    this.attacks.splice(i, 1);
                }
            }

            // Remove 'portal' entity if marked for deletion.
            if (this.portal && this.portal.removeFromWorld) {
                this.portal = null;
            }

            // Remove 'item' entities that are marked for deletion.
            for (let i = this.items.length - 1; i >= 0; --i) {
                if (this.items[i].removeFromWorld) {
                    this.items.splice(i, 1);
                }
            }

            // Remove 'player' entity if marked for deletion.
            if (this.player && this.player.removeFromWorld) {
                //this.player = null;   // If this is commented out, we don't delete the player entity on death.
            }

            // Remove 'arrow pointer' entities that are marked for deletion.
            for (let i = this.arrowPointers.length - 1; i >= 0; --i) {
                if (this.arrowPointers[i].removeFromWorld) {
                    this.arrowPointers.splice(i, 1);
                }
            }

            // Remove damage numbers marked for deletion.
            for (let i = this.damageNumbers.length - 1; i >= 0; --i) {
                if (this.damageNumbers[i].removeFromWorld) {
                    this.damageNumbers.splice(i, 1);
                }
            }
        }

        // Update the elapsed time. (only while un-paused)
        if (!this.isGamePaused) {
            this.elapsedTime = Math.max(((Date.now() - this.startTime) - this.totalPausedTime), 0); // Never set the elapsed time below 0
        }

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

        // Check for collisions between allies
        for (let i = 0; i < this.allies.length; i++) {
            for (let j = i + 1; j < this.allies.length; j++) {
                let ally1 = this.allies[i];
                let ally2 = this.allies[j];

                if (ally1.boundingBox.isColliding(ally2.boundingBox)) {
                    this.respondToCollision(ally1, ally2);
                }
            }
        }

        // Check for collisions between allies
        for (let i = 0; i < this.allies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                let ally = this.allies[i];
                let enemy = this.enemies[j];

                if (ally.boundingBox.isColliding(enemy.boundingBox)) {
                    this.respondToCollision(ally, enemy);
                }
            }
        }

        // Loop through 'enemy' entities and set removeFromWorld flags.
        for (let i = 0; i < this.enemies.length; i++) {
            // If dead non-boss enemy, mark for deletion.
            if (this.enemies[i].isDead && this.enemies[i] !== this.boss) {
                this.enemies[i].removeFromWorld = true;
            }
        }

        // Loop through 'ally' entities and set removeFromWorld flags.
        for (let i = 0; i < this.allies.length; i++) {
            // If dead non-boss enemy, mark for deletion.
            if (this.allies[i].isDead) {
                this.allies[i].removeFromWorld = true;
            }
        }

        // Loop through 'attack' entities and set removeFromWorld flags.
        for (let i = 0; i < this.attacks.length; i++) {
            // Removes any attack circles if their duration is depleted.
            // Or delete them if their attacker is being deleted too.
            if(this.attacks[i].duration <= 0 || (this.attacks[i].entity && this.attacks[i].entity.removeFromWorld)) {
                this.attacks[i].removeFromWorld = true;
            }

        }

        // Check if player is dead, if so: mark player for deletion.
        if (this.player && this.player.isDead) {
            this.player.removeFromWorld = true;
        }

        // Update Spawn_System (Spawn enemies)
        this.SPAWN_SYSTEM.update();
    }

    respondToCollision(enemy1, enemy2) {
        // We should not respond to collisions while game is paused
        if (this.isGamePaused) {
            return;
        }

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
            if (enemy1 instanceof Enemy_Charger && enemy1.attackStatus === "Charging" && enemy1.attackStatus === "Preparing to Charge") return;
            enemy1.worldX += normalizedDirectionX * bounceDistance;
            enemy1.worldY += normalizedDirectionY * bounceDistance;
        }
        if (enemy2.boundingBox.type !== "enemyBoss" && enemy2.boundingBox.type !== "player") {
            if (enemy2 instanceof Enemy_Charger && enemy2.attackStatus === "Charging" && enemy2.attackStatus === "Preparing to Charge") return;
            enemy2.worldX -= normalizedDirectionX * bounceDistance;
            enemy2.worldY -= normalizedDirectionY * bounceDistance;

        }

        // Immediately update bounding boxes after changing positions
        enemy1.updateBoundingBox();
        enemy2.updateBoundingBox();
    }

    /** Starts the game engine loop system. This makes the update and draw methods loop. */
    loop() {
        // Always check for pause toggle input
        this.checkPauseInput();


        // Calculate the time passed since the last frame
        this.clockTick = this.timer.tick();

        // If the game is not paused, update game logic
        if (!this.isGamePaused) {
            this.update();
        }

        // Draw the game state regardless of pause state
        // This allows drawing a pause menu or other pause-related graphics
        this.draw();
    }

    /** Contains code that still needs to be run every tick while game is paused. */
    checkPauseInput() {
        // Be sure to allow update system to capture the needed input while the game is paused
        this.UPGRADE_SYSTEM.update();
    }

    /** Draws the mouse tracks on the screen. */
    drawMouseTracker(ctx) {
        if (this.mouse) {
            const crossSize = 10; // Size of the cross
            if(this.currMap < 0) {
                ctx.strokeStyle = 'black'; // black cursor for main menu
            }
            else {
                ctx.strokeStyle = 'white'; // Color of the cross
            }

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

    // New method to set a managed timeout
    setManagedTimeout(callback, delay, ...args) {
        const timeoutInfo = {
            callback: callback,
            delay: delay,
            startTime: Date.now(),
            args: args,
        };

        timeoutInfo.id = setTimeout(() => {
            // Execute the callback
            callback(...args);
            // Remove from active timeouts
            this.activeTimeouts = this.activeTimeouts.filter(t => t.id !== timeoutInfo.id);
        }, delay);

        // Add to active timeouts
        this.activeTimeouts.push(timeoutInfo);
        return timeoutInfo.id;
    }

    /** Method to clear a managed timeout */
    clearManagedTimeout(timeoutId) {
        // Clear the timeout
        clearTimeout(timeoutId);
        // Remove from active timeouts
        this.activeTimeouts = this.activeTimeouts.filter(t => t.id !== timeoutId);
    }

    /** Method to pause all active timeouts */
    pauseTimeouts() {
        const currentTime = Date.now();
        this.activeTimeouts.forEach(t => {
            clearTimeout(t.id);
            // Calculate remaining delay
            t.remainingDelay = t.delay - (currentTime - t.startTime);
        });
    }

    /** Method to resume all active timeouts */
    resumeTimeouts() {
        this.activeTimeouts.forEach(t => {
            // Re-set the timeout with the remaining delay
            t.id = this.setManagedTimeout(t.callback, t.remainingDelay, ...t.args);
            t.startTime = Date.now(); // Reset start time
            t.delay = t.remainingDelay; // Update delay to remaining delay
        });
    }

    // Loads the first map after clicking on play button
    loadGame() {
        this.currMap = 1;
        if(this.isGamePaused) {
            this.togglePause();
        }
    }

    // Loads the instructions after clicking on the how to play button
    showInstructions() {
        this.currMap = -2;
    }

    /**
     * Spawns a sequenced pattern of choreographed attack circles that swirl around a center point.
     * @param entity - The entity spawning this attack
     * @param {number} x - The center x-coordinate where the pattern starts.
     * @param {number} y - The center y-coordinate where the pattern starts.
     * @param {number} numCircles - Total number of circles to spawn in the pattern.
     * @param {number} delayBetweenCircles - Delay in milliseconds between each circle spawn.
     * @param {number} circleRadius - Radius of each attack circle.
     * @param {number} attackDuration - Duration each attack circle stays active in seconds.
     * @param {number} curlTightness - Controls the spacing between circles in the pattern. Higher values make the swirl tighter.
     * @param {number} spiralSpacing - Distance between each circle in the spiral.
     */
    spawnSwirlingAttackCirclePattern(entity, x, y, numCircles = 15, delayBetweenCircles = 250, circleRadius = 100, attackDuration = 1, curlTightness = 1, spiralSpacing = 20) {
        for (let i = 0; i < numCircles; i++) {
            // Calculate the delay for the current circle
            const delay = i * delayBetweenCircles;

            // Use a timeout to delay the creation of each circle
            this.setManagedTimeout(() => {
                // Calculate position for the current circle
                // The angle is modified by curlTightness to control how tight the swirl is
                const angle = (Math.PI * 2 / numCircles * curlTightness) * i; // Distribute circles evenly in a circular pattern, modified by curlTightness
                // Adjust dx and dy calculations to account for both curlTightness and spiralSpacing
                // curlTightness affects the angle between circles, while spiralSpacing affects their radial distance from the center
                const dx = Math.cos(angle) * (spiralSpacing * Math.sqrt(i)); // Use square root of i to ensure even distribution of circles in a spiral
                const dy = Math.sin(angle) * (spiralSpacing * Math.sqrt(i)); // Use square root of i to ensure even distribution of circles in a spiral

                // Create the attack circle at the calculated position
                const attackCircle = new AttackCirc(this, entity, circleRadius, "enemyAttack", x + dx, y + dy, attackDuration, null, 0, entity.atkPow / 3, 0, 0, 1);
                attackCircle.drawCircle = true;
                attackCircle.trackToEntity = false;
                this.addEntity(attackCircle);
            }, delay);
        }
    }
}