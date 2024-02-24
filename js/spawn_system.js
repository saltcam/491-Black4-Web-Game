/**
 * This class will control all enemy spawning in the game.
 *
 * The way enemies are spawned in this script is that we spawn a certain enemy type over 30 second waves.
 * Then, when the next wave triggers, we store the previous wave's enemy in a passive enemy spawn array.
 * From then on the game will always spawn one enemy of the current wave, and one enemy from ONE of the previous waves.
 * The enemy chosen from previous waves changes with every spawn that happens.
 *
 * On map swaps, we reset only the passive enemy array.
 */
class Spawn_System {
    /** Default Constructor */
    constructor(game, difficulty_scale = 1.0) {
        /**
         * Controls how scaled up enemy stats are.
         * Set this to something < 1 to make the enemies easier.
         * Set this to something > 1 to make the enemies harder.
         */
        this.DIFFICULTY_SCALE = difficulty_scale;

        /** Reference to the game engine. */
        this.game = game;
        /** Tracks if the spawn system has initialized. */
        this.initialized = false;
        /** Controls the max enemy count, gets doubled incrementally. */
        this.baseMaxEnemies = 2;
        /** Tracks the current max enemy count. */
        this.currentMaxEnemies = 0;
        /** Controls how often (in seconds) to increment max enemy count. */
        this.maxEnemyIncrementTime = 7.5;
        /** Stores how many max enemy intervals have passed. */
        this.maxEnemyIntervals = 0;
        /** How much to lower the spawn delay each interval. */
        this.spawnDelayDecreaseMultiplier = 0.88;
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
        /** Spawn the boss after this many seconds of game time. */
        this.bossSpawnTimer = 300;
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
            { enemyType: "contact", name: "Skeleton", maxHP: 75, currHP: 75, atkPow: 10, worldX: 0, worldY: 0,
                boxWidth: 38/2, boxHeight: 56/2, boxType: "enemy", speed: 60, spritePath: "./sprites/skeleton.png",
                animXStart: 0.5, animYStart: 0, animW: 70.5, animH: 77, animFCount: 8, animFDur: 0.2, scale: 1.4, exp: -1},
        ];
        /** An array of all potential enemies of type 'Enemy_Ranged'. */
        this.rangedEnemyTypes = [
            { enemyType: "ranged", name: "Mage", maxHP: 32, currHP: 32, atkPow: 10, worldX: 0, worldY: 0,
                boxWidth: 40, boxHeight: 60, boxType: "enemy", speed: 40, spritePath: "./sprites/wizard_walk.png",
                shootSpritePath: "./sprites/wizard_shooting.png" , animXStart: 0, animYStart: 0, animW: 418, animH: 145,
                animFCount: 7, animFDur: 0.2, scale: 0.65, shootAnimXStart: 0, shootAnimYStart: 0, shootAnimW: 418,
                shootAnimH: 145, shootAnimFCount: 7, shootAnimFDur: 0.2, shootScale: 0.65, exp: -1, projectileFreq: 3,
                projectileSpeed: 15, projectileSize: 20, projectilePulse: false, projectileCount: 1, projectileSpread: 0,
                fleeDist: 200, approachDist: 350}
        ];
        /** An array of all potential enemies of type 'Enemy_Charger'. */
        this.chargerEnemyTypes = [
            { enemyType: "charger", name: "Boar", maxHP: 80, currHP: 80, atkPow: 7, worldX: 0, worldY: 0, boxWidth: 19,
                boxHeight: 28, boxType: "enemy", speed: 50, spritePath: "./sprites/boar_walk.png", animXStart: 0,
                animYStart: 0, animW: 95, animH: 46, animFCount: 7, animFDur: 0.2, scale: 1.5, chargeSpritePath: "./sprites/boar_charge.png",
                chargeAnimXStart: 0, chargeAnimYStart: 0, chargeAnimW: 95, chargeAnimH: 46, chargeAnimFCount: 2, chargeAnimFDur: 1, chargeScale: 1.5, exp: -1,
                fleeDist: 250, approachDist: 500}
        ];
        /** Sets the maximum allowed projectile/ranged enemies (Since too many will be way too hard/annoying) */
        this.maxRangedEnemies = 3
        /** For use later, when we are changing the max ranged enemies. */
        this.initialMaxRangedEnemies = this.maxRangedEnemies;
        /** Sets the maximum allowed projectile/ranged enemies (Since too many will be way too hard/annoying) */
        this.maxChargerEnemies = 2
        /** For use later, when we are changing the max ranged enemies. */
        this.initialMaxChargerEnemies = this.maxChargerEnemies;

