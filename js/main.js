const gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./sprites/map_grasslands.png");
ASSET_MANAGER.queueDownload("./sprites/map_stone_background.png");
ASSET_MANAGER.queueDownload("./sprites/map_space_background.png");
ASSET_MANAGER.queueDownload("./sprites/map_space_background2.gif");
ASSET_MANAGER.queueDownload("./sprites/map_cave_background.png");
ASSET_MANAGER.queueDownload("./sprites/map_cave_background2.png");
ASSET_MANAGER.queueDownload("./sprites/portal.png");
ASSET_MANAGER.queueDownload("./sprites/portal_white.png");
ASSET_MANAGER.queueDownload("./sprites/grass.png");
ASSET_MANAGER.queueDownload("./sprites/map_rock_object.png");
ASSET_MANAGER.queueDownload("./sprites/map_rock_object_black.png");
ASSET_MANAGER.queueDownload("./sprites/exp_orb.png");
ASSET_MANAGER.queueDownload("./sprites/arrow.png");
ASSET_MANAGER.queueDownload("./sprites/scythe_attack_slash.png");
ASSET_MANAGER.queueDownload("./sprites/weapon_scythe_primaryattack.png");
ASSET_MANAGER.queueDownload("./sprites/weapon_scythe_secondaryattack.png");
ASSET_MANAGER.queueDownload("./sprites/scythe.png");
ASSET_MANAGER.queueDownload("./sprites/weapon_scythe.png");
ASSET_MANAGER.queueDownload("./sprites/weapon_blood_scythe.png");
ASSET_MANAGER.queueDownload("./sprites/Tome.png");
ASSET_MANAGER.queueDownload("./sprites/NecromancyStaff.png");
ASSET_MANAGER.queueDownload("./sprites/map_rest_area.png");
ASSET_MANAGER.queueDownload("./sprites/object_treasure_chest.png");
ASSET_MANAGER.queueDownload("./sprites/object_treasure_chest_gold.png");
ASSET_MANAGER.queueDownload("./sprites/object_tombstone.png");
ASSET_MANAGER.queueDownload("./sprites/object_coin_bag.png");
ASSET_MANAGER.queueDownload("./sprites/object_coin.png");
ASSET_MANAGER.queueDownload("./sprites/attack_targeting.png");
ASSET_MANAGER.queueDownload("./sprites/object_wall_debris.png");
ASSET_MANAGER.queueDownload("./sprites/object_wall_debris2.png");
ASSET_MANAGER.queueDownload("./sprites/object_pillar_debris.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_dual_blade.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_blood_scythe.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_blood_scythe(dual).png");
ASSET_MANAGER.queueDownload("./sprites/weapon_blood_scythe_dual.png");
ASSET_MANAGER.queueDownload("./sprites/weapon_scythe_dual.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_dual_blade(blood).png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_piercing.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_scythe.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_tome.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_staff.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_dash_cooldown.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_health_regen.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_max_health.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_movement_speed.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_projectile_speed.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_attack_damage.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_pickup_range.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_dash_distance.png");
ASSET_MANAGER.queueDownload("./sprites/weapon_blood_scythe_primaryattack.png");
ASSET_MANAGER.queueDownload("./sprites/weapon_blood_scythe_secondaryattack.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_exp_gain.png");
ASSET_MANAGER.queueDownload("./sprites/MagicBall.png");
ASSET_MANAGER.queueDownload("./sprites/MagicBall_red.png");
ASSET_MANAGER.queueDownload("./sprites/ElectricOrb.png");
ASSET_MANAGER.queueDownload("./sprites/ElectricOrb_red.png");
ASSET_MANAGER.queueDownload("./sprites/ElectricOrb_purple.png");
ASSET_MANAGER.queueDownload("./sprites/transparent.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_generic.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_special.png");
ASSET_MANAGER.queueDownload("./sprites/object_anvil.png");
ASSET_MANAGER.queueDownload("./sprites/wizard_walk.png");
ASSET_MANAGER.queueDownload("./sprites/wizard_walk_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/wizard_shooting.png");
ASSET_MANAGER.queueDownload("./sprites/wizard_shooting_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/boar_walk_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/boar_walk.png");
ASSET_MANAGER.queueDownload("./sprites/boar_charge.png");
ASSET_MANAGER.queueDownload("./sprites/boar_charge_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/god_idle.png");
ASSET_MANAGER.queueDownload("./sprites/god_idle_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/god_walk.png");
ASSET_MANAGER.queueDownload("./sprites/god_walk_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/god_wings.png");
ASSET_MANAGER.queueDownload("./sprites/god_wings_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/god_wings_broken.png");
ASSET_MANAGER.queueDownload("./sprites/god_wings_broken_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/god_eye.png");
ASSET_MANAGER.queueDownload("./sprites/god_fall.png");
ASSET_MANAGER.queueDownload("./sprites/god_fall_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/god_fallen_idle.png");
ASSET_MANAGER.queueDownload("./sprites/god_fallen_idle_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/god_fallen_walk.png");
ASSET_MANAGER.queueDownload("./sprites/god_fallen_walk_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_crit_chance.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_crit_damage.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_tomb_chance.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_gold_gain.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_summon_health.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_summon_damage.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_summon_speed.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_summon_ranged.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_summon_explode.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_summon_empower.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_staff_fire.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_corpse_explosion.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_tome_bounce.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_tome_doubletime.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_tome_doubleshot.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_tome_expansion.png");
ASSET_MANAGER.queueDownload("./sprites/hazard_fire.png");
ASSET_MANAGER.queueDownload("./sprites/heart.png");
ASSET_MANAGER.queueDownload("./sprites/charger_horse_walk.png"); //128x96
ASSET_MANAGER.queueDownload("./sprites/charger_horse_walk_DAMAGED.png"); //128x96
ASSET_MANAGER.queueDownload("./sprites/charger_horse_charge.png"); //144x96
ASSET_MANAGER.queueDownload("./sprites/charger_horse_charge_DAMAGED.png"); //144x96
ASSET_MANAGER.queueDownload("./sprites/charger_hound_walk.png"); //67x32
ASSET_MANAGER.queueDownload("./sprites/charger_hound_walk_DAMAGED.png"); //67x32
ASSET_MANAGER.queueDownload("./sprites/charger_hound_charge.png"); //67x32
ASSET_MANAGER.queueDownload("./sprites/charger_hound_charge_DAMAGED.png"); //67x32
ASSET_MANAGER.queueDownload("./sprites/charger_doom_walk.png");
ASSET_MANAGER.queueDownload("./sprites/charger_doom_walk_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/charger_doom_charge.png");
ASSET_MANAGER.queueDownload("./sprites/charger_doom_charge_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/ranged_necro_walk.png");
ASSET_MANAGER.queueDownload("./sprites/ranged_necro_walk_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/ranged_necro_shoot.png");
ASSET_MANAGER.queueDownload("./sprites/ranged_necro_shoot_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/ranged_legal_walk.png");
ASSET_MANAGER.queueDownload("./sprites/ranged_legal_walk_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/ranged_legal_shoot.png");
ASSET_MANAGER.queueDownload("./sprites/ranged_legal_shoot_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/smoke.png");
ASSET_MANAGER.queueDownload("./sprites/you_died_screen.png");
ASSET_MANAGER.queueDownload("./sprites/you_won_screen1.png");
ASSET_MANAGER.queueDownload("./sprites/you_won_screen2.png");
ASSET_MANAGER.queueDownload("./sprites/Orby.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_glorious_moon.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_divine_dash.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_extra_life.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_smoke_bomb.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_smaller_player.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_singularity.png");
ASSET_MANAGER.queueDownload("./sprites/run_stats_menu.png");
ASSET_MANAGER.queueDownload("./sprites/meteor.png");

