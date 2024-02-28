class AssetManager {
    constructor() {
        this.successCount = 0;
        this.errorCount = 0;
        this.cache = [];
        this.downloadQueue = [];
        this.currentBackgroundMusic = null; // Track the current background music
        this.backgroundMusicPlaying = false;
        this.hitSoundLimit = 15; // Maximum concurrent hit sounds
        this.hitSoundCount = 0; // Current number of hit sounds playing
        this.hitSoundPath = "./sounds/hit.mp3"; // Path to the hit sound
    };

    playBackgroundMusic(path, volume = 0.1, playbackRate = 1.0) {
        // Stop current music if it's playing
        if (this.currentBackgroundMusic && this.cache[this.currentBackgroundMusic]) {
            let currentMusic = this.cache[this.currentBackgroundMusic];
            currentMusic.pause();
            currentMusic.currentTime = 0;
        }

        // Set the new background music
        this.currentBackgroundMusic = path;

        // Play the new background music
        if (this.cache[path]) {
            let audio = this.cache[path];
            audio.volume = volume;
            audio.playbackRate = playbackRate;
            audio.loop = true; // Ensure the music loops
            audio.play();
            this.backgroundMusicPlaying = true;
        }
    }

    stopBackgroundMusic() {
        if (this.currentBackgroundMusic && this.cache[this.currentBackgroundMusic]) {
            let music = this.cache[this.currentBackgroundMusic];
            music.pause();
            music.currentTime = 0;
            this.currentBackgroundMusic = null; // Reset current background music
            this.backgroundMusicPlaying = false;
        }
    }

    queueDownload(path) {
        console.log("Queueing " + path);
        this.downloadQueue.push(path);
    };

    isDone() {
        return this.downloadQueue.length === this.successCount + this.errorCount;
    };

    downloadAll(callback) {
        if (this.downloadQueue.length === 0) setTimeout(callback, 10);
        for (let i = 0; i < this.downloadQueue.length; i++) {
            let that = this;

            const path = this.downloadQueue[i];
            console.log(path);
            const ext = path.substring(path.length - 3);

            switch (ext) {
                case 'jpg':
                case 'png':
                case 'gif':
                    let img = new Image();
                    img.addEventListener("load", function () {
                        console.log("Loaded " + this.src);
                        that.successCount++;
                        if (that.isDone()) callback();
                    });

                    img.addEventListener("error", function () {
                        console.log("Error loading " + this.src);
                        that.errorCount++;
                        if (that.isDone()) callback();
                    });

                    img.src = path;
                    this.cache[path] = img;
                    break;
                case 'wav':
                case 'mp3':
                case 'mp4':
                    let aud = new Audio();
                    aud.addEventListener("loadeddata", function () {
                        console.log("Loaded " + this.src);
                        that.successCount++;
                        if (that.isDone()) callback();
                    });

                    aud.addEventListener("error", function () {
                        console.log("Error loading " + this.src);
                        that.errorCount++;
                        if (that.isDone()) callback();
                    });

                    aud.addEventListener("ended", function () {
                        aud.pause();
                        aud.currentTime = 0;
                    });

                    aud.src = path;
                    aud.load();

                    this.cache[path] = aud;
                    break;
            }
        }
    };

    getAsset(path) {
        return this.cache[path];
    };

    playAsset(path, volume = 0.1, playbackRate = 1.0) {
        if (this.cache[path]) {
            // Special handling for hit sounds
            if (path === this.hitSoundPath) {
                // Check if the hit sound limit has been reached
                if (this.hitSoundCount >= this.hitSoundLimit) {
                    console.log("Hit sound limit reached. Skipping playback.");
                    return; // Skip playing this sound
                }
                // Increment hit sound count
                this.hitSoundCount++;
            }

            let audio = this.cache[path].cloneNode(); // Clone the audio element
            audio.volume = volume; // Set the volume for this instance
            audio.playbackRate = playbackRate; // Set the playback rate
            audio.play();
            audio.addEventListener("ended", () => {
                audio.remove(); // Optionally remove the cloned element once it has played
                // Decrement hit sound count when a hit sound ends
                if (path === this.hitSoundPath) {
                    this.hitSoundCount--;
                }
            });
        }
    }

    muteAudio(mute) {
        for (let key in this.cache) {
            let asset = this.cache[key];
            if (asset instanceof Audio) {
                asset.muted = mute;
            }
        }
    };

    adjustVolume(volume) {
        for (let key in this.cache) {
            let asset = this.cache[key];
            if (asset instanceof Audio) {
                asset.volume = volume;
            }
        }
    };

    pauseBackgroundMusic() {
        for (let key in this.cache) {
            let asset = this.cache[key];
            if (asset instanceof Audio) {
                asset.pause();
                asset.currentTime = 0;
            }
        }
    }

    autoRepeat(path) {
        let aud = this.cache[path];
        if (aud) {
            aud.loop = true; // Make the audio loop
            aud.play(); // Start playing the looped audio
        }
    }
}