        /** Stores the current wave. First wave is always wave #0. */
        this.currentWave = 0;
        /** How often the wave increments in seconds. */
        this.waveIncrementTime = 30;

        /**
         * An array that stores enemies based on difficulty for Map#1 (Grasslands)
         * Each map is 5 minutes, with each minute representing one wave.
         * Each map can have a range of 0-8 waves (8th wave starting at 4:30 game time).
         */
        this.mapOneEnemies = [
            this.contactEnemyTypes[0],  // Wave 0 (0:00 - 0:30)
            this.contactEnemyTypes[1],  // Wave 1 (0:30 - 1:00)
            this.contactEnemyTypes[2],  // Wave 2 (1:00 - 1:30)
            this.chargerEnemyTypes[0],   // Wave 3 (1:30 - 2:00)
            this.contactEnemyTypes[3],  // Wave 4 (2:00 - 2:30)
            this.contactEnemyTypes[2],  // Wave 5 (2:30 - 3:00)
            this.rangedEnemyTypes[0],  // Wave 6 (3:00 - 3:30)
            this.contactEnemyTypes[3],  // Wave 7 (3:30 - 4:00)
            this.contactEnemyTypes[3]   // Wave 8 (4:00 - 4:30+)
        ];
        /**
         * An array that stores enemies based on difficulty for Map#2 (Cave)
         * Each map is 5 minutes, with each minute representing one wave.
         * Each map can have a range of 0-8 waves (8th wave starting at 4:30 game time).
         */
        this.mapTwoEnemies = [
            this.contactEnemyTypes[0],  // Wave 0 (0:00 - 0:30)
            this.contactEnemyTypes[1],  // Wave 1 (0:30 - 1:00)
            this.contactEnemyTypes[2],  // Wave 2 (1:00 - 1:30)
            this.rangedEnemyTypes[0],   // Wave 3 (1:30 - 2:00)
            this.contactEnemyTypes[3],  // Wave 4 (2:00 - 2:30)
            this.chargerEnemyTypes[0],  // Wave 5 (2:30 - 3:00)
            this.contactEnemyTypes[2],  // Wave 6 (3:00 - 3:30)
            this.contactEnemyTypes[3],  // Wave 7 (3:30 - 4:00)
            this.contactEnemyTypes[3]   // Wave 8 (4:00 - 4:30+)
        ];

