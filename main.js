const gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./sprites/McIdle.png");
ASSET_MANAGER.queueDownload("./sprites/McWalk.png");
ASSET_MANAGER.queueDownload("./sprites/McDead.png");
ASSET_MANAGER.queueDownload("./sprites/McDash.png");
ASSET_MANAGER.queueDownload("./sprites/SlimeMove.png");
ASSET_MANAGER.queueDownload("./sprites/zombie-spritesheet-stand.png");
ASSET_MANAGER.queueDownload("./sprites/zombie-spritesheet-walk.png");
ASSET_MANAGER.queueDownload("./sprites/map_grasslands.png");
ASSET_MANAGER.queueDownload("./sprites/map_stone_border.png");
ASSET_MANAGER.queueDownload("./sprites/portal.png");
ASSET_MANAGER.queueDownload("./sprites/grass.png");

ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;	// Prevents the image from blurring when scaled

	gameEngine.init(ctx);	// Initialize the game engine given the canvas context

	gameEngine.addEntity(new Dude(gameEngine));	// Add the player character 'Dude' to the game engine
	gameEngine.initCamera();
	gameEngine.initMap();
	// gameEngine.addEntity(new Enemy_Contact("Zombie", 10, 10, 10, gameEngine, 600, 300, 57, 85, "enemy", 50,
	// 	"./sprites/zombie-spritesheet-stand.png",
	// 	0, 0, 48, 55, 2, 0.5));
	gameEngine.addEntity(new Enemy_Contact("Zombie", 10, 10, 10, gameEngine, 100, 100, 57/1.5, 85/1.5, "enemy", 0,
		"./sprites/zombie-spritesheet-stand.png",
		0, 0, 48, 55, 2, 0.5, 1.5));
	// gameEngine.addEntity(new Enemy_Contact("Slime", 5, 5, 1, gameEngine, 110, 110, 30, 20, "enemy", 50,
	// 		"./sprites/SlimeMove.png",
	// 		0, 0, 32, 18, 8, 0.1, 2));
	//gameEngine.addEntity(new upgradeScreen(gameEngine)); // Add upgrade screen to the game engine
	gameEngine.start();	// Start the game engine
});
