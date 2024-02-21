// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

class Timer {
    constructor() {
        this.gameTime = 0;
        this.maxStep = 0.05;
        this.lastTimestamp = Date.now();
        this.isPaused = false;
    }

    tick() {
        if (this.isPaused) {
            return 0; // No time advancement if paused
        }

        const current = Date.now();
        const delta = (current - this.lastTimestamp) / 1000;
        this.lastTimestamp = current;

        const gameDelta = Math.min(delta, this.maxStep);
        this.gameTime += gameDelta;
        return gameDelta;
    }

    reset() {
        this.lastTimestamp = Date.now();
        this.gameTime = 0; // Reset the game time to 0
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.lastTimestamp = Date.now(); // Reset lastTimestamp to avoid jump in gameTime
        }
    }
}