        /** This array stores enemies from previous waves for constant spawning. */
        this.passiveEnemySpawns = [];
        /** Tracks what passive enemy to spawn next. */
        this.passiveEnemyIndex = 0;
    }

    /** Called once at the start of the script. */
    start() {
        this.lastSpawnDelayDecreaseTime = this.game.elapsedTime / 1000;
        this.initialized = true;
    }

    /** Called every frame/tick. */
    update() {
        // Call start() if the script has not been initialized yet (avoids bug like game engine not being initialized yet)
        if (!this.initialized) {
            this.start();
        }
        // Do nothing if game is paused
        if (this.game.isGamePaused) return;

        // Update enemy stats based on DIFFICULTY_SCALE
        this.updateEnemyStats();

        // Handle elite spawn timer
        // Check if this.eliteSpawnTimer time has passed since last elite spawn
        if ((this.game.elapsedTime / 60000) - this.lastEliteSpawnTime >= (this.eliteSpawnTimer/60)) {
            this.spawnElite = true;
            this.lastEliteSpawnTime = this.game.elapsedTime / 60000; // Update last trigger time
        }

        // Update the enemy spawn interval (make enemies spawn faster)
        let currentSpawnInterval = this.updateSpawnSettings();

        if (this.game.elapsedTime > 0 && this.game.elapsedTime % currentSpawnInterval < this.game.clockTick * 1000) {
            // Conditions to spawn enemies: no boss, round not over, not in rest area, (this.game.elapsedTime / 1000) - this.lastSpawnTime >= this.baseEnemySpawnInterval
            if (this.game.boss === null && !this.game.roundOver && this.game.currMap !== 0 &&
                this.game.enemies.length < this.currentMaxEnemies &&
                ((this.game.elapsedTime / 1000) - this.lastSpawnTime >= this.baseEnemySpawnInterval)) {
                this.spawnScalingEnemies();
                //console.log("CURR = " + this.game.enemies.length + ", MAX = " + this.currentMaxEnemies);
            }
        }
    }

    /** Call this in updade() to keep enemy stats up to date with latest DIFFICULTY_SCALE value. */
    updateEnemyStats() {

    }


    /** Call this method to spawn enemies of increasing difficulty. */
    spawnScalingEnemies() {
        // Store Wave#
        const waveNumber = Math.min(Math.floor(this.game.elapsedTime / (this.waveIncrementTime * 1000)), 8);
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
            let {x: randomXNumber, y: randomYNumber} = this.game.randomOffscreenCoords();

            // If this is a ranged enemy wave, temporarily double ranged enemies cap
            if (this.mapOneEnemies[Math.min(this.currentWave, this.mapOneEnemies.length - 1)].enemyType === "ranged" && this.maxRangedEnemies === this.initialMaxRangedEnemies) {
                this.maxRangedEnemies *= 2;
            }
            // Otherwise make sure we are at default ranged enemy cap
            else if (this.maxRangedEnemies !== this.initialMaxRangedEnemies) {
                this.maxRangedEnemies = this.initialMaxRangedEnemies;
            }

            // If this is a charger enemy wave, temporarily double charger enemies cap
            if (this.mapOneEnemies[Math.min(this.currentWave, this.mapOneEnemies.length - 1)].enemyType === "charger" && this.maxChargerEnemies === this.initialMaxChargerEnemies) {
                this.maxChargerEnemies *= 2;
            }
            // Otherwise make sure we are at default charger enemy cap
            else if (this.maxChargerEnemies !== this.initialMaxChargerEnemies) {
                this.maxChargerEnemies = this.initialMaxChargerEnemies;
            }

            //console.log("Spawning wave #" + Math.min(this.currentWave, this.mapOneEnemies.length - 1) + " enemies. Name = " + this.mapOneEnemies[Math.min(this.currentWave, this.mapOneEnemies.length - 1)].name);
            this.spawnEnemy(this.mapOneEnemies[Math.min(this.currentWave, this.mapOneEnemies.length - 1)], randomXNumber, randomYNumber);
        } else if (this.game.currMap === 2) {
            // Increment current wave, and move previous enemy to passive spawn array
            if (waveNumber > this.currentWave && this.currentWave !== this.mapTwoEnemies.length - 1) {
                // Add the previous wave's enemy to the passive wave array
                this.passiveEnemySpawns.push(this.mapTwoEnemies[Math.min(this.currentWave, this.mapTwoEnemies.length - 1)]);

                this.currentWave = waveNumber;
            }

            // Generate random off-screen coordinates for spawning
            let {x: randomXNumber, y: randomYNumber} = this.game.randomOffscreenCoords();

            // If this is a ranged enemy wave, temporarily double ranged enemies
            if (this.mapTwoEnemies[Math.min(this.currentWave, this.mapTwoEnemies.length - 1)].enemyType === "ranged" && this.maxRangedEnemies === this.initialMaxRangedEnemies) {
                this.maxRangedEnemies *= 2;
            }
            // Otherwise make sure we are at default ranged enemy cap
            else if (this.maxRangedEnemies !== this.initialMaxRangedEnemies) {
                this.maxRangedEnemies = this.initialMaxRangedEnemies;
            }

            // If this is a charger enemy wave, temporarily double charger enemies cap
            if (this.mapOneEnemies[Math.min(this.currentWave, this.mapOneEnemies.length - 1)].enemyType === "charger" && this.maxChargerEnemies === this.initialMaxChargerEnemies) {
                this.maxChargerEnemies *= 2;
            }
            // Otherwise make sure we are at default charger enemy cap
            else if (this.maxChargerEnemies !== this.initialMaxChargerEnemies) {
                this.maxChargerEnemies = this.initialMaxChargerEnemies;
            }

            //console.log("Spawning wave #" + Math.min(this.currentWave, this.mapTwoEnemies.length - 1) + " enemies. Name = " + this.mapTwoEnemies[Math.min(this.currentWave, this.mapTwoEnemies.length - 1)].name);
            this.spawnEnemy(this.mapTwoEnemies[Math.min(this.currentWave, this.mapTwoEnemies.length - 1)], randomXNumber, randomYNumber);
        }

        // Passive spawning code
        this.triggerPassiveEnemySpawn();
    }

    /** Call this from the spawnScalingEnemy() method to trigger passive enemy spawns. */
    triggerPassiveEnemySpawn() {
        // Only attempt if we have enemies in the passive spawn array
        if (this.passiveEnemySpawns.length > 0) {
            let iterations = 0; // Track the number of iterations to prevent infinite loops

            // Function to check if the spawning condition for the current enemy is met
            const canSpawnEnemyType = (enemyType) => {
                if (enemyType === "ranged") return this.getRangedEnemyCount() < this.maxRangedEnemies;
                if (enemyType === "charger") return this.getChargerEnemyCount() < this.maxChargerEnemies;
                return true; // Always true for enemy types without a max count
            };

            // Loop until we find an enemy that can be spawned
            while (!canSpawnEnemyType(this.passiveEnemySpawns[this.passiveEnemyIndex].enemyType)) {
                // Skip this enemy and try the next one in the array
                this.passiveEnemyIndex += 1;

                // Ensure the index wraps around if it exceeds the array length
                if (this.passiveEnemyIndex >= this.passiveEnemySpawns.length) {
                    this.passiveEnemyIndex = 0;
                }

                // Increment the iterations counter
                iterations += 1;

                // If we've checked all enemies in the passive array, break to avoid an infinite loop
                if (iterations >= this.passiveEnemySpawns.length) {
                    return; // Exit the method if we've looped through the entire array without finding a suitable enemy to spawn
                }
            }

            // Generate random off-screen coordinates for spawning
            let {x: randomXNumber, y: randomYNumber} = this.game.randomOffscreenCoords();

            // Spawn the enemy
            this.spawnEnemy(this.passiveEnemySpawns[this.passiveEnemyIndex], randomXNumber, randomYNumber);

            // Move to the next enemy for the next spawn
            this.passiveEnemyIndex = (this.passiveEnemyIndex + 1) % this.passiveEnemySpawns.length;
        }
    }

    /** Call this to get how many current ranged enemies are spawned in the this.game.enemies[]. */
    getRangedEnemyCount() {
        let count = 0;

        this.game.enemies.forEach(enemy => {
            // Check if the enemy's name matches any in the rangedEnemyTypes array
            if (this.rangedEnemyTypes.some(rangedEnemy => rangedEnemy.name === enemy.name)) {
                count += 1; // Increment count for each match
            }
        });

        return count;
    }

    /** Call this to get how many current ranged enemies are spawned in the this.game.enemies[]. */
    getChargerEnemyCount() {
        let count = 0;

        this.game.enemies.forEach(enemy => {
            // Check if the enemy's name matches any in the rangedEnemyTypes array
            if (this.chargerEnemyTypes.some(chargerEnemy => chargerEnemy.name === enemy.name)) {
                count += 1; // Increment count for each match
            }
        });

        return count;
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
        } else if (enemy.enemyType === "ranged") {
            // If we haven't hit the ranged enemy cap
            if (this.getRangedEnemyCount() < this.maxRangedEnemies) {
                newEnemy = this.game.addEntity(new Enemy_Ranged(enemy.name, enemy.maxHP,
                    enemy.currHP, enemy.atkPow, this.game, worldX, worldY,
                    enemy.boxWidth, enemy.boxHeight, enemy.boxType,
                    enemy.speed, enemy.spritePath, enemy.shootSpritePath, enemy.animXStart,
                    enemy.animYStart, enemy.animW, enemy.animH,
                    enemy.animFCount, enemy.animFDur, enemy.scale, enemy.shootAnimXStart,
                    enemy.shootAnimYStart, enemy.shootAnimW, enemy.shootAnimH,
                    enemy.shootAnimFCount, enemy.shootAnimFDur, enemy.shootScale,
                    enemy.exp, enemy.projectileFreq, enemy.projectileSpeed,
                    enemy.projectileSize, enemy.projectilePulse,
                    enemy.projectileCount, enemy.projectileSpread,
                    enemy.fleeDist, enemy.approachDist));
            }
            // If we hit the ranged enemy cap, try a passive spawn
            else {
                this.triggerPassiveEnemySpawn();
            }
        } else if (enemy.enemyType === "charger") {
            // If we haven't hit the charger enemy cap
            if (this.getChargerEnemyCount() < this.maxChargerEnemies) {
            newEnemy = this.game.addEntity(new Enemy_Charger(enemy.name, enemy.maxHP,
                enemy.currHP, enemy.atkPow, this.game, worldX, worldY,
                enemy.boxWidth, enemy.boxHeight, enemy.boxType,
                enemy.speed, enemy.spritePath, enemy.animXStart,
                enemy.animYStart, enemy.animW, enemy.animH,
                enemy.animFCount, enemy.animFDur, enemy.scale, enemy.chargeSpritePath,
                enemy.chargeAnimXStart, enemy.chargeAnimYStart, enemy.chargeAnimW,
                enemy.chargeAnimH, enemy.chargeAnimFCount, enemy.chargeAnimFDur, enemy.chargeScale,
                enemy.exp, enemy.fleeDist, enemy.approachDist));
            }
            // If we hit the charger enemy cap, try a passive spawn
            else {
                this.triggerPassiveEnemySpawn();
            }
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
        this.lastSpawnTime = this.game.elapsedTime / 1000;

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
        const currentTime = this.game.elapsedTime / 1000;

        // Update the max enemy interval
        this.maxEnemyIntervals = Math.floor(this.game.elapsedTime / (this.maxEnemyIncrementTime * 1000));

        // Calculate the maximum number of enemies based on number of intervals that have passed
        this.currentMaxEnemies = this.baseMaxEnemies * this.maxEnemyIntervals;

        // Update the spawn delay if the this.lowerSpawnDelayInterval has passed since the last time we did this
        if ((currentTime - this.lastSpawnDelayDecreaseTime) >= this.lowerSpawnDelayInterval) {
            //console.log("Lowering spawn delay from " + this.baseEnemySpawnInterval + " to " + (this.baseEnemySpawnInterval * this.spawnDelayDecreaseMultiplier));
            this.baseEnemySpawnInterval *= this.spawnDelayDecreaseMultiplier;
            this.lastSpawnDelayDecreaseTime = currentTime;
        }
        return (this.baseEnemySpawnInterval * 1000);
    }
}