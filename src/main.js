const gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();

// ALL Assets to download go here!
ASSET_MANAGER.queueDownload("./Leona.png");

ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");

	gameEngine.addEntity(new Leona(gameEngine));

	gameEngine.init(ctx);

	gameEngine.start();
});
