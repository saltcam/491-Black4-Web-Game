/**
 * This class will control all enemy spawning in the game.
 */
class Spawn_System {
    /** Default Constructor */
    constructor(game) {
        /** Reference to the game engine. */
        this.game = game;
        /** Controls if the spawn system is enabled or not. */
        this.enabled = true;
        /** Tracks if the spawn system has initialized. */
        this.initinitialized = false;
        /** Controls the max enemy count, gets doubled incrementally. */
        this.baseMaxEnemies = 2;
        /** Tracks the current max enemy count. */
        this.currentMaxEnemies = 0;
        /** Controls how often (in seconds) to increment max enemy count. (Doubles) */
        this.maxEnemyIncrementTime = 7.5;
        /** Stores how many max enemy intervals have passed. */
        this.maxEnemyIntervals = 0;
        /** How much to lower the spawn delay each interval. */
        this.spawnDelayDecreaseMultiplier = 0.9;
        /** Controls how often (in seconds) we reduce the spawn delay of enemies. */
        this.lowerSpawnDelayInterval = 12.5;
        /** Tracks when the last time we lowered the spawn delay was. */
        this.lastSpawnDelayDecreaseTime = 0;
        /** How often to spawn enemies by default (this is automatically lowered exponentially as time goes on). */
        this.baseEnemySpawnInterval = 4;
        /** Tracks when the last enemy was spawned. */
        this.lastSpawnTime = 0;
        /** Setting this to true tells spawnRandomEnemy() to make the next enemy it spawns an elite. */
        this.spawnElite = false;
        /** How often to set spawnElite to true (in seconds). Basically how often are we spawning an elite? */
        this.eliteSpawnTimer = 60;
        /** Tracks how long it has been since we last spawned an elite. */
        this.lastEliteSpawnTime = 0;

        /** An array of all potential enemies of type 'Enemy_Contact'. */
        this.contactEnemyTypes = [
            { enemyType: "contact", name: "Zombie", maxHP: 47, currHP: 47, atkPow: 6, worldX: 0, worldY: 0, boxWidth: 19/2,
                boxHeight: 28/2, boxType: "enemy", speed: 72, spritePath: "./sprites/Zombie_Run.png", animXStart: 0,
                animYStart: 0, animW: 34, animH: 27, animFCount: 8, animFDur: 0.2, scale: 3, exp: -1},
            { enemyType: "contact", name: "Slime", maxHP: 62, currHP: 62, atkPow: 9, worldX: 0, worldY: 0, boxWidth: 18,
                boxHeight: 10, boxType: "enemy", speed: 42, spritePath: "./sprites/SlimeMove.png", animXStart: -1,
                animYStart: 0, animW: 32, animH: 18, animFCount: 8, animFDur: 0.1, scale: 2, exp: 1},
            { enemyType: "contact", name: "Floating Eye", maxHP: 30, currHP: 30, atkPow: 3, worldX: 0, worldY: 0,
                boxWidth: 19/2, boxHeight: 28/2, boxType: "enemy", speed: 85, spritePath: "./sprites/FloatingEye.png",
                animXStart: -3, animYStart: 0, animW: 128, animH: 128, animFCount: 80, animFDur: 0.05, scale: 2, exp: -1},
            { enemyType: "contact", name: "Skeleton", maxHP: 42, currHP: 42, atkPow: 4, worldX: 0, worldY: 0,
                boxWidth: 38/2, boxHeight: 56/2, boxType: "enemy", speed: 60, spritePath: "./sprites/skeleton.png",
                animXStart: 0.5, animYStart: 0, animW: 70.5, animH: 77, animFCount: 8, animFDur: 0.2, scale: 1.5, exp: -1},

        ];
        /** An array of all potential enemies of type 'Enemy_Ranged'. */
        this.rangedEnemyTypes = [
            { enemyType: "ranged", name: "Mage", maxHP: 32, currHP: 32, atkPow: 10, worldX: 0, worldY: 0,
                boxWidth: 17, boxHeight: 29, boxType: "enemy", speed: 40, spritePath: "./sprites/Ally_Ranged_Walk.png",
                animXStart: 0, animYStart: 0, animW: 32, animH: 28, animFCount: 8, animFDur: 0.4, scale: 2.8, exp: -1,
                projectileFreq: 3, projectileSpeed: 20, projectileSize: 20, projectilePulse: false, projectileCount: 1, projectileSpread: 0},
            { enemyType: "ranged", name: "Wizard", maxHP: 42, currHP: 42, atkPow: 4, worldX: 0, worldY: 0,
                boxWidth: 38/2, boxHeight: 56/2, boxType: "enemy", speed: 40, spritePath: "./sprites/wizard.png",
                animXStart: 0, animYStart: 0, animW: 60, animH: 92, animFCount: 8, animFDur: 0.2, scale: 1, exp: -1,
                projectileFreq: 6, projectileSpeed: 15, projectileSize: 20, projectilePulse: false, projectileCount: 3, projectileSpread: 45},
        ];

        /** Stores the current wave. First wave is always wave #0. */
        this.currentWave = 0;
        /** How often the wave increments in seconds. */
        this.waveIncrementTime = 30;
        /**
         * An array that stores enemies based on difficulty for Map#1 (Grasslands)
         * Each map is 5 minutes, with each minute representing one wave.
         * Each map can have a range of 0-8 waves.
         */
        this.mapOneEnemies = [
            this.contactEnemyTypes[0], // Wave 0 (0-30)
            this.contactEnemyTypes[1], // Wave 1 (30-60)
            this.contactEnemyTypes[2], // Wave 2 (60-120)
            this.rangedEnemyTypes[0], // Wave 3 (120-150)
            this.contactEnemyTypes[3] // Wave 4 (150-180)
        ];
        //
        // this.mapOneEnemies = [
        //     this.rangedEnemyTypes[0]
        // ];

        /** This array stores enemies from previous waves for constant spawning. */
        this.passiveEnemySpawns = [];
    }

