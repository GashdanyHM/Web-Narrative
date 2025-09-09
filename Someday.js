// Someday.js

// --- 全局变量 ---
let gameState = 'mainMenu';
let previousGameState = 'mainMenu';
let isPaused = false;
let assets = {};
let achievementPopup = null;
let unlockedEndings = new Set();
let isLordCactusPermanentlyDead = false;

let faqUnlocked = false;        // FAQ功能是否已解锁
let newFaqContent = false;      // FAQ是否有新内容 (用于感叹号)
let faqChatHistory = [];        // 存储FAQ聊天记录
let faqCurrentStage = 'start';  // 追踪当前对话进展

// 【新增】定义初始游戏状态，方便重置
const initialGameStatus = {
    // 系统变量
    unlockedAchievements: new Set(),
    newAchievements: new Set(),
    // 环境变量
    time: 'morning',
    shopStock: {},
    // 人物本身
    hasPoop: true,
    cleanliness: false,
    money: 100,
    crimeLevel: 0,
    inventory: {},
    // 仙人掌
    lordCactusAlive: true, // 这是唯一的、真正的状态记录
    lordCactusBorn: false, // 【新增】这个变量在你的版本里漏掉了
    cactusAlive: true,
    cactusWatered: 0,
    cactusPetted: false,
};

// 当前游戏状态
let gameStatus = { ...initialGameStatus };

// --- 核心 p5.js 函数 ---
function preload() {
    // 【您的美术资源加载区】
    // 命名规则建议: [类别]_[具体内容]_[状态].png

    // --- 1. UI 资源 ---
    assets.ui_pause_normal = loadImage('assets/pauseBTN_normal.png');
    assets.ui_pause_hover = loadImage('assets/pauseBTN_hover.png');
    assets.ui_arrow_left_normal = loadImage('assets/left_arrow.png');
    assets.ui_arrow_left_hover = loadImage('assets/left_arrow_hover.png');
    assets.ui_arrow_right_normal = loadImage('assets/right_arrow.png');
    assets.ui_arrow_right_hover = loadImage('assets/right_arrow_hover.png');

    // --- 2. 主菜单资源 ---
    assets.mainMenu_bg = loadImage('assets/gameCover.png');

    // --- 3. 游戏场景背景 ---
    //睡觉
    assets.inbed_morning = loadImage('assets/sleepMorning.png');
    assets.inbed_noon = loadImage('assets/sleepAfternoon.png');
    assets.inbed_night = loadImage('assets/sleepNight.png');
    //起床选室内地点
    assets.insideOptions = loadImage('assets/insideOptions.png');
    //室内地点
    assets.scene_bathroom = loadImage('assets/bathroomOptions.png');
    assets.scene_cactus = loadImage('assets/cactusOptions.png');
    assets.scene_window = loadImage('assets/windowOptions.png');
    assets.scene_bed = loadImage('assets/bedOptions.png');
    assets.scene_kitchen = loadImage('assets/kitchenOptions.png');
    assets.scene_desk = loadImage('assets/deskOptions.png');
    assets.scene_door = loadImage('assets/leavehomeOptions.png');
    //仙人掌
    assets.scene_drowned_cactus = loadImage('assets/cactus_drowned.png');
    // 加载商店UI和商品图标
    assets.ui_close_icon_normal = null; // loadImage('assets/close_icon_normal.png');
    assets.ui_close_icon_hover = null;  // loadImage('assets/close_icon_hover.png');
    assets.item_tnt_image = loadImage('assets/arrows.png');
    assets.item_potion_image = loadImage('assets/arrows.png');
    assets.item_blade_image = loadImage('assets/arrows.png');
    // 加载商店内电视新闻视频
    // 注意：视频文件名需要和你自己的文件名匹配
    assets.tv_news_normal = createVideo('assets/tv_news_normal.mp4');
    assets.tv_news_crime = createVideo('assets/tv_news_normal.mp4');
    // 加载后立即隐藏，因为我们会在画布上手动绘制它们
    assets.tv_news_normal.hide();
    assets.tv_news_crime.hide();
    
    // --- 4. 结局插画 ---
    assets.ending_eternalSleep = loadImage('assets/Ending1_BedForever.png');
    assets.ending_cactusDrowned = null; // loadImage('assets/ending_cactusDrowned.png');
    assets.ending_didntGetUp = null; // loadImage('assets/ending_didntGetUp.png');

    // --- 5. 字体 (可选) ---
    // 【修正】恢复字体加载
    assets.handwritingFont = loadFont('assets/MRF Lemonberry Sans.otf');

    // --- 6. 音频资源 (新增) ---
    // 假设的音频文件名，请替换为您自己的文件名
    assets.bgm_start = null; //loadSound('assets/sfx/calm_theme.mp3');
    assets.sfx_loop = null; //loadSound('assets/sfx/time_loop.wav');
    assets.sfx_click = loadSound('assets/sounds/mouseClicked.mp3'); // 用于按钮点击音效
    assets.sfx_cash = loadSound('assets/sounds/cash.mp3'); // 用于购买物品音效
    assets.sfx_cantpurchase = loadSound('assets/sounds/cantPurchase.mp3'); // 用于无法购买音效
    assets.sfx_water = loadSound('assets/sounds/waterCactus.mp3'); // 用于浇水仙人掌音效

    // --- 7. CG ---
    assets.cg_getUp = loadImage('assets/cg_getup.png');
}

function setup() {
    createCanvas(960, 720);
    sceneManager.setup(story);
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

    // 2. resetGameStatus 函数
    function resetGameStatus() {
        console.log("--- RESETTING GAME STATUS FOR NEW LOOP ---");
        
        // 我们不再需要在这里手动保存和恢复 lordCactusAlive 的状态
        const persistentFaqUnlocked = typeof faqUnlocked !== 'undefined' ? faqUnlocked : false;

        gameStatus = JSON.parse(JSON.stringify(initialGameStatus));
        gameStatus.unlockedAchievements = new Set();
        gameStatus.newAchievements = new Set();
        
        // 【核心修正】在新的一天开始时，根据“永久命运”来设定当天的状态
        gameStatus.lordCactusAlive = !isLordCactusPermanentlyDead;
        
        faqUnlocked = persistentFaqUnlocked;
    }

function loadScene(nodeId) {
    gameState = nodeId;
    // 【核心改动】如果下一个场景是 'start'，则重置游戏状态
    if (nodeId === 'start') {
        resetGameStatus();
    }
    sceneManager.load(nodeId);
}
