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

        /** Keeps track of difficulty selected */
        this.difficultySelected = 'medium';

        /** Save the previous map index after map switching. */
        this.prevMap = -10;

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

        // Music
        this.restAreaMusic = "./sounds/music_firelink.mp3";
        this.mapOneMusic = "./sounds/music_nameless_song.mp3";
        this.mapOneBossMusic = "./sounds/music_erdtree_knights.mp3";
        this.mapTwoMusic = "./sounds/music_dragonlord.mp3";
        this.mapTwoBossMusic = "./sounds/music_capra.mp3";
        this.mapThreeMusic = "./sounds/music_majula.mp3";
        this.mapThreeBossMusic = "./sounds/music_malenia.mp3";
        this.youWonScreenMusic = "./sounds/music_ave_maria.mp3";

        this.youWonScreen = "./sprites/you_won_screen1.png";

        this.drawEndGameScreenFlag = false;

        this.levelTimes = [0, 0, 0];
        this.levelScores = [0, 0, 0];
        this.playerReflection = null;

        this.meteor = null;

        this.isPauseMenu = false;
    }

    createPlayerReflection() {
        let ref = this.addEntity(new Entity(1, 1, 0, this,
            this.player.worldX, this.player.worldY, 25, 25, "player_reflection", 0,
            "./sprites/reflective_pane.png", 0, 0, 96, 48, 1, 1, 2, 0));
        ref.followEntity(this.player, -30, 20);

        // Don't make player reflection when player is small mode
        if (this.player.upgrades[13].active) {
            return;
        }

        ref = this.addEntity(new Entity(1, 1, 0, this,
            this.player.worldX, this.player.worldY, 25, 25, "player_reflection", 0,
            "./sprites/McIdle_reflection.png", 0, 0, 32, 28, 2, 0.5, 2, 0));
        ref.followEntity(this.player, 0, 75);

        this.playerReflection = ref;
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
            //console.log("PAUSE START TIME: " + this.pauseStartTime);
            this.pauseTimeouts(); // Pause timeouts
        } else {
            this.totalPausedTime += Date.now() - this.pauseStartTime;
            //console.log("PAUSE SECONDS = " + this.totalPausedTime);
            this.resumeTimeouts(); // Resume timeouts
        }
    }

    /** Call this method to spawn boss one (Knight - Orange Bro) */
    spawnBossOne() {
        ASSET_MANAGER.stopBackgroundMusic();
        ASSET_MANAGER.playBackgroundMusic(this.mapOneBossMusic);
        this.boss = this.addEntity(new BossOne(this, 250, 0));
    }
    /** Call this method to spawn boss two (Dragon - ???). */
    spawnBossTwo() {
        ASSET_MANAGER.stopBackgroundMusic();
        ASSET_MANAGER.playBackgroundMusic(this.mapTwoBossMusic);
        this.boss = this.addEntity(new BossTwo(this, 250, 0));
    }
    /** Call this method to spawn boss three (God - Wrath of God) */
    spawnBossThree() {
        ASSET_MANAGER.stopBackgroundMusic();
        ASSET_MANAGER.playBackgroundMusic(this.mapThreeBossMusic);
        this.boss = this.addEntity(new BossThree(this, 250, 0));
    }

    /**
     * Call this to spawn an upgrade chest at the given coordinates.
     * Returns the chest entity.
     * @param   worldX  The x coordinate on the world to spawn the chest.
     * @param   worldY  The y coordinate on the world to spawn the chest.
     * @param goldAmount The gold given by this box
     */
    spawnUpgradeChest(worldX, worldY, goldAmount = 50) {
        let newEntity = this.addEntity(new Map_object(this, worldX, worldY, 35, 35, "./sprites/object_treasure_chest.png", 0, 0, 54, 47, 25, 0.03, 1.25));
        newEntity.boundingBox.type = "upgrade_chest" + goldAmount;
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
        // this.spawnPortal(0, 100);
        // this.spawnEndPortal(0, -100);

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
        this.spawnUpgradeChest(-3026, -3027);
        this.spawnUpgradeChest(2778, 2844);

        // Debug Portal
        //this.spawnPortal(0, 100);

        // Rock objects
        let newEntity = this.addEntity(new Map_object(this, -450, 0, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, 450, 0, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, 0, 450, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, 0, -450, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -1900, -650, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2.5));
        newEntity = this.addEntity(new Map_object(this, -3260, 1525, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -3095, 1485, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -2625, 1525, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -2730, 1590, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -1555, 2590, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -3115, 2555, 65, 56-20, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 3.5));
        newEntity = this.addEntity(new Map_object(this, -920, 1215, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, 20, -1555, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, 620, -2065, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, 1810, -1555, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, 2910, -360, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, 1535, 2555, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -2730, -2360, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -2850, -2335, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -2925, -2375, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, -3290, -2590, 55, 56-30, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 2));
        newEntity = this.addEntity(new Map_object(this, 2426, 2835, 65, 56-20, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 3.5));
        newEntity = this.addEntity(new Map_object(this, 2380, 2735, 65, 56-20, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 3.5));
        newEntity = this.addEntity(new Map_object(this, 2515, 2930, 65, 56-20, "./sprites/map_rock_object_black.png", 0, 0, 86, 56, 1, 1, 3.5));

        // Invisible Objects
        newEntity = this.addEntity(new Map_object(this, -2035, 1180, 940, 2840, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);    // Essentially makes the sprite invisible by pausing on a frame that doesn't exist.
        newEntity = this.addEntity(new Map_object(this, -200, 2560, 850, 2700, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);
        newEntity = this.addEntity(new Map_object(this, -1010, -905, 700, 480, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);
        newEntity = this.addEntity(new Map_object(this, -1010, -905, 700, 480, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);
        newEntity = this.addEntity(new Map_object(this, -2770, -1270, 1110, 810, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);
        newEntity = this.addEntity(new Map_object(this, -1025, -2830, 3300, 1000, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);
        newEntity = this.addEntity(new Map_object(this, 2758, -2740, 1820, 1820, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);
        newEntity = this.addEntity(new Map_object(this, 2265, -890, 1050, 550, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);
        newEntity = this.addEntity(new Map_object(this, 2500, 1200, 1750, 2220, "./sprites/debug_warning.png", 0, 0, 0, 0, 1, 1, 1));
        newEntity.animator.pauseAtFrame(10);

        this.mapObjectsInitialized = true;
    }

    spawnHealingHeart(worldX, worldY) {
        let healingHeart = this.addEntity(new Map_object(this, worldX, worldY, 35, 35, "./sprites/heart.png", 0, 0, 43, 41, 4, 0.15, 1));
        healingHeart.boundingBox.type = "item_healingHeart";

        return healingHeart;
    }

    spawnMeteor(size, speed, rotationSpeed) {
        // Don't spawn these while round over
        if (this.roundOver) return;

        let rotationDir = Math.random() < 0.5 ? -1 : 1;
        let newCoords = this.randomOffscreenCoords();
        let newEntity = this.addEntity(new Map_object(this, newCoords.x, newCoords.y, 10, 10, "./sprites/meteor.png", 0, 0, 159, 154, 1, 1, Math.max(1, size)));
        newEntity.boundingCircle = new BoundingCircle(newEntity.calculateCenter().x, newEntity.calculateCenter().y, 50 * newEntity.animator.scale, "object");
        newEntity.targetX = -500 * Math.random();
        newEntity.targetY = 500 * Math.random();
        newEntity.animator.isRotating = true;
        newEntity.animator.rotationSpeed = rotationSpeed * rotationDir;
        newEntity.isFloatingObject = true;
        newEntity.movementSpeed = speed;
        newEntity.maxRelocations = 2;
        return newEntity;
    }

    initSpaceMapObjects() {
        this.createPlayerReflection();

        this.spawnUpgradeChest(-2546, -2343);
        this.spawnUpgradeChest(500, 3000);

        // Debug Portal
        //this.spawnPortal(0, 100);

        // Meteors
        this.meteor = this.spawnMeteor(3.22 * Math.random(), 25 * Math.random(), 50);

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

        this.ctx.canvas.addEventListener("keydown", event => {
            this.keys[event.key.toLowerCase()] = true;
        });


        this.ctx.canvas.addEventListener("keyup", event =>{
                this.keys[event.key.toLowerCase()] = false;
        });
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
        } else if (entity.boundingBox.type.toLowerCase().includes("item")) {
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
        } else if (entity.boundingBox.type.toLowerCase().includes("attack")) {
            // if (entity instanceof AttackCirc) {
            //     console.log(entity.entity.debugName + " has spawned an attack circle.");
            // }
            // console.log("addEntity("+entity.debugName+"), Type="+entity.type);
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

    /** Call this method on every frame to draw each entity or UI elements on the canvas. */
    draw() {
        // Clear the canvas.
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw the map texture.
        this.drawMap();

        // Only draw the following when not in the main menu
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

            // Sort objects based on their worldY position with a threshold
            this.objects.sort((a, b) => {
                // Calculate the difference in worldY positions
                const diff = a.worldY - b.worldY;

                // Only consider them different if the difference exceeds the threshold
                if (Math.abs(diff) < sortingThreshold) {
                    return 0; // Consider them as equal for sorting purposes
                }
                return diff;
            });

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

            // Draw 'object' entities.
            for (let object of this.objects) {
                if (object.boundingBox.type === "meteor") continue;
                object.draw(this.ctx, this);

                // If debug mode, then draw debug features.
                if (this.debugMode) {
                    object.drawHealth(this.ctx);
                    object.boundingBox.draw(this.ctx, this);
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

            // Draw treasure chests OVER the exp orbs and prior entities
            for (let object of this.objects) {
                if (object instanceof Map_object && object.boundingBox.type.includes("chest")) {
                    object.draw(this.ctx, this);

                    // If debug mode, then draw debug features.
                    if (this.debugMode) {
                        object.drawHealth(this.ctx);
                        object.boundingBox.draw(this.ctx, this);
                    }
                }
            }

            // Draw healing hearts OVER the prior
            for (let object of this.objects) {
                if (object instanceof Map_object && object.boundingBox.type.includes("healingHeart")) {
                    object.draw(this.ctx, this);

                    // If debug mode, then draw debug features.
                    if (this.debugMode) {
                        object.drawHealth(this.ctx);
                        object.boundingBox.draw(this.ctx, this);
                    }
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

            // Draw the timer if we are not in rest area.
            if (this.currMap > 0 && !this.roundOver) {
                this.drawTimer(this.ctx);
            }

            // If the player is dead, display 'You Died!' text.
            if (this.player && this.player.isDead) {
                this.ctx.beginPath();
                this.drawLoseScreen();

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
            if (this.youWon && this.currMap === -100) {
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

            // If the defeated all enemies on map specific map, display 'You Won!' text.
            if (this.enemies.length <= 0 && this.currMap === -100) {
                this.ctx.beginPath();

                // Draw "You Won!" text in large yellow font at the center of the canvas
                this.ctx.font = '75px Arial';
                this.ctx.fillStyle = 'yellow';
                this.ctx.textAlign = 'center'
                this.ctx.fillText('You Won!', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
                this.ctx.closePath();

                if (!this.isGamePaused) {
                    this.togglePause();
                }
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

            if (this.drawEndGameScreenFlag) {
                this.drawEndGameScreen();
            }

            // Draw the mouse tracker.
            this.drawMouseTracker(this.ctx);

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
        if (this.isPauseMenu) {
            this.drawPauseMenu();
        }
    }

    /** Draws the game-time tracker on top of the game screen. */
    drawTimer(ctx) {
        // Catch invalid elapsed time
        if (this.elapsedTime < 0) {
            this.elapsedTime = 0;
            this.totalPausedTime = 0;
            this.startTime = Date.now();
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
    spawnPortal(worldX, worldY) {
        let newPortal;
        if (this.prevMap === -10) this.prevMap = this.currMap;
        else if (this.prevMap > 2) this.prevMap = 0;
        else if (this.currMap !== 0) this.prevMap += 1;

        if (this.currMap === 0) {
            newPortal = this.addEntity(new Portal(this, worldX, worldY, this.prevMap + 1));
        } else if (this.currMap > 0){
            newPortal = this.addEntity(new Portal(this, worldX, worldY, 0));
        } else { // update this to add a portal that sends to credits
            newPortal = this.addEntity(new Portal(this, worldX, worldY, 1));
        }
        this.addEntity(new Arrow_Pointer(newPortal, this, "./sprites/arrow_pointer_blue.png")); // Attach an arrow pointer
    }

    /** Call this method to spawn  the end game divine portal. */
    spawnEndPortal(worldX, worldY) {
        let newPortal = this.addEntity(new Portal(this, worldX, worldY, 4, "./sprites/portal_white.png"), 49);

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
            this.difficultyButtonHelper();
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

            this.ctx.fillText('Mechanics:', 100, 220);
            this.ctx.fillText('-Follow yellow arrows to find upgrade chests and blue arrows to find portals to the next maps.', 150, 250);
            this.ctx.fillText('-You can attack while dashing.', 150, 280);
            this.ctx.fillText('-Enemies drop XP orbs to level your player up, you get to choose from a selection of random upgrades for your player upon leveling.', 150, 310);
            this.ctx.fillText('-Enemies drop XP orbs to level your player up, you get to choose from a selection of random upgrades for your player upon leveling.', 150, 340);
            this.ctx.fillText('-Enemies drop coins (This will let you purchase upgrades of your choice at the rest area between rounds).', 150, 370);
            this.ctx.fillText('-Every 60 seconds an elite enemy spawns.', 150, 400);
            this.ctx.fillText('-Elite enemies drop weapon upgrade chests, collect these to get special weapon upgrades.', 200, 430);
            this.ctx.fillText('-At 5 min, the final boss of the map spawns, defeat him to get a portal to the rest area where buy can more upgrades using your coins, then portal to the next map.', 150, 460);
            this.ctx.fillText('-At the end of the round, any gold bags left on the map are combined into a golden chest near the portal to the next map (with a 50% tax - so try to collect gold you see on the fly for min-maxing income!)', 150, 490);

            this.ctx.fillText('Weapons:', 100, 520);
            this.ctx.fillText('Scythe:', 150, 550);
            this.ctx.fillText('-Left Click: Cone attack.', 200, 580);
            this.ctx.fillText('-Right Click: Large Spin attack.', 200, 610);
            this.ctx.fillText('Tome:', 150, 640);
            this.ctx.fillText('-Left Click: Shoot small orb (Pierces one target, but that can be upgraded).', 200, 670);
            this.ctx.fillText('-Right Click: Shoot big slow orb (Ticks damage over time).', 200, 700);
            this.ctx.fillText('Staff:', 150, 730);
            this.ctx.fillText('-Left Click: Weak explosion, but summon allies to help you if it hits tombstones with the explosion.', 200, 760);
            this.ctx.fillText('-Right Click: Explode tombstones (Has potential to cause a chain reaction of tombstone explosions for huge damage).', 200, 790);


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

            this.drawBackground('./sprites/map_space_background.png', 1, true);

            // Spawn the rest area exit portal at this precise location if we don't have a portal here already.
            if (!this.portal && this.elapsedTime/1000 >= 6.6) {
                this.spawnPortal(350, 0);
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

            this.drawBackground('./sprites/map_space_background.png', 1, true);

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

            this.drawBackground('./sprites/map_cave_background2.png', 5, true, 0.1);

            const map = ASSET_MANAGER.getAsset("./sprites/map_cave.png");

            this.mapWidth = map.width;
            this.mapHeight = map.height;

            // Calculate the scaled width and height of the textures.
            const scaledWidth = this.mapWidth * this.mapTwoScaleFactor;
            const scaledHeight = this.mapHeight * this.mapTwoScaleFactor;

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
                left: -((this.mapWidth) * this.mapTwoScaleFactor)/2 + this.mapBoundaryOffset,
                top: -((this.mapHeight) * this.mapTwoScaleFactor)/2 + this.mapBoundaryOffset,
                right: ((this.mapWidth) * this.mapTwoScaleFactor)/2 - this.mapBoundaryOffset,
                bottom: ((this.mapHeight) * this.mapTwoScaleFactor)/2 - this.mapBoundaryOffset - 23
            };
        }
        // If 3, then Space Map is used.
        else if (this.currMap === 3){
            //Initialize the map objects if we haven't already
            if (!this.mapObjectsInitialized) {
                this.initSpaceMapObjects();
            }

            if(!this.meteor) this.meteor = this.spawnMeteor(3.22 * Math.random(), 25 * Math.random(), 50);

            this.drawBackground('./sprites/map_space_background.png', 1, true);

            // Simulate infinite boundaries by setting them to very large numbers.
            this.mapBoundaries = {
                left: -Infinity,
                top: -Infinity,
                right: Infinity,
                bottom: Infinity
            };

            // const map = ASSET_MANAGER.getAsset("./sprites/transparent.png");
            //
            // this.mapWidth = map.width;
            // this.mapHeight = map.height;
            //
            // // Calculate the scaled width and height of the textures.
            // const scaledWidth = this.mapWidth * this.mapThreeScaleFactor;
            // const scaledHeight = this.mapHeight * this.mapThreeScaleFactor;
            //
            // // If the map has not been centered yet, initialize its position.
            // if (!this.mapInitialized) {
            //     this.mapTextureOffsetX = this.player.worldX - scaledWidth / 2 + this.player.animator.width / 2;
            //     this.mapTextureOffsetY = this.player.worldY - scaledHeight / 2 + this.player.animator.height / 2;
            //     this.mapInitialized = true;
            // }
            //
            // // Adjust the texture's position to move inversely to the player's movement.
            // const textureX = this.mapTextureOffsetX - this.camera.x;
            // const textureY = this.mapTextureOffsetY - this.camera.y;
            //
            // // Draw the scaled texture centered on the player's position accounting for the camera.
            // this.ctx.drawImage(map, textureX, textureY, scaledWidth, scaledHeight);
            //
            // // Calculate the actual boundaries considering the scaling
            // this.mapBoundaries = {
            //     left: -((this.mapWidth) * this.mapThreeScaleFactor)/2 + this.mapBoundaryOffset,
            //     top: -((this.mapHeight) * this.mapThreeScaleFactor)/2 + this.mapBoundaryOffset,
            //     right: ((this.mapWidth) * this.mapThreeScaleFactor)/2 - this.mapBoundaryOffset,
            //     bottom: ((this.mapHeight) * this.mapThreeScaleFactor)/2 - this.mapBoundaryOffset
            // };
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
     * @param strength
     */
    drawBackground(spritePath, scaleFactor, enableParallax, strength = 0.23) {
        const texture = ASSET_MANAGER.getAsset(spritePath);
        const textureWidth = Math.round(texture.width * scaleFactor);
        const textureHeight = Math.round(texture.height * scaleFactor);

        // Initialize offsets for parallax effect
        let offsetX = 0;
        let offsetY = 0;

        // Apply parallax effect if enabled
        if (enableParallax && this.player) {
            const parallaxFactorX = strength; // Adjust lower for a more subtle effect
            const parallaxFactorY = strength; // Adjust lower for a more subtle effect
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
        let currentTimer = this.elapsedTime / 1000;

        // Handle boss spawn timers
        if ((currentTimer / 60) >= (this.SPAWN_SYSTEM.bossSpawnTimer / 60) && !this.roundOver && !this.boss) {
            switch (this.currMap) {
                case 1:
                    this.spawnBossOne();
                    break;
                case 2:
                    this.spawnBossTwo();
                    break;
                case 3:
                    this.spawnBossThree();
                    break;
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
            // if (this.objects[i] && this.objects[i].boundingBox && this.objects[i].boundingBox.type === "chest" && this.objects[i].openedAtTime !== null && currentTimer - this.objects[i].openedAtTime >= this.objects[i].deleteAfterOpenTime) {
            //     this.objects[i].removeFromWorld = true;
            // }

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
                    this.addEntity(new Exp_Orb(this, this.enemies[i].calculateCenter().x, this.enemies[i].calculateCenter().y, this.enemies[i].exp));

                    let wasKilledByExplosion = false;

                    this.attacks.forEach(attack => {
                        if (attack.type === "playerAttack_ExplosionAttack" && attack.collisionDetection(this.enemies[i].boundingBox)) {
                            wasKilledByExplosion = true;
                        }
                    });

                    // Spawn Tombstones on killed enemies (only % of the time)
                    if (Math.random() < this.player.tombstoneChance && (!wasKilledByExplosion || this.player.weapons[2].upgrades[11].active)) {
                        // Spawn Tombstone
                        let tombstone = new Map_object(this, this.enemies[i].calculateCenter().x, this.enemies[i].calculateCenter().y, 35, 35, "./sprites/object_tombstone.png", 0, 0, 28, 46, 1, 1, 1);
                        this.addEntity(tombstone);
                        tombstone.boundingBox.type = "tombstone";
                        this.setManagedTimeout(() => {
                            tombstone.removeFromWorld = true;
                        }, 70000);
                    }

                    // If elite or boss, drop a weapon upgrade chest
                    if (this.enemies[i].isElite || this.enemies[i].boundingBox.type === "enemyBoss") {
                        let percentToGoldDivider = 20;
                        this.spawnUpgradeChest(this.enemies[i].calculateCenter().x, this.enemies[i].calculateCenter().y, Math.ceil(this.enemies[i].maxHP / percentToGoldDivider));
                    }

                    // % Chance to drop gold (gold amount based off of health), bosses and elites don't drop gold bags
                    if (Math.random() < 0.05 && !this.enemies[i].isElite && this.enemies[i].boundingBox.type !== "enemyBoss") {
                        let percentToGoldDivider = 10;
                        let coinBag = new Map_object(this, this.enemies[i].calculateCenter().x, this.enemies[i].calculateCenter().y, 35, 35, "./sprites/object_coin_bag.png", 0, 0, 34, 34, 1, 1, 1);
                        this.addEntity(coinBag);
                        coinBag.boundingBox.type = "gold_bag" + Math.ceil(this.enemies[i].maxHP / percentToGoldDivider);
                    }
                    // If we did not spawn a gold bag, then try spawning a healing heart
                    else if (Math.random() < 0.03) {
                        this.spawnHealingHeart(this.enemies[i].calculateCenter().x, this.enemies[i].calculateCenter().y);
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
                // if (this.attacks[i] instanceof AttackCirc) {
                //     console.log("game.update() is DELETING an attack spawned from" + this.attacks[i].entity.debugName + ".");
                // }

                // Remove the reference to this attack circle if it was summoned via projectile
                if (this.attacks[i] instanceof AttackCirc && this.attacks[i].entity instanceof Projectile) {
                    this.attacks[i].entity.attackCirc = null;
                }

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

        // Remove 'player' entity if marked for deletion. If this is commented out, we don't delete the player entity on death.
        // if (this.player && this.player.removeFromWorld) {
        //     this.player = null;
        //     this.player.removeFromWorld = true;
        // }

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

        // Loop through 'attack' entities and set removeFromWorld flags.
        // for (let i = 0; i < this.attacks.length; i++) {
        //     // Removes any attack circles if their duration is depleted.
        //     // Or delete them if their attacker is being deleted too.
        //     if(this.attacks[i].duration <= 0 || (this.attacks[i].entity && this.attacks[i].entity.removeFromWorld)) {
        //         this.attacks[i].removeFromWorld = true;
        //     }
        // }

        // Update entities only while the game is un-paused.
        if (!this.isGamePaused) { // Start of un-paused code
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

            // Update damage numbers
            for (let i = 0; i < this.damageNumbers.length; i++) {
                if (!this.damageNumbers[i].removeFromWorld) {
                    this.damageNumbers[i].update();
                }
            }

            // Update the elapsed time. (only while un-paused)
            this.elapsedTime = (Date.now() - this.startTime) - this.totalPausedTime;//Math.max(((Date.now() - this.startTime) - this.totalPausedTime), 0); // Never set the elapsed time below 0
            //console.log("Elapsed time = " + "date("+Date.now()+") - start("+this.startTime+") - pauseTime("+this.totalPausedTime+") = " + this.elapsedTime);
            currentTimer = this.elapsedTime / 1000; // Update the currentTime variable for this method now that elapsed time may have changed

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

            // Check for collisions between allies and enemies
            for (let i = 0; i < this.allies.length; i++) {
                for (let j = i + 1; j < this.enemies.length; j++) {
                    let ally = this.allies[i];
                    let enemy = this.enemies[j];

                    if (ally.boundingBox.isColliding(enemy.boundingBox)) {
                        this.respondToCollision(ally, enemy);
                    }
                }
            }

            // Update Spawn_System (Spawn enemies)
            this.SPAWN_SYSTEM.update();
        } // End of un-paused code

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
    }

    // Call this to spawn the end chest of a round that collects a taxed amount of all gold left on the ground
    spawnEndChest(worldX = 0, worldY = 200) {
        let goldAmount = 0;

        this.objects.forEach(object => {
            if (object.boundingBox.type.includes("gold_bag")) {
                goldAmount += object.extractNumber(object.boundingBox.type) * 0.75; //0.5 means we tax off half the gold they would have naturally gotten
                object.removeFromWorld = true; // Delete the gold bag object
                //console.log("goldbag="+object.extractNumber(object.boundingBox.type)*0.75);
            }
        });

        // Don't spawn the chest if its gonna be empty
        if (goldAmount < 25) {
            goldAmount = 25;
        }

        let newEntity = this.addEntity(new Map_object(this, worldX, worldY, 35, 35, "./sprites/object_treasure_chest_gold.png", 0, 0, 54, 47, 25, 0.03, 1.25));

        // Calculate the scale based on goldAmount, with a max of 1000 gold
        const maxGold = 1000;
        const minScale = 1;
        const maxScale = 3;
        // Ensure goldAmount does not exceed maxGold for scaling calculation
        goldAmount = Math.min(goldAmount, maxGold);

        // Linearly size up the scale based on goldAmount
        const scale = minScale + (maxScale - minScale) * ((goldAmount * this.player.goldGain) / maxGold);

        // Set the calculated scale to the entity's animator
        newEntity.animator.scale = scale;

        newEntity.boundingBox.type = "gold_chest" + goldAmount;
        newEntity.animator.pauseAtFrame(0); // Pause the chest animation to the first frame
        newEntity.animator.outlineMode = true; // Turn on the outline
        this.addEntity(new Arrow_Pointer(newEntity, this)); // Attach an arrow pointer to the chest

        //console.log("CHEST TYPE="+newEntity.boundingBox.type);

        return newEntity;
    }

    // Call this to kill all alive enemies (drop XP too)
    killAllEnemies() {
        this.enemies.forEach(enemy => {
            // Don't delete bosses because it creates bugs where this loop wont finish since the boss is calling it
            if (enemy.boundingBox.type.toLowerCase().includes("boss")) return;

            enemy.currHP = 0;
            enemy.isDead = true;
        });
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
            if (enemy1 instanceof Enemy_Charger && (enemy1.attackStatus === "Charging" || enemy1.attackStatus === "Preparing to Charge")) return;
            enemy1.worldX += normalizedDirectionX * bounceDistance;
            enemy1.worldY += normalizedDirectionY * bounceDistance;
        }
        if (enemy2.boundingBox.type !== "enemyBoss" && enemy2.boundingBox.type !== "player") {
            if (enemy2 instanceof Enemy_Charger && (enemy2.attackStatus === "Charging" || enemy2.attackStatus === "Preparing to Charge")) return;
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

        this.update();

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
        // Create a new Error object to capture the stack trace
        // const stack = new Error().stack;
        //console.log("ManagedTimeout called from:", stack);

        const timeoutInfo = {
            callback: callback,
            delay: delay,
            startTime: Date.now(),
            args: args,
        };

        timeoutInfo.id = setTimeout(() => {
            // Log where the timeout was initially set from
            //console.log(`Executing timeout set from:`, stack);
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
            // Calculate the remaining delay again in case it's been a while since the game was paused
            const currentTime = Date.now();
            t.remainingDelay = t.delay - (currentTime - t.startTime);

            // Only re-set the timeout if the remaining delay is more than 0.1 seconds (100 milliseconds)
            if (t.remainingDelay > 10) {
                t.id = this.setManagedTimeout(t.callback, t.remainingDelay, ...t.args);
                t.startTime = Date.now(); // Reset start time to now
                t.delay = t.remainingDelay; // Update delay to the recalculated remaining delay
            } else {
                // For timeouts with less than 0.1 seconds left, we might choose to simply not resume them
                // Alternatively, you could decide to run the callback immediately instead
                // t.callback(...t.args);
            }
        });

        // Remove all timeouts from the list that were not resumed (i.e., had less than 0.1 seconds remaining)
        this.activeTimeouts = this.activeTimeouts.filter(t => t.remainingDelay > 100);
    }

    // Loads the first map after clicking on play button
    loadGame() {
        this.currMap = 1;

        ASSET_MANAGER.stopBackgroundMusic();
        ASSET_MANAGER.playBackgroundMusic(this.mapOneMusic);

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
                const attackCircle = new AttackCirc(this, entity, circleRadius, "CAR_enemyAttack", x + dx, y + dy, attackDuration, null, 0, entity.atkPow / 3, 0, 0, 1);
                attackCircle.drawCircle = true;
                attackCircle.trackToEntity = false;
                attackCircle.attackSound = "./sounds/boss_explosion.mp3";
                this.addEntity(attackCircle);
            }, delay);
        }
    }

    handleEndGameScreenClick(event) {
        if(!this.drawEndGameScreenFlag) return;

        // Convert click coordinates to canvas space
        const rect = this.ctx.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // Check if click was on 'New Game +' button
        if (clickX >= this.ctx.canvas.width / 2 - 150 && clickX <= this.ctx.canvas.width / 2 + 150 &&
            clickY >= this.ctx.canvas.height / 2 + 250 && clickY <= this.ctx.canvas.height / 2 + 250 + 50) {
            // Handle Continue action
            this.switchMap(1);
            this.drawEndGameScreenFlag = false;
            if (this.isGamePaused) this.togglePause();
            // Remove event listener to prevent memory leaks
            this.ctx.canvas.removeEventListener('click', this.handleEndGameScreenClick.bind(this));
        }

        // Check if click was on 'Start Over' button
        if (clickX >= this.ctx.canvas.width / 2 - 150 && clickX <= this.ctx.canvas.width / 2 + 150 &&
            clickY >= this.ctx.canvas.height / 2 + 250 + 60 && clickY <= this.ctx.canvas.height / 2 + 250 + 60 + 50) {
            // Handle Start Over action
            window.location.reload();
            this.drawEndGameScreenFlag = false;
            if (this.isGamePaused) this.togglePause();
            // Remove event listener to prevent memory leaks
            this.ctx.canvas.removeEventListener('click', this.handleEndGameScreenClick.bind(this));
        }
    }

    handleLoseGameScreenClick(event) {
        // if(!this.drawEndGameScreenFlag) return;

        // Convert click coordinates to canvas space
        const rect = this.ctx.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;


        // Check if click was on 'Start Over' button
        if (clickX >= this.ctx.canvas.width / 2 - 150 && clickX <= this.ctx.canvas.width / 2 + 150 &&
            clickY >= this.ctx.canvas.height / 2 + 250 + 60 && clickY <= this.ctx.canvas.height / 2 + 250 + 60 + 50) {
            // Handle Start Over action
            //TODO fix this so it restarts
            window.location.reload();
            this.drawEndGameScreenFlag = false;
            if (this.isGamePaused) this.togglePause();
            // Remove event listener to prevent memory leaks
            this.ctx.canvas.removeEventListener('click', this.handleLoseGameScreenClick.bind(this));
        }
    }

    handlePauseGameScreenClick(event) {

        // Convert click coordinates to canvas space
        const rect = this.ctx.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // Check if click was on 'Start Over' button
        if (clickX >= this.ctx.canvas.width / 2 - 150 && clickX <= this.ctx.canvas.width / 2 + 150 &&
            clickY >= this.ctx.canvas.height / 2 + 250 + 60 && clickY <= this.ctx.canvas.height / 2 + 250 + 60 + 50) {
            // Handle Start Over action
            window.location.reload();
            // this.drawEndGameScreenFlag = false;
            if (this.isGamePaused) this.togglePause();
            // Remove event listener to prevent memory leaks
            this.ctx.canvas.removeEventListener('click', this.handleEndGameScreenClick.bind(this));
        }
    }

    drawButton(x, y, width, height, text) {
        // Draw button background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x, y, width, height);

        // Draw button text
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x + width / 2, y + height / 2 + 10);
    }

    drawEndGameScreen(easterEgg) {
        if (!this.isGamePaused) this.togglePause();


        // Clear the canvas
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);


            if (this.youWonScreen === "./sprites/you_won_screen1.png" && easterEgg) {
                this.youWonScreen = "./sprites/you_won_screen2.png";
            }

            // Draw the background image
            const bgImage = ASSET_MANAGER.getAsset(this.youWonScreen);
            this.ctx.drawImage(bgImage, 0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

            // Draw score
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; // Shadow color (black with some transparency)
            this.ctx.shadowBlur = 0; // How much the shadow should be blurred
            this.ctx.shadowOffsetX = 2; // Horizontal shadow offset
            this.ctx.shadowOffsetY = 2; // Vertical shadow offset
            this.ctx.font = 'bold 36px Arial';
            // this.ctx.fillText("Score: " + this.player.score, this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 + 243);

            // Draw the stats screen
            this.UPGRADE_SYSTEM.drawPlayerStatsMenu(this.ctx);
            this.drawRunStatsUI(this.ctx);

            // Draw buttons
            // Continue Button
            this.drawButton(this.ctx.canvas.width / 2 - 150, this.ctx.canvas.height / 2 + 250, 300, 50, 'New Game +');

            // Start Over Button
            this.drawButton(this.ctx.canvas.width / 2 - 150, this.ctx.canvas.height / 2 + 250 + 60, 300, 50, 'Start Over');

            // Listen for mouse clicks on buttons
            this.ctx.canvas.addEventListener('click', this.handleEndGameScreenClick.bind(this));

        this.drawEndGameScreenFlag = true;
    }

    drawLoseScreen() {
        if (this.currMap > 0 && this.currMap < 4) {
            this.levelTimes[this.currMap-1] = this.elapsedTime;
            if (this.currMap === 1) {
                this.levelScores[0] = this.player.score;
            } else {
                this.levelScores[this.currMap - 1] = this.player.score - this.levelScores[this.currMap - 2];
            }
        }
        if (!this.isGamePaused) this.togglePause();

        // Clear the canvas
        //this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw the background red color
        this.ctx.fillStyle = `rgba(255, 0, 0, 0.5)`;
        this.ctx.beginPath();
        // this.ctx.rect(0, 0, canvas.width, canvas.height);
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.ctx.closePath();

        // Draw score
        this.ctx.beginPath();
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; // Shadow color (black with some transparency)
        this.ctx.shadowBlur = 0; // How much the shadow should be blurred
        this.ctx.shadowOffsetX = 2; // Horizontal shadow offset
        this.ctx.shadowOffsetY = 2; // Vertical shadow offset
        this.ctx.font = 'bold 36px Arial';

        this.ctx.closePath();

        this.UPGRADE_SYSTEM.drawPlayerStatsMenu(this.ctx);
        this.drawRunStatsUI(this.ctx);

        // Start Over Button
        this.drawButton(this.ctx.canvas.width / 2 - 150, this.ctx.canvas.height / 2 + +250 + 60, 300, 50, 'Start Over');

        // Listen for mouse clicks on buttons
        this.ctx.canvas.addEventListener('click', this.handleLoseGameScreenClick.bind(this));

    }

    pauseMenu(){
        if (this.isPauseMenu) {
            this.isPauseMenu = false;
        } else {
            this.isPauseMenu = true;
        }
        this.togglePause();
        ASSET_MANAGER.playAsset("./sounds/healing_heart.mp3");

        if (this.currMap > 0 && this.currMap < 4) {
            this.levelTimes[this.currMap-1] = this.elapsedTime;
            if (this.currMap === 1) {
                this.levelScores[0] = this.player.score;
            } else {
                this.levelScores[this.currMap - 1] = this.player.score - this.levelScores[this.currMap - 2];
            }
        }
    }
    drawPauseMenu() {


        // Draw the background red color
        this.ctx.fillStyle = `rgba(255, 255, 255, 0.42)`;
        this.ctx.beginPath();
        this.ctx.rect(0, 0, canvas.width, canvas.height);
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.ctx.closePath();

        // Draw score
        this.ctx.beginPath();
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; // Shadow color (black with some transparency)
        this.ctx.shadowBlur = 0; // How much the shadow should be blurred
        this.ctx.shadowOffsetX = 2; // Horizontal shadow offset
        this.ctx.shadowOffsetY = 2; // Vertical shadow offset
        this.ctx.font = 'bold 36px Arial';

        this.ctx.closePath();

        this.UPGRADE_SYSTEM.drawPlayerStatsMenu(this.ctx);
        this.drawRunStatsUI(this.ctx);

        // Start Over Button
        this.drawButton(this.ctx.canvas.width / 2 - 150, this.ctx.canvas.height / 2 + 250 + 60, 300, 50, 'Start Over');

        // Listen for mouse clicks on buttons
        this.ctx.canvas.addEventListener('click', this.handlePauseGameScreenClick.bind(this));

        this.ctx.shadowColor = 'rgba(0, 0, 0, 0)'; // Shadow color (black with some transparency)
        this.ctx.shadowBlur = 0; // How much the shadow should be blurred
        this.ctx.shadowOffsetX = 0; // Horizontal shadow offset
        this.ctx.shadowOffsetY = 0; // Vertical shadow offset

    }

    drawRunStatsUI(ctx) {
            let scale = 1;

            // Set animator back to original menu sprite sheet
        const bgImage = ASSET_MANAGER.getAsset("./sprites/run_stats_menu.png");
        this.ctx.drawImage(bgImage, 0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        // ctx.drawImage();
            // this.animator.changeSpritesheet(ASSET_MANAGER.getAsset("./sprites/run_stats_menu.png"), 0, 0, canvas.width, canvas.height, 1, 1);
            // this.animator.scale = (1.5) * scale;

            // Calculate the center of the UI
            let screenX = canvas.width - 215;
            let screenY = canvas.height/2 + 55;

        // Draw score
        this.ctx.beginPath();
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; // Shadow color (black with some transparency)
        this.ctx.shadowBlur = 0; // How much the shadow should be blurred
        this.ctx.shadowOffsetX = 2; // Horizontal shadow offset
        this.ctx.shadowOffsetY = 2; // Vertical shadow offset
        this.ctx.font = 'bold 36px Arial';

        this.ctx.fillText("Total Score:", screenX, screenY+5);
        this.ctx.fillText(this.player.score, screenX, screenY + 45);

        this.ctx.fillText(this.difficultySelected.toUpperCase(),screenX, screenY + 80);

        let levelNames = ["Grasslands", "Cave", "Space"];

        for (let i = 0; i < this.levelTimes.length; i++) {

            let minutes = Math.floor(this.levelTimes[i]/1000/60);
            let seconds = Math.floor(this.levelTimes[i]/1000);
            if (seconds < 10) {
                seconds = "0" + seconds.toString();
            }
            let time = minutes.toString() + ":" + seconds
            this.ctx.fillText(levelNames[i] + " (" + time + ")", screenX, screenY + 40 + 80*(i+1));
            this.ctx.fillText("Score: " + this.levelScores[i], screenX, screenY + 80 + 80*(i+1));
        }
            // Reset text font properties
            ctx.font = '24px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'; // Shadow color (black with some transparency)
            ctx.shadowBlur = 0; // How much the shadow should be blurred
            ctx.shadowOffsetX = 2; // Horizontal shadow offset
            ctx.shadowOffsetY = 2; // Vertical shadow offset

    }

    switchMap(teleportIndex) {
        let currentTime = this.elapsedTime / 1000

        if (this.currMap > 0 && this.currMap < 4) {
            this.levelTimes[this.currMap-1] = this.elapsedTime;
            if (this.currMap === 1) {
                this.levelScores[0] = this.player.score;
            } else {
                this.levelScores[this.currMap - 1] = this.player.score - this.levelScores[this.currMap - 2];
            }
        }

        // Delete old map stuff
        // Delete 'other' entities
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].removeFromWorld = true;
        }

        // Delete 'object' entities
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].removeFromWorld = true;
        }

        // Delete 'enemy' entities (there shouldn't be any at this point, but just in-case)
        for (let i = 0; i < this.enemies.length; i++) {
            this.enemies[i].removeFromWorld = true;
        }

        // Delete any 'ally' entities
        for (let i = 0; i < this.allies.length; i++) {
            this.allies[i].removeFromWorld = true;
        }

        // Delete any lingering 'attack' entities
        for (let i = 0; i < this.attacks.length; i++) {
            this.attacks[i].removeFromWorld = true;
        }

        // Delete any lingering 'arrow pointer' entities
        for (let i = 0; i < this.arrowPointers.length; i++) {
            this.arrowPointers[i].removeFromWorld = true;
        }

        // Place player at world center
        this.player.worldX = 0;
        this.player.worldY = 0;

        // Reset map stuff
        this.mapInitialized = false;
        this.mapObjectsInitialized = false;

        if (teleportIndex !== 0) {
            // Set roundOver to false now that we are on a new map (that is not rest area)
            this.roundOver = false;
        }

        // Remove the portal from the game after entering it
        if (this.portal) {
            this.portal.arrowPointer.removeFromWorld = true;
            this.portal.removeFromWorld = true;
        }

        // Temp win condition
        this.youWon = false; // Won't work while false

        // Reset clock on entering new map
        this.totalPausedTime = 0;
        this.startTime = Date.now();
        this.elapsedTime = (Date.now() - this.startTime) - this.totalPausedTime;

        currentTime = this.elapsedTime / 1000; // Recalc current time for things that need it below

        // Reset player dash cooldown
        this.player.lastDashTime = this.elapsedTime - (this.player.dashCooldown * 2); // Times 2 ensures we fully recover the CD

        // Reset player weapon switch CD
        this.player.lastWeaponSwitchTime = currentTime;

        // Reset weapon cooldowns for all weapons
        this.player.weapons.forEach(weapon => {
            weapon.lastPrimaryAttackTime = currentTime - (weapon.primaryCool * 2);
            weapon.lastSecondAttackTime = currentTime - (weapon.secondCool * 2);
        });

        // Reset cooldowns for upgrades
        this.player.lastMoonTime = this.elapsedTime / 1000;
        this.player.lastGraveWalkTime = this.elapsedTime / 1000;

        // Tell the game engine to switch to the map of the teleport index
        this.prevMap = this.currMap;
        this.currMap = teleportIndex;

        // Handle music changes
        switch (this.currMap) {
            case 0:
                ASSET_MANAGER.stopBackgroundMusic();
                ASSET_MANAGER.playBackgroundMusic(this.restAreaMusic);
                break;
            case 1:
                ASSET_MANAGER.stopBackgroundMusic();
                ASSET_MANAGER.playBackgroundMusic(this.mapOneMusic);
                break;
            case 2:
                ASSET_MANAGER.stopBackgroundMusic();
                ASSET_MANAGER.playBackgroundMusic(this.mapTwoMusic);
                break;
            case 3:
                ASSET_MANAGER.stopBackgroundMusic();
                ASSET_MANAGER.playBackgroundMusic(this.mapThreeMusic);
                break;
        }

        // Ramp up the difficulty for new game plus
        if (teleportIndex === 1) {
            this.SPAWN_SYSTEM.DIFFICULTY_SCALE *= 3;
            this.SPAWN_SYSTEM.baseEnemySpawnInterval /= 2;
        }

        // Reset spawn system on map change
        this.SPAWN_SYSTEM = new Spawn_System(this, this.SPAWN_SYSTEM.DIFFICULTY_SCALE, this.SPAWN_SYSTEM.baseEnemySpawnInterval);

        // If rest area, heal player
        if (teleportIndex === 0) {
            this.player.heal(this.player.maxHP);
        }

        // if (teleportIndex === 3) {
        //     this.createPlayerReflection();
        // }

        if (teleportIndex === 4) {
            ASSET_MANAGER.stopBackgroundMusic();
            ASSET_MANAGER.playBackgroundMusic(this.youWonScreenMusic);
            this.drawEndGameScreen(Math.random() < 0.03);
        }
    }

    difficultyButtonHelper() {
        const easyButtonX = 580;
        const easyButtonY = 700;
        const mediumButtonX = 680;
        const mediumButtonY = 700;
        const hardButtonX = 780;
        const hardButtonY = 700;


        // Easy button
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(easyButtonX, easyButtonY, 80, 40);
        this.ctx.fillStyle = 'black';
        this.ctx.font = '24px Arial';
        const easyTextWidth = this.ctx.measureText('Easy').width;
        this.ctx.fillText('Easy', easyButtonX + 68 - easyTextWidth / 2, easyButtonY + 25);

        // Medium button
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(mediumButtonX, mediumButtonY, 80, 40);
        this.ctx.fillStyle = 'black';
        this.ctx.font = '20px Arial';
        const mediumTextWidth = this.ctx.measureText('Medium').width;
        this.ctx.fillText('Medium', mediumButtonX + 76 - mediumTextWidth / 2, mediumButtonY + 25);

        // Hard button
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(hardButtonX, hardButtonY, 80, 40);
        this.ctx.fillStyle = 'black';
        this.ctx.font = '24px Arial';
        const hardTextWidth = this.ctx.measureText('Hard').width;
        this.ctx.fillText('Hard', hardButtonX + 67 - hardTextWidth / 2, hardButtonY + 25);

        if(this.difficultySelected === 'easy') {
            this.ctx.fillStyle = 'yellow';
            this.ctx.fillRect(easyButtonX, easyButtonY, 80, 40);
            this.ctx.fillStyle = 'black';
            this.ctx.font = '24px Arial'; // Adjust the font size
            const easyTextWidth = this.ctx.measureText('Easy').width;
            this.ctx.fillText('Easy', easyButtonX + 68 - easyTextWidth / 2, easyButtonY + 25);
            this.player.atkPow *= 2;
            this.player.maxHP *= 2;
            this.player.currHP *= 2;
        }

        if(this.difficultySelected === 'medium') {
            this.ctx.fillStyle = 'yellow';
            this.ctx.fillRect(mediumButtonX, mediumButtonY, 80, 40);
            this.ctx.fillStyle = 'black';
            this.ctx.font = '20px Arial';
            const mediumTextWidth = this.ctx.measureText('Medium').width;
            this.ctx.fillText('Medium', mediumButtonX + 76 - mediumTextWidth / 2, mediumButtonY + 25);
        }

        if(this.difficultySelected === 'hard') {
            this.ctx.fillStyle = 'yellow';
            this.ctx.fillRect(hardButtonX, hardButtonY, 80, 40);
            this.ctx.fillStyle = 'black';
            this.ctx.font = '24px Arial';
            const hardTextWidth = this.ctx.measureText('Hard').width;
            this.ctx.fillText('Hard', hardButtonX + 67 - hardTextWidth / 2, hardButtonY + 25);
            this.player.atkPow *= 0.9;
            this.player.maxHP *= 0.9;
            this.player.currHP *= 0.9;
        }

        this.drawMouseTracker(this.ctx);

        // Event handling for clicks
        this.ctx.canvas.addEventListener('click', (event) => {
            const mouseX = event.clientX - this.ctx.canvas.getBoundingClientRect().left;
            const mouseY = event.clientY - this.ctx.canvas.getBoundingClientRect().top;

            // Check for easy button click
            if (mouseX >= easyButtonX && mouseX <= easyButtonX + 80 &&
                mouseY >= easyButtonY && mouseY <= easyButtonY + 40) {
                console.log('Easy button clicked');
                this.difficultySelected = 'easy';
            }

            // Check for medium button click
            if (mouseX >= mediumButtonX && mouseX <= mediumButtonX + 80 &&
                mouseY >= mediumButtonY && mouseY <= mediumButtonY + 40) {
                console.log('Medium button clicked');
                this.difficultySelected = 'medium';
            }

            // Check for hard button click
            if (mouseX >= hardButtonX && mouseX <= hardButtonX + 80 &&
                mouseY >= hardButtonY && mouseY <= hardButtonY + 40) {
                console.log('Hard button clicked');
                this.difficultySelected = 'hard';
            }
        });
    }
}