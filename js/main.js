const gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./sprites/map_grasslands.png");
ASSET_MANAGER.queueDownload("./sprites/map_stone_background.png");
ASSET_MANAGER.queueDownload("./sprites/map_space_background.png");
ASSET_MANAGER.queueDownload("./sprites/map_space_background2.gif");
ASSET_MANAGER.queueDownload("./sprites/portal.png");
ASSET_MANAGER.queueDownload("./sprites/grass.png");
ASSET_MANAGER.queueDownload("./sprites/map_rock_object.png");
ASSET_MANAGER.queueDownload("./sprites/exp_orb.png");
ASSET_MANAGER.queueDownload("./sprites/arrow.png");
ASSET_MANAGER.queueDownload("./sprites/scythe_attack_slash.png");
ASSET_MANAGER.queueDownload("./sprites/weapon_scythe_primaryattack.png");
ASSET_MANAGER.queueDownload("./sprites/weapon_scythe_secondaryattack.png");
ASSET_MANAGER.queueDownload("./sprites/debug_marker.png");
ASSET_MANAGER.queueDownload("./sprites/scythe.png");
ASSET_MANAGER.queueDownload("./sprites/weapon_scythe.png");
ASSET_MANAGER.queueDownload("./sprites/Tome.png");
ASSET_MANAGER.queueDownload("./sprites/NecromancyStaff.png");
ASSET_MANAGER.queueDownload("./sprites/map_rest_area.png");
ASSET_MANAGER.queueDownload("./sprites/object_treasure_chest.png");
ASSET_MANAGER.queueDownload("./sprites/object_tombstone.png");

//player
ASSET_MANAGER.queueDownload("./sprites/McIdle.png");
ASSET_MANAGER.queueDownload("./sprites/McIdle_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/McWalk.png");
ASSET_MANAGER.queueDownload("./sprites/McWalk_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/McDead.png");
ASSET_MANAGER.queueDownload("./sprites/McDash.png");

//enemies
ASSET_MANAGER.queueDownload("./sprites/SlimeMove.png");
ASSET_MANAGER.queueDownload("./sprites/SlimeMove_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/Zombie_Run.png");
ASSET_MANAGER.queueDownload("./sprites/Zombie_Run_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/FloatingEye.png");
ASSET_MANAGER.queueDownload("./sprites/FloatingEye_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/boss_knight_stand.png");
ASSET_MANAGER.queueDownload("./sprites/boss_knight_stand_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/boss_knight_dash.png");
ASSET_MANAGER.queueDownload("./sprites/boss_knight_dash_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/boss_knight_backdash.png");
ASSET_MANAGER.queueDownload("./sprites/boss_knight_backdash_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/boss_knight_groundsmash.png");
ASSET_MANAGER.queueDownload("./sprites/boss_knight_groundsmash_DAMAGED.png");

//sounds
ASSET_MANAGER.queueDownload("./sounds/SE_scythe_primary.mp3");
ASSET_MANAGER.queueDownload("./sounds/SE_scythe_secondary.mp3");
ASSET_MANAGER.queueDownload("./sounds/SE_tome_primary.mp3");
ASSET_MANAGER.queueDownload("./sounds/SE_tome_secondary.mp3");
ASSET_MANAGER.queueDownload("./sounds/SE_staff_primary.mp3");
ASSET_MANAGER.queueDownload("./sounds/SE_staff_secondary.mp3");

ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;	// Prevents the image from blurring when scaled

	gameEngine.init(ctx);	// Initialize the game engine given the canvas context
	gameEngine.addEntity(new Player(gameEngine));	// Add the player character 'Player' to the game engine
	gameEngine.initCamera();

	//gameEngine.addEntity(new upgradeScreen(gameEngine)); // Add upgrade screen to the game engine

	gameEngine.start();	// Start the game engine
});
