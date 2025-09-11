// Someday.js

// --- 全局变量 ---
let gameState = 'mainMenu';
let previousGameState = 'mainMenu';
let isPaused = false;
let assets = {};
let achievementPopup = null;
let unlockedEndings = new Set();
let isLordCactusPermanentlyDead = false;
let faqUnlocked = false;
let newFaqContent = false;
let faqChatHistory = [];
let faqCurrentStage = 'start';

// 【最终版】初始游戏状态定义
const initialGameStatus = {
    // 系统变量
    unlockedAchievements: new Set(),
    newAchievements: new Set(),
    shopInitialized: false, // 追踪商店当天是否已初始化
    // 环境变量
    time: 'morning',
    shopStock: {}, // 初始为空，将在进入商店时填充
    // 人物本身
    hasPoop: true,
    cleanliness: false,
    money: 100,
    crimeLevel: 0,
    inventory: {},
    hasGun: false,

    // 仙人掌
    lordCactusAlive: true,
    lordCactusBorn: false,
    cactusAlive: true,
    cactusWatered: 0,
    cactusPetted: false,
};

// 当前游戏状态
let gameStatus = {};

// --- 核心 p5.js 函数 ---
function preload() {
    // 您的所有美术、音频、字体资源加载代码都放在这里...
    // (与您现有的文件保持一致即可)
    assets.ui_pause_normal = loadImage('assets/pauseBTN_normal.png');
    assets.ui_pause_hover = loadImage('assets/pauseBTN_hover.png');
    assets.ui_arrow_left_normal = loadImage('assets/left_arrow.png');
    assets.ui_arrow_left_hover = loadImage('assets/left_arrow_hover.png');
    assets.ui_arrow_right_normal = loadImage('assets/right_arrow.png');
    assets.ui_arrow_right_hover = loadImage('assets/right_arrow_hover.png');
    assets.mainMenu_bg = loadImage('assets/gameCover.png');
    assets.inbed_morning = loadImage('assets/sleepMorning.png');
    assets.inbed_noon = loadImage('assets/sleepAfternoon.png');
    assets.inbed_night = loadImage('assets/sleepNight.png');
    assets.insideOptions = loadImage('assets/insideOptions.png');
    assets.scene_bathroom = loadImage('assets/bathroomOptions.png');
    assets.scene_cactus = loadImage('assets/cactusOptions.png');
    assets.scene_window = loadImage('assets/windowOptions.png');
    assets.scene_bed = loadImage('assets/bedOptions.png');
    assets.scene_kitchen = loadImage('assets/kitchenOptions.png');
    assets.scene_desk = loadImage('assets/deskOptions.png');
    assets.scene_door = loadImage('assets/leavehomeOptions.png');
    assets.scene_drowned_cactus = loadImage('assets/cactus_drowned.png');
    assets.ui_close_icon_normal = null;
    assets.ui_close_icon_hover = null;
    assets.item_tnt_image = loadImage('assets/arrows.png');
    assets.item_potion_image = loadImage('assets/arrows.png');
    assets.item_blade_image = loadImage('assets/arrows.png');
    assets.tv_news_normal = createVideo('assets/tv_news_normal.mp4');
    assets.tv_news_crime = createVideo('assets/tv_news_normal.mp4');
    assets.tv_news_normal.hide();
    assets.tv_news_crime.hide();
    assets.ending_eternalSleep = loadImage('assets/Ending1_BedForever.png');
    assets.ending_cactusDrowned = null;
    assets.ending_didntGetUp = loadImage('assets/didntEvenTry.png');
    assets.handwritingFont = loadFont('assets/MRF Lemonberry Sans.otf');
    assets.cg_getUp = loadImage('assets/cg_getup.png');
    assets.water_cactus = loadImage('assets/waterCactus.png');
    assets.pet_cactus = loadImage('assets/petCactus.png');
    assets.cactus_blood_pet_scene = loadImage('assets/lordCactus.png');
    assets.staffNoLove = loadImage('assets/staffnoLove.png');
    // items
    assets.item_tnt_image = loadImage('assets/tnt.png');
    assets.item_potion_image = loadImage('assets/lovepotion.png');
    assets.item_gun_image = loadImage('assets/pistol.png');

    //sounds
    assets.bgm_start = loadSound('assets/sounds/alarm.mp3');
    assets.sfx_loop = null;
    assets.sfx_yawn = loadSound('assets/sounds/yawn.mp3');
    assets.sfx_click = loadSound('assets/sounds/mouseClicked.mp3');
    assets.sfx_cash = loadSound('assets/sounds/cash.mp3');
    assets.sfx_cantpurchase = loadSound('assets/sounds/cantPurchase.mp3');
    assets.sfx_water = loadSound('assets/sounds/waterCactus.mp3');
    assets.sfx_wingFlap = loadSound('assets/sounds/wingFlap.mp3');
    assets.bgm_alarm1 = loadSound('assets/sounds/alarm_morning.mp3');
    assets.bgm_alarm2 = loadSound('assets/sounds/alarm.mp3');
    assets.bgm_breeze = loadSound('assets/sounds/breeze.mp3');
    assets.sfx_storeBell = loadSound('assets/sounds/storeBell.mp3');
    assets.sfx_blanket = loadSound('assets/sounds/blanket.mp3');
    //outside
    assets.scene_storeOutside = loadImage('assets/storeOut.png');
    assets.scene_store_counter = loadImage('assets/store_buy.png');
    assets.scene_store_front = loadImage('assets/store_front.png');
    assets.scene_store_robbery = loadImage('assets/store_rob.png');
    assets.ending_dieUnderStaff = loadImage('assets/ending_dieUnderStaff.png');
    assets.cg_wing = loadImage('assets/cg_wing.png');
    assets.fly_locationOptions = loadImage('assets/fly_location_select.png');
    assets.scene_jumpedOut = loadImage('assets/jumpedOut.png');
    assets.scene_hike = loadImage('assets/hike.png');
    assets.scene_amusement = loadImage('assets/park.png');
    assets.scene_insidePark = loadImage('assets/insidePark.png');
    assets.scene_meetInsectoid = loadImage('assets/meetInsectoid.png');
    assets.ending_Sunset = loadImage('assets/EndingSunset.png');
    assets.ending_toilet = loadImage('assets/toiletseat.png');
}