//ui
ASSET_MANAGER.queueDownload("./sprites/debug_marker.png");
ASSET_MANAGER.queueDownload("./sprites/debug_warning.png");
ASSET_MANAGER.queueDownload("./sprites/menu_player_upgrade.png");
ASSET_MANAGER.queueDownload("./sprites/menu_weapon_upgrade_withclosebutton.png");
ASSET_MANAGER.queueDownload("./sprites/menu_weapon_upgrade.png");
ASSET_MANAGER.queueDownload("./sprites/menu_weapon_upgrade_6options.png");
ASSET_MANAGER.queueDownload("./sprites/menu_weapon_upgrade_2options.png");
ASSET_MANAGER.queueDownload("./sprites/menu_player_stats.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_size.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_reduce_cd.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_knockback.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_bleeding_edge.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_crippling_chill.png");
ASSET_MANAGER.queueDownload("./sprites/upgrade_echo_slash.png");
ASSET_MANAGER.queueDownload("./sprites/menu_currency_bar.png");
ASSET_MANAGER.queueDownload("./sprites/arrow_pointer.png");
ASSET_MANAGER.queueDownload("./sprites/arrow_pointer_blue.png");
ASSET_MANAGER.queueDownload("./sprites/map_cave.png");

//player
ASSET_MANAGER.queueDownload("./sprites/McIdle.png");
ASSET_MANAGER.queueDownload("./sprites/McIdle_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/McWalk.png");
ASSET_MANAGER.queueDownload("./sprites/McWalk_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/McDead.png");
ASSET_MANAGER.queueDownload("./sprites/McDead_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/McDash.png");
ASSET_MANAGER.queueDownload("./sprites/McDash_DAMAGED.png");