    /** Called once at the start */
    start() {
        const currentTime = this.game.timer.gameTime;

        this.lastSpawnDelayDecreaseTime = currentTime;
        this.initialized = true;
    }

    /** Called every frame/tick. */
    update() {
        if (!this.initialized) {
            this.start();
        }
        // Do nothing if game is paused
        if (this.game.pauseGame) return;

        // Handle elite spawn timer
        // Check if this.eliteSpawnTimer time has passed since last elite spawn
        if ((this.game.elapsedTime / 60000) - this.lastEliteSpawnTime >= (this.eliteSpawnTimer/60)) {
            this.spawnElite = true;
            this.lastEliteSpawnTime = this.game.elapsedTime / 60000; // Update last trigger time
        }

        // Update the enemy spawn interval (make enemies spawn faster)
        let currentSpawnInterval = this.updateSpawnSettings();

        // Check if it's time to spawn an enemy based on current spawn interval
        // if (this.game.elapsedTime > 0 && this.game.elapsedTime % currentSpawnInterval < this.game.clockTick * 1000) {
        //     // Conditions to spawn enemies: no boss, round not over, not in rest area
        //     if (this.game.boss === null && !this.game.roundOver && this.game.currMap !== 0 &&
        //         this.game.enemies.length < this.currentMaxEnemies) {
        //         //console.log("CURR = " + this.game.enemies.length + ", MAX = " + this.currentMaxEnemies);
        //         this.spawnScalingEnemies();
        //     }
        // }

        if (this.game.elapsedTime > 0 && this.game.elapsedTime % currentSpawnInterval < this.game.clockTick * 1000) {
            // Conditions to spawn enemies: no boss, round not over, not in rest area, this.game.timer.gameTime - this.lastSpawnTime >= this.baseEnemySpawnInterval
            if (this.game.boss === null && !this.game.roundOver && this.game.currMap !== 0 &&
                this.game.enemies.length < this.currentMaxEnemies &&
                (this.game.timer.gameTime - this.lastSpawnTime >= this.baseEnemySpawnInterval)) {
                //console.log("CURR = " + this.game.enemies.length + ", MAX = " + this.currentMaxEnemies);
                this.spawnScalingEnemies();
            }
        }
    }