function setup() {
    createCanvas(960, 720);
    sceneManager.setup(story);
    initializeGameStatus();
    loadScene(gameState);
}

function draw() {
    sceneManager.draw();
}

function mousePressed() {
    sceneManager.handleMousePress();
}

function keyPressed() {
    const currentSceneType = sceneManager.currentSceneData.type;
    const unpausableScenes = ['mainMenu', 'achievements', 'ending', 'cgScene'];
    if (keyCode === ESCAPE && !unpausableScenes.includes(currentSceneType)) {
        isPaused = !isPaused;
        if (isPaused) {
            sceneManager.pauseAllMedia();
        } else {
            sceneManager.resumeAllMedia();
        }
    }
    if (currentSceneType === 'locationSelection' && !isPaused) {
        if (keyCode === LEFT_ARROW) {
            sceneManager.previousLocationPage();
        } else if (keyCode === RIGHT_ARROW) {
            sceneManager.nextLocationPage();
        }
    }
}

function mouseWheel(event) {
    sceneManager.handleMouseWheel(event);
}

function touchStarted() {
    sceneManager.handleMousePress();
    return false;
}

function mouseDragged() {
    sceneManager.handleMouseDrag();
}

function doubleClicked() {
    sceneManager.handleDoubleClick();
}

// --- 辅助函数 ---

// 【新增】一个只在游戏启动时调用一次的初始化函数
function initializeGameStatus() {
    gameStatus = JSON.parse(JSON.stringify(initialGameStatus));
    gameStatus.unlockedAchievements = new Set();
    gameStatus.newAchievements = new Set();
}

// 【最终版】resetGameStatus 函数
function resetGameStatus() {
    console.log("--- RESETTING GAME STATUS FOR NEW LOOP ---");
    
    // 保存需要跨循环保留的状态
    const persistentLordStatus = gameStatus.lordCactusAlive;
    const persistentFaqUnlocked = faqUnlocked;
    const persistentAchievements = gameStatus.unlockedAchievements;

    // 完全重置
    initializeGameStatus();

    // 恢复永久状态
    gameStatus.lordCactusAlive = persistentLordStatus;
    faqUnlocked = persistentFaqUnlocked;
    gameStatus.unlockedAchievements = persistentAchievements;
}

function loadScene(nodeId) {
    gameState = nodeId;
    if (nodeId === 'start') {
        resetGameStatus();
    }
    sceneManager.load(nodeId);
}
