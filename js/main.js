const gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./sprites/McIdle.png");
ASSET_MANAGER.queueDownload("./sprites/McWalk.png");
ASSET_MANAGER.queueDownload("./sprites/McDead.png");
ASSET_MANAGER.queueDownload("./sprites/McDash.png");
ASSET_MANAGER.queueDownload("./sprites/SlimeMove.png");
ASSET_MANAGER.queueDownload("./sprites/Zombie_Run.png");
ASSET_MANAGER.queueDownload("./sprites/FloatingEye.png");
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
ASSET_MANAGER.queueDownload("./sprites/boss_knight_stand.png");
ASSET_MANAGER.queueDownload("./sprites/boss_knight_dash.png");
ASSET_MANAGER.queueDownload("./sprites/boss_knight_backdash.png");
ASSET_MANAGER.queueDownload("./sprites/boss_knight_groundsmash.png");
ASSET_MANAGER.queueDownload("./sprites/debug_marker.png");

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