    /** Call this method to spawn enemies of increasing difficulty. */
    spawnScalingEnemies() {
        // Store Wave#
        const waveNumber = Math.min(Math.floor(this.game.elapsedTime/(this.waveIncrementTime * 1000)), 8);
        //console.log("Calculated wave = " + waveNumber);

        // Spawn this wave's enemy type
        if (this.game.currMap === 1) {
            // Increment current wave, and move previous enemy to passive spawn array
            if (waveNumber > this.currentWave && this.currentWave !== this.mapOneEnemies.length - 1) {
                // Add the previous wave's enemy to the passive wave array
                this.passiveEnemySpawns.push(this.mapOneEnemies[Math.min(this.currentWave, this.mapOneEnemies.length - 1)]);

                this.currentWave = waveNumber;
            }

            // Generate random off-screen coordinates for spawning
            let { x: randomXNumber, y: randomYNumber } = this.game.randomOffscreenCoords();

            //console.log("Spawning wave #" + Math.min(this.currentWave, this.mapOneEnemies.length - 1) + " enemies.");
            this.spawnEnemy(this.mapOneEnemies[Math.min(this.currentWave, this.mapOneEnemies.length - 1)], randomXNumber, randomYNumber);
        }
        
        // Trigger passive spawns
        this.passiveEnemySpawns.forEach(enemy => {
            // Generate random off-screen coordinates for spawning
            let { x: randomXNumber, y: randomYNumber } = this.game.randomOffscreenCoords();

            this.spawnEnemy(enemy, randomXNumber, randomYNumber);
        });
    }

    /**
     * Call this method to spawn an enemy passed from one of the enemy arrays.
     * @param   enemy   The enemy info to use from an enemy array.
     * @param   worldX  The x-coordinate to spawn the enemy.
     * @param   worldY  The y-coordinate to spawn the enemy.
     */
    spawnEnemy(enemy, worldX, worldY) {
        if (enemy === null) return; // Passed a null entity, exit

        let newEnemy = enemy;

        if (enemy.enemyType === "contact") {
            newEnemy = this.game.addEntity(new Enemy_Contact(enemy.name, enemy.maxHP,
                enemy.currHP, enemy.atkPow, this.game, worldX, worldY,
                enemy.boxWidth, enemy.boxHeight, enemy.boxType,
                enemy.speed, enemy.spritePath, enemy.animXStart,
                enemy.animYStart, enemy.animW, enemy.animH,
                enemy.animFCount, enemy.animFDur, enemy.scale,
                enemy.exp));
        } else if (this.mapOneEnemies[0].enemyType === "ranged") {
            newEnemy = this.game.addEntity(new Enemy_Ranged(enemy.name, enemy.maxHP,
                enemy.currHP, enemy.atkPow, this.game, worldX, worldY,
                enemy.boxWidth, enemy.boxHeight, enemy.boxType,
                enemy.speed, enemy.spritePath, enemy.animXStart,
                enemy.animYStart, enemy.animW, enemy.animH,
                enemy.animFCount, enemy.animFDur, enemy.scale,
                enemy.exp, enemy.projectileFreq, enemy.projectileSpeed,
                enemy.projectileSize, enemy.projectilePulse,
                enemy.projectileCount, enemy.projectileSpread));
        }

        // Spawn an elite if this.spawnElite has been set to true
        if(this.spawnElite) {
            if (Math.random() < 1) {    // Can make it a chance if we lower the 1 to something < 1 (ex: 0.1 === 10% chance)
                newEnemy.maxHP *= 8;
                newEnemy.currHP = newEnemy.maxHP;
                newEnemy.atkPow *= 2;
                newEnemy.speed *= 0.75; //+= 25;
                newEnemy.exp *= 5;
                newEnemy.animator.scale *= 1.5;
                newEnemy.boundingBox.width *= 1.5;
                newEnemy.boundingBox.height *= 1.5;
                newEnemy.isElite = true;
                this.spawnElite = false;
                newEnemy.animator.outlineMode = true;
                //console.log(newEnemy.name + " has become elite!");
            }
            else {
                newEnemy.isElite = false;
            }
        }

        // Store this time as the last time we spawned an enemy
        this.lastSpawnTime = this.game.timer.gameTime;

        return newEnemy;
    }