ASSET_MANAGER.queueDownload("./sprites/McIdle_reflection.png");
ASSET_MANAGER.queueDownload("./sprites/McIdle_reflection_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/McWalk_reflection.png");
ASSET_MANAGER.queueDownload("./sprites/McWalk_reflection_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/McDash_reflection.png");
ASSET_MANAGER.queueDownload("./sprites/McDash_reflection_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/reflective_pane.png");

//allies
ASSET_MANAGER.queueDownload("./sprites/Ally_Contact_Walk.png");
ASSET_MANAGER.queueDownload("./sprites/Ally_Contact_Walk_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/Ally_Ranged_Walk.png");
ASSET_MANAGER.queueDownload("./sprites/Ally_Ranged_Walk_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/Ally_Charge_Walk.png");
ASSET_MANAGER.queueDownload("./sprites/Ally_Charge_Walk_DAMAGED.png");

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
ASSET_MANAGER.queueDownload("./sprites/skeleton.png");
ASSET_MANAGER.queueDownload("./sprites/skeleton_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/wizard.png");
ASSET_MANAGER.queueDownload("./sprites/wizard_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/boss_dragon_walk.png");
ASSET_MANAGER.queueDownload("./sprites/boss_dragon_roar.png");
ASSET_MANAGER.queueDownload("./sprites/boss_dragon_walk_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/boss_dragon_roar_DAMAGED.png");
ASSET_MANAGER.queueDownload("./sprites/fireball.png");

//sounds
ASSET_MANAGER.queueDownload("./sounds/SE_scythe_primary.mp3");
ASSET_MANAGER.queueDownload("./sounds/SE_scythe_secondary.mp3");
ASSET_MANAGER.queueDownload("./sounds/SE_tome_primary.mp3");
ASSET_MANAGER.queueDownload("./sounds/SE_tome_secondary.mp3");
ASSET_MANAGER.queueDownload("./sounds/SE_staff_primary.mp3");
ASSET_MANAGER.queueDownload("./sounds/SE_staff_secondary.mp3");
ASSET_MANAGER.queueDownload("./sounds/fireball.mp3");
ASSET_MANAGER.queueDownload("./sounds/Coin_Pickup1.mp3");
ASSET_MANAGER.queueDownload("./sounds/Coin_Pickup2.mp3");
ASSET_MANAGER.queueDownload("./sounds/Coin_Pickup3.mp3");
ASSET_MANAGER.queueDownload("./sounds/dragon_roar.mp3");
ASSET_MANAGER.queueDownload("./sounds/dash.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp5.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp10.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp15.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp20.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp25.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp30.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp35.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp40.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp45.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp50.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp55.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp60.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp65.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp70.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp75.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp80.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp85.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp90.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp95.mp3");
ASSET_MANAGER.queueDownload("./sounds/collect_exp100.mp3");
ASSET_MANAGER.queueDownload("./sounds/levelup.mp3");
ASSET_MANAGER.queueDownload("./sounds/anvil.mp3");
ASSET_MANAGER.queueDownload("./sounds/upgrade_popup.mp3");
ASSET_MANAGER.queueDownload("./sounds/spend_gold.mp3");
ASSET_MANAGER.queueDownload("./sounds/music_nameless_song.mp3");
ASSET_MANAGER.queueDownload("./sounds/hit.mp3");
ASSET_MANAGER.queueDownload("./sounds/hit2.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_ground_slam.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_explosion.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_laser_charging.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_laser_beaming.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_gore.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_summon.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_hurt_yell.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_creature_sound1.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_creature_sound2.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_creature_sound3.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_creature_sound4.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_creature_sound5.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_creature_sound6.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_creature_sound7.mp3");
ASSET_MANAGER.queueDownload("./sounds/boss_creature_sound8.mp3");
ASSET_MANAGER.queueDownload("./sounds/music_majula.mp3");
ASSET_MANAGER.queueDownload("./sounds/music_firelink.mp3");
ASSET_MANAGER.queueDownload("./sounds/music_malenia.mp3");
ASSET_MANAGER.queueDownload("./sounds/music_capra.mp3");
ASSET_MANAGER.queueDownload("./sounds/music_erdtree_knights.mp3");
ASSET_MANAGER.queueDownload("./sounds/music_dragonlord.mp3");
ASSET_MANAGER.queueDownload("./sounds/healing_heart.mp3");
ASSET_MANAGER.queueDownload("./sounds/music_ave_maria.mp3");
ASSET_MANAGER.queueDownload("./sounds/portal.mp3");

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
