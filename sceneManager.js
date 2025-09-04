// sceneManager.js
const sceneManager = {
    // --- 属性 ---
    storyData: null,
    currentSceneData: null,
    uiElements: {},
    activeButtons: [],
    isNewEnding: false,
    dialogueWriter: null,
    locationPage: 0, 
    currentBGM: null, // 【新增】用于跟踪当前背景音乐

    // CG 动画相关的属性
    cgStartTime: 0,
    cgDuration: 0,
    cgTarget: '',

    // --- 核心函数 ---
    setup: function(story) {
        this.storyData = story;
    },

    load: function(nodeId) {
        this.currentSceneData = this.storyData[nodeId];
        if (!this.currentSceneData) {
            console.error(`错误：找不到节点ID "${nodeId}"！`);
            return;
        }
        
        this.activeButtons = [];
        this.uiElements = {};
        this.dialogueWriter = null;

        if (this.currentSceneData.type !== 'locationSelection') {
            this.locationPage = 0;
        }

        // 【新增】音频处理逻辑
        this.handleAudio(this.currentSceneData);

        switch (this.currentSceneData.type) {
            case 'mainMenu': this.createMainMenu(); break;
            case 'actionSelection': this.createActionSelection(); break;
            case 'locationSelection': this.createLocationSelection(); break;
            case 'ending': this.createEnding(); break;
            case 'achievements': this.createAchievementsPage(); break;
            case 'cgScene': this.createCgScene(); break;
        }
    },

    draw: function() {
        if (!this.currentSceneData) return;

        if (assets.handwritingFont) {
            textFont(assets.handwritingFont);
        }

        if (this.currentSceneData.type === 'ending'|| this.currentSceneData.type === 'cgScene') {
            background(0); 
        } else {
            background(255); 
        }

        switch (this.currentSceneData.type) {
            case 'mainMenu': this.drawMainMenu(); break;
            case 'actionSelection': this.drawActionSelection(); break;
            case 'locationSelection': this.drawLocationSelection(); break;
            case 'ending': this.drawEnding(); break;
            case 'achievements': this.drawAchievementsPage(); break;
            case 'cgScene': this.drawCgScene(); break;
        }

        if (isPaused) {
            this.drawPauseMenu();
        }
        
        if (this.uiElements.pauseButton && this.currentSceneData.type !== 'ending') {
            this.uiElements.pauseButton.display();
        }
    },

    handleMousePress: function() {
        if (isPaused) {
            this.handlePauseMenuClick();
            return; 
        }

        if (this.uiElements.pauseButton && this.uiElements.pauseButton.isMouseOver() && this.currentSceneData.type !== 'ending') {
            isPaused = true;
            return;
        }

        if (this.currentSceneData.type === 'ending') {
            loadScene('loopingCG');
            return;
        }
        if (this.currentSceneData.type === 'achievements') {
            if (this.uiElements.closeButton && this.uiElements.closeButton.isMouseOver()) {
                loadScene(previousGameState);
            }
            return;
        }
        
        if (this.dialogueWriter && !this.dialogueWriter.isFinished) {
            this.dialogueWriter.finish();
            return;
        }

        if (gameState.startsWith('location_select')) {
            if (this.uiElements.leftArrow && this.uiElements.leftArrow.isMouseOver()) {
                if (this.locationPage > 0) {
                    this.locationPage--;
                    this.transitionLocationButtons(true);
                }
                return;
            }
            if (this.uiElements.rightArrow && this.uiElements.rightArrow.isMouseOver()) {
                 if (this.locationPage < Math.ceil(this.currentSceneData.locations.length / 4) - 1) {
                    this.locationPage++;
                    this.transitionLocationButtons(true);
                }
                return;
            }
        }
        
        for (const button of this.activeButtons) {
            if (button.isMouseOver()) {

                if (assets.sfx_click) { // 【新增】播放按钮点击音效
                    assets.sfx_click.play();
                }

                let target = button.targetNode;
                let action = button.action;

                if (gameState.startsWith('location_select')) {
                    if (target) { 
                        this.transitionLocationButtons();
                        setTimeout(() => loadScene(target), 250);
                    }
                    return;
                }

                if (action) this.executeAction(action);
                
                if (button.target_conditional) {
                    target = this.evaluateConditionalTarget(button.target_conditional);
                }

                if (target) {
                    loadScene(target);
                } else {
                    console.log(`动作 '${button.text}' 没有设置目标节点。`);
                }
                return; 
            }
        }
        
        if (this.currentSceneData.target_conditional) {
            if (this.currentSceneData.action) this.executeAction(this.currentSceneData.action);
            let target = this.evaluateConditionalTarget(this.currentSceneData.target_conditional);
            if (target) loadScene(target);
        }
    },
    
    handleMouseWheel: function(event) {
        if (this.currentSceneData.type === 'achievements' && this.uiElements.achievementsList) {
            this.uiElements.achievementsList.handleScroll(event);
        }
    },

    handleAudio: function(sceneData) {
        // 处理背景音乐 (BGM)
        if (sceneData.bgm) {
            const bgmAsset = assets[sceneData.bgm];
            if (bgmAsset) {
                // 如果请求的BGM与当前播放的不同
                if (!this.currentBGM || this.currentBGM.key !== sceneData.bgm) {
                    // 停止当前正在播放的BGM
                    if (this.currentBGM && this.currentBGM.isPlaying()) {
                        this.currentBGM.stop();
                    }
                    // 循环播放新的BGM
                    bgmAsset.loop();
                    this.currentBGM = bgmAsset;
                    this.currentBGM.key = sceneData.bgm; // 附加一个key用于识别
                }
            }
        } else {
            // 如果这个场景没有指定BGM，则停止当前播放的音乐
            if (this.currentBGM && this.currentBGM.isPlaying()) {
                this.currentBGM.stop();
                this.currentBGM = null;
            }
        }

        // 处理一次性音效 (SFX)
        if (sceneData.sfx) {
            const sfxAsset = assets[sceneData.sfx];
            if (sfxAsset) {
                sfxAsset.play();
            }
        }
    },
    
    transitionLocationButtons: function(isPaging = false) {
        this.activeButtons.forEach(btn => btn.fadeOut());
        if (isPaging) {
            setTimeout(() => {
                this.activeButtons = [];
                this.createLocationSelection();
            }, 250);
        }
    },

    createMainMenu: function() {
        this.uiElements.title = "Someday";
        const btnX = width * 0.75;
        const btnW = 220;
        const btnH = 50;
        this.activeButtons = [
            new TextButton(btnX, height * 0.45, btnW, btnH, "Start", false, true),
            new TextButton(btnX, height * 0.60, btnW, btnH, "Achievements", false, true),
        ];
        this.activeButtons[0].targetNode = "start";
        this.activeButtons[1].targetNode = "achievements";
    },

    createActionSelection: function() {
        this.uiElements.pauseButton = new ImageButton(40, 40, 40, 40, assets.ui_pause_normal, assets.ui_pause_hover);
        
        if (this.currentSceneData.dialogue) {
               const dialogueBoxW = width * 0.8; 
               const dialogueBoxH = 120;
               const padding = 25; 
               const dialogueBoxTopLeftX = (width / 2) - (dialogueBoxW / 2);
               const dialogueBoxTopLeftY = (height - dialogueBoxH - 30);
               this.dialogueWriter = new Typewriter(
                   this.currentSceneData.dialogue, 
                   dialogueBoxTopLeftX + padding, 
                   dialogueBoxTopLeftY, 
                   dialogueBoxW - padding * 2, 
                   dialogueBoxH
               );
        }

        if (this.currentSceneData.choices) {
            const btnW = 180;
            const btnX = width - btnW - 40;
            const startY = height / 2 - 50;
            let i = 0;
            this.currentSceneData.choices.forEach((choice) => {
                if (this.evaluateCondition(choice.condition)) {
                    let btn = new TextButton(btnX, startY + i * 45, btnW, 0, choice.text, true);
                    btn.textPadding = 6; // Reduce left padding for tighter text
                    btn.targetNode = choice.target;
                    btn.target_conditional = choice.target_conditional;
                    btn.action = choice.action;
                    this.activeButtons.push(btn);
                    i++;
                }
            });
        }
    },

    createLocationSelection: function() {
        this.uiElements.pauseButton = new ImageButton(40, 40, 40, 40, assets.ui_pause_normal, assets.ui_pause_hover);
        const locations = this.currentSceneData.locations;
        const totalLocations = locations.length;
        const totalPages = Math.ceil(totalLocations / 4);

        if (totalPages > 1) {
            this.uiElements.leftArrow = new ImageButton(60, height / 2, 30, 60, assets.ui_arrow_left_normal, assets.ui_arrow_left_hover);
            this.uiElements.rightArrow = new ImageButton(width - 60, height / 2, 30, 60, assets.ui_arrow_right_normal, assets.ui_arrow_right_hover);
        } else {
            this.uiElements.leftArrow = null;
            this.uiElements.rightArrow = null;
        }

        const startIndex = this.locationPage * 4;
        const endIndex = Math.min(startIndex + 4, totalLocations);
        const locationsToShow = locations.slice(startIndex, endIndex);

        locationsToShow.forEach((loc, index) => {
            let boxW = 300;
            let boxH = 220;
            let gap = 20;
            
            let col = index % 2;
            let row = Math.floor(index / 2);

            let x = (width / 2) - (boxW + gap / 2) + col * (boxW + gap);
            let y = (height / 2) - (boxH + gap / 2) + row * (boxH + gap);
            
            let btn = new TextButton(x, y, boxW, boxH, loc.name, false, false); 
            btn.targetNode = loc.target;
            if (loc.target === null) {
                btn.isClickable = false;
            }
            this.activeButtons.push(btn);
            btn.fadeIn();
        });
    },

    createEnding: function() {
        this.isNewEnding = !unlockedEndings.has(gameState);
        if (this.isNewEnding) {
            unlockedEndings.add(gameState);
        }
        
        if (this.currentSceneData.dialogue) {
            const dialogueBoxW = width * 0.8;
            const dialogueBoxH = 120;
            const padding = 25;
            const dialogueBoxTopLeftX = (width/2) - (dialogueBoxW/2);
            const dialogueBoxTopLeftY = height - dialogueBoxH - 30;
            this.dialogueWriter = new Typewriter(this.currentSceneData.dialogue, dialogueBoxTopLeftX + padding, dialogueBoxTopLeftY, dialogueBoxW - padding*2, dialogueBoxH);
        }
    },

    createAchievementsPage: function() {
        this.uiElements.closeButton = new TextButton(width - 80, 50, 100, 40, "Close", false, true);
        this.uiElements.achievementsList = new AchievementsList(50, 120, width - 100, height - 180, allEndings);
    },

    createCgScene: function() {
    this.cgStartTime = millis();
    this.cgDuration = this.currentSceneData.duration || 3000;
    this.cgTarget = this.currentSceneData.target || 'start';
    },

    drawMainMenu: function() {
        push();
        let placeholderW = (height * 0.8) * (4/3);
        let placeholderH = height * 0.8;
        let placeholderX = 60;
        let placeholderY = height / 2 - placeholderH / 2;
        fill(230); noStroke(); 
        rect(placeholderX, placeholderY, placeholderW, placeholderH);
        
        fill(180); textAlign(CENTER,CENTER); textSize(30);
        text("封面图占位符\n(4:3)", placeholderX + placeholderW/2, placeholderY + placeholderH/2);
        pop();
        
        push();
        textAlign(LEFT, TOP);
        fill(0);
        textSize(64);
        textStyle(BOLD);
        text(this.uiElements.title, 60, 60);
        pop();
        this.activeButtons.forEach(btn => btn.display());
    },

    drawActionSelection: function() {
        push();
        fill(230); noStroke(); rect(0, 0, width, height);
        fill(180); textAlign(CENTER, CENTER); textSize(30);
        text(`背景图片占位符\n( ${this.currentSceneData.background} )`, width/2, height/2);
        pop();
        
        if (this.dialogueWriter && this.dialogueWriter.isFinished || !this.dialogueWriter) {
            this.activeButtons.forEach(btn => btn.display());
        }

        if (this.currentSceneData.dialogue) {
            let dialogueBoxW = width * 0.8;
            let dialogueBoxH = 120;
            push();
            rectMode(CENTER);
            stroke(0);
            strokeWeight(2);
            fill(255, 255, 255, 230); 
            rect(width / 2, height - dialogueBoxH / 2 - 30, dialogueBoxW, dialogueBoxH, 15);
            pop();
            
            if (this.dialogueWriter) {
                this.dialogueWriter.display();
            }
        }
    },

    drawLocationSelection: function() {
        push();
        fill(230); noStroke(); rect(0, 0, width, height);
        pop();
        
        let centerX = width / 2;
        let centerY = height / 2;
        push();
        stroke(0, 0, 0, 50);
        strokeWeight(1);
        line(centerX, 0, centerX, height);
        line(0, centerY, width, centerY);
        pop();

        if (this.uiElements.leftArrow && this.locationPage > 0) {
            this.uiElements.leftArrow.display();
        }
        if (this.uiElements.rightArrow && this.locationPage < Math.ceil(this.currentSceneData.locations.length / 4) - 1) {
            this.uiElements.rightArrow.display();
        }
        
        this.activeButtons.forEach(btn => btn.display());
    },

    drawEnding: function() {
        push();
        fill(50); noStroke(); rect(0, 0, width, height);
        fill(120); textAlign(CENTER, CENTER); textSize(40);
        text(`结局背景图片占位符\n( ${this.currentSceneData.endingImage} )`, width/2, height/2);
        pop();

        push();
        fill(255);
        textAlign(CENTER, TOP);
        textSize(48);
        textStyle(BOLD);
        text(this.currentSceneData.endingTitle, width / 2, 80);
        pop();

        if (this.isNewEnding) {
            push();
            noStroke();
            fill(255, 165, 0);
            rectMode(CENTER);
            textSize(48);
            textStyle(BOLD);
            let titleW = textWidth(this.currentSceneData.endingTitle);
            let newTagX = width/2 + titleW/2 + 60;
            rect(newTagX, 105, 100, 40, 5);
            
            fill(255);
            textSize(24);
            textStyle(BOLD);
            textAlign(CENTER, CENTER);
            text("NEW!", newTagX, 105);
            pop();
        }

        let dialogueBoxW = width * 0.8;
        let dialogueBoxH = 120;
        push();
        rectMode(CENTER);
        fill(40, 40, 40, 220);
        stroke(200);
        strokeWeight(1);
        rect(width / 2, height - dialogueBoxH/2 - 30, dialogueBoxW, dialogueBoxH, 15);
        pop();

        if (this.dialogueWriter) {
            this.dialogueWriter.display(255);
        }

        if (this.dialogueWriter && this.dialogueWriter.isFinished) {
            push();
            fill(200);
            textAlign(CENTER, BOTTOM);
            textSize(14);
            text("Click anywhere to continue...", width / 2, height - 15);
            pop();
        }
    },

    drawAchievementsPage: function() {
        push();
        textAlign(CENTER, TOP);
        fill(0);
        textSize(48);
        text("Achievements", width/2, 40);
        pop();
        if (this.uiElements.achievementsList) {
            this.uiElements.achievementsList.display(unlockedEndings);
        }
        if (this.uiElements.closeButton) {
            this.uiElements.closeButton.display();
        }
    },

    drawPauseMenu: function() {
        push();
        fill(0, 0, 0, 150); 
        noStroke();
        rect(0, 0, width, height);
        pop();

        if (!this.uiElements.pauseMenuButtons) {
            const btnY_start = height/2 - 120;
            this.uiElements.pauseMenuButtons = [
                new TextButton(width / 2, btnY_start, 280, 50, "Continue", false, true),
                new TextButton(width / 2, btnY_start + 80, 280, 50, "Main Menu", false, true),
                new TextButton(width / 2, btnY_start + 160, 280, 50, "Achievements", false, true),
                new TextButton(width / 2, btnY_start + 240, 280, 50, "Let's call it a day", false, true)
            ];
        }
        this.uiElements.pauseMenuButtons.forEach(btn => btn.display());
    },

    drawCgScene: function() {
        let elapsedTime = millis() - this.cgStartTime;
        let progress = min(elapsedTime / this.cgDuration, 1.0); // 将进度限制在0到1之间

        const cgImageKey = this.currentSceneData.image;
        
        // 检查是否存在 image 属性并且该图片已成功加载
        if (cgImageKey && assets[cgImageKey]) {
            const img = assets[cgImageKey]; // 获取图片对象

            // --- 计算图片尺寸以适应屏幕并保持比例 ---
            let imgWidth = img.width;
            let imgHeight = img.height;

            // 计算横向和纵向的适应比例
            let ratioX = width / imgWidth;
            let ratioY = height / imgHeight;

            let scale = min(ratioX, ratioY); // 取较小的比例以确保图片完全可见

            let displayW = imgWidth * scale;
            let displayH = imgHeight * scale;

            // 计算绘制的X和Y坐标，使图片居中
            let displayX = (width - displayW) / 2;
            let displayY = (height - displayH) / 2;

            // --- 绘制图片 ---
            push();
            // 根据进度计算一个简单的淡入透明度 (在CG前半段时间内完成淡入)
            let alpha = map(progress, 0, 0.5, 0, 255, true);
            tint(255, alpha); // 应用透明度

            // 使用计算出的位置和尺寸绘制图片
            image(img, displayX, displayY, displayW, displayH);
            pop();

        } else {
            // --- 如果没有图片，则回退到显示文字 ---
            let textToShow = this.currentSceneData.text || '...';
            // 如果是默认的'...'，则播放点点点动画
            if (textToShow === '...') {
                if (progress > 0.75) textToShow = '...';
                else if (progress > 0.5) textToShow = '..';
                else if (progress > 0.25) textToShow = '.';
                else textToShow = '';
            }
            
            push();
            let alpha = map(progress, 0, 0.5, 0, 255, true);
            fill(255, alpha);
            textAlign(CENTER, CENTER);
            textSize(64);
            text(textToShow, width / 2, height / 2);
            pop();
        }

        // 时间到了，就跳转到目标场景
        if (elapsedTime >= this.cgDuration) {
            loadScene(this.cgTarget);
        }
    },

    handlePauseMenuClick: function() {
        const btns = this.uiElements.pauseMenuButtons;
        if (btns[0].isMouseOver()) { isPaused = false; }
        if (btns[1].isMouseOver()) { isPaused = false; loadScene('mainMenu'); }
        if (btns[2].isMouseOver()) { isPaused = false; previousGameState = gameState; loadScene('achievements'); }
        if (btns[3].isMouseOver()) { isPaused = false; loadScene('ending_eternal_sleep'); }
    },

    executeAction: function(actionString) {
        if (!actionString) return;
        const [command, key, value] = actionString.split(':');
        switch(command) {
            case 'update': gameStatus[key] = (value === 'true'); break;
            case 'increment': gameStatus[key]++; break;
            case 'decrement': gameStatus[key]--; break;
        }
    },

    evaluateCondition: function(conditionString) {
        if (!conditionString) return true;
        const parts = conditionString.split(':');
        const key = parts[0];
        const operator = parts.length === 3 ? parts[1] : '===';
        const valueString = parts.length === 3 ? parts[2] : parts[1];
        let statusValue = gameStatus[key];
        let conditionValue = valueString === 'true' ? true : valueString === 'false' ? false : parseFloat(valueString);
        switch(operator) {
            case '===': return statusValue === conditionValue;
            case '==': return statusValue == conditionValue;
            case '>=': return statusValue >= conditionValue;
            case '<=': return statusValue <= conditionValue;
            case '>': return statusValue > conditionValue;
            case '<': return statusValue < conditionValue;
            default: return true;
        }
    },

    evaluateConditionalTarget: function(conditionals) {
        for (const cond of conditionals) {
            if (cond.condition === 'default' || this.evaluateCondition(cond.condition)) {
                return cond.target;
            }
        }
        return null;
    }
};