    /** Call this method to spawn a random non-boss enemy. */
    spawnRandomEnemy() {
        const { x: randomXNumber, y: randomYNumber } = this.game.randomOffscreenCoords();
        const speedMultiplier = Math.random() * 0.2 + 0.9; // Random speed multiplier between 0.9 and 1.1

        let randomEnemyType;
        let newEnemy;

        let enemyClass = Math.floor(Math.random() * 3);
        // Selects a random enemy from the enemyTypes array
        // 0 = contact, 1 = ranged, 2 = charge
        switch(enemyClass){
            // Spawn enemy type of 'Enemy_Contact'.
            case 0 :
                randomEnemyType = this.contactEnemyTypes[Math.floor(Math.random() * this.contactEnemyTypes.length)];
                //Creates the new random enemy at a random location
                newEnemy = this.spawnEnemy(randomEnemyType, randomXNumber, randomYNumber);
                // Slightly randomized enemy speeds
                newEnemy.speed *= speedMultiplier;
                break;
            // Spawn enemy type of 'Enemy_Ranged'.
            case 1 :
                randomEnemyType = this.rangedEnemyTypes[Math.floor(Math.random() * this.rangedEnemyTypes.length)];
                //Creates the new random enemy at a random location
                newEnemy = this.spawnEnemy(randomEnemyType, randomXNumber, randomYNumber);
                // Slightly randomized enemy speeds
                newEnemy.speed *= speedMultiplier;
                break;
            // Spawn enemy type of 'Enemy_Charger'.
            case 2 :
                //TODO replace with charge enemies
                randomEnemyType = this.contactEnemyTypes[Math.floor(Math.random() * this.contactEnemyTypes.length)];
                //Creates the new random enemy at a random location
                newEnemy = this.spawnEnemy(randomEnemyType, randomXNumber, randomYNumber);
                // Slightly randomized enemy speeds
                newEnemy.speed *= speedMultiplier;
                break;
        }
    }

    /**
     * Call this in update to update the enemy spawn interval.
     * @return  The current spawn interval.
     */
    updateSpawnSettings() {
        const currentTime = this.game.timer.gameTime;

        // Update the max enemy interval
        this.maxEnemyIntervals = Math.floor(this.game.elapsedTime / (this.maxEnemyIncrementTime * 1000));

        // Calculate the maximum number of enemies based on number of intervals that have passed
        this.currentMaxEnemies = this.baseMaxEnemies * this.maxEnemyIntervals;

        // Calculate spawn rate based on elapsed time
        // const elapsedTimeInMinutes = this.game.elapsedTime / (this.lowerSpawnDelayInterval * 1000);

        // Update the spawn delay if the this.lowerSpawnDelayInterval has passed since the last time we did this
        if ((currentTime - this.lastSpawnDelayDecreaseTime) >= this.lowerSpawnDelayInterval) {
            console.log("Lowering spawn delay from " + this.baseEnemySpawnInterval + " to " + (this.baseEnemySpawnInterval * this.spawnDelayDecreaseMultiplier));
            this.baseEnemySpawnInterval *= this.spawnDelayDecreaseMultiplier;
            this.lastSpawnDelayDecreaseTime = currentTime;
        }

        // Calculate the spawn rate multiplier exponentially
        // Do some fancy math to lower the spawn delay exponentially
        // const spawnRateMultiplier = Math.pow(0.5, Math.floor(elapsedTimeInMinutes));

        // Calculate the current spawn interval based on the multiplier
        // No explicit minimum interval, but you could enforce one if needed
        //return ((this.baseEnemySpawnInterval * 1000) * spawnRateMultiplier); // Return the current spawn interval
        return (this.baseEnemySpawnInterval * 1000);
    }

    // updateSpawnSettings() {
    //     // Update the max enemy interval
    //     this.maxEnemyIntervals = Math.floor(this.game.elapsedTime / (this.maxEnemyIncrementTime * 1000));
    //
    //     // Calculate the maximum number of enemies based on number of intervals that have passed
    //     this.currentMaxEnemies = this.baseMaxEnemies * this.maxEnemyIntervals;
    //
    //     if (this.game.timer.gameTime - this.lastSpawnDelayDecreaseTime <= this.lowerSpawnDelayInterval) {
    //         console.log("Lowering spawn delay from " + this.baseEnemySpawnInterval + " to " + (this.baseEnemySpawnInterval * this.spawnDelayDecreaseMultiplier));
    //         this.baseEnemySpawnInterval *= this.spawnDelayDecreaseMultiplier;
    //         this.lastSpawnDelayDecreaseTime = this.game.timer.gameTime;
    //     }
    // }
}