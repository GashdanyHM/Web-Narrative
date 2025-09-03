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

        switch (this.currentSceneData.type) {
            case 'mainMenu': this.createMainMenu(); break;
            case 'actionSelection': this.createActionSelection(); break;
            case 'locationSelection': this.createLocationSelection(); break;
            case 'ending': this.createEnding(); break;
            case 'achievements': this.createAchievementsPage(); break;
            case 'loopingCG': this.createLoopingCG(); break;
        }
    },

    draw: function() {
        if (!this.currentSceneData) return;

        if (assets.handwritingFont) {
            textFont(assets.handwritingFont);
        }

        if (this.currentSceneData.type === 'ending'|| this.currentSceneData.type === 'loopingCG') {
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
            case 'loopingCG': this.drawLoopingCG(); break;
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

        // 【核心改动】在结局页面点击后，跳转到 loopingCG
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
           const dialogueBoxW = width * 0.6;
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

    createLoopingCG: function() {
        this.cgStartTime = millis(); // 记录 CG 开始的时间
        this.cgDuration = this.currentSceneData.duration || 1500;
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
            let dialogueBoxW = width * 0.6;
            let dialogueBoxH = 120;
            push();
            rectMode(CENTER);
            stroke(200);
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

    // 【新增】绘制 loopingCG 场景的函数
    drawLoopingCG: function() {
        let elapsedTime = millis() - this.cgStartTime;
        let progress = elapsedTime / this.cgDuration;

        // 根据时间进度显示省略号
        let dots = '';
        if (progress > 0.25) dots = '.';
        if (progress > 0.5) dots = '..';
        if (progress > 0.75) dots = '...';
        
        push();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(64);
        text(dots, width / 2, height / 2);
        pop();

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

