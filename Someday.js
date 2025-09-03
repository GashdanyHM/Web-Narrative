// Someday.js

// --- 全局变量 ---
let gameState = 'mainMenu';
let previousGameState = 'mainMenu';
let isPaused = false;
let assets = {};
let unlockedEndings = new Set();

// 【新增】定义初始游戏状态，方便重置
const initialGameStatus = {
    hasPoop: true,
    cleanliness: false,
    cactusAlive: true,
    cactusLife: 0,
    cactusDrowned: false
};

// 当前游戏状态
let gameStatus = { ...initialGameStatus };

// --- 核心 p5.js 函数 ---
function preload() {
    // 【您的美术资源加载区】
    // 命名规则建议: [类别]_[具体内容]_[状态].png

    // --- 1. UI 资源 ---
    assets.ui_pause_normal = null; // loadImage('assets/ui_pause_normal.png');
    assets.ui_pause_hover = null; // loadImage('assets/ui_pause_hover.png');
    assets.ui_arrow_left_normal = null; // loadImage('assets/ui_arrow_left_normal.png');
    assets.ui_arrow_left_hover = null; // loadImage('assets/ui_arrow_left_hover.png');
    assets.ui_arrow_right_normal = null; // loadImage('assets/ui_arrow_right_normal.png');
    assets.ui_arrow_right_hover = null; // loadImage('assets/ui_arrow_right_hover.png');

    // --- 2. 主菜单资源 ---
    assets.mainMenu_bg = null; // loadImage('assets/mainMenu_bg.png');

    // --- 3. 游戏场景背景 ---
    assets.scene_bedroom_morning = null; // loadImage('assets/scene_bedroom_morning.png');
    assets.scene_bedroom_midday = null; // loadImage('assets/scene_bedroom_midday.png');
    assets.scene_bedroom_night = null; // loadImage('assets/scene_bedroom_night.png');
    assets.scene_bathroom = null; // loadImage('assets/scene_bathroom.png');
    assets.scene_cactus = null; // loadImage('assets/scene_cactus.png');
    assets.scene_window = null; // loadImage('assets/scene_window.png');
    
    // --- 4. 结局插画 ---
    assets.ending_eternalSleep = null; // loadImage('assets/ending_eternalSleep.png');
    assets.ending_ohShit = null; // loadImage('assets/ending_ohShit.png');
    assets.ending_cactusDrowned = null; // loadImage('assets/ending_cactusDrowned.png');
    assets.ending_tooBad = null; // loadImage('assets/ending_tooBad.png');
    assets.ending_didntGetUp = null; // loadImage('assets/ending_didntGetUp.png');

    // --- 5. 字体 (可选) ---
    // 【修正】恢复字体加载
    assets.handwritingFont = loadFont('assets/Moon Flower Bold.ttf');
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
    if (keyCode === ESCAPE && sceneManager.currentSceneData.type !== 'ending') {
        isPaused = !isPaused;
    }
}

function mouseWheel(event) {
    sceneManager.handleMouseWheel(event);
}

// --- 辅助函数 ---

// 【新增】重置游戏状态的函数
function resetGameStatus() {
    console.log("--- RESETTING GAME STATUS FOR NEW LOOP ---");
    gameStatus = { ...initialGameStatus };
}

function loadScene(nodeId) {
    gameState = nodeId;
    // 【核心改动】如果下一个场景是 'start'，则重置游戏状态
    if (nodeId === 'start') {
        resetGameStatus();
    }
    sceneManager.load(nodeId);
}
