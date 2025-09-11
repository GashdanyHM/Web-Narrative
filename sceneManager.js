// sceneManager.js
const sceneManager = {
    // --- 属性 ---
    storyData: null,
    currentSceneData: null,
    uiElements: {},
    activeButtons: [],
    isNewEnding: false,
    dialogueWriter: null,
    dialogueIndex: 0,
    currentSpeaker: null,
    locationPage: 0, 
    currentBGM: null, 
    sceneLoadTime: 0,
    cgStartTime: 0,
    cgDuration: 0,
    cgTarget: '',
    activeShopItems: [],
    shopScrollX: 0,
    maxShopScroll: 0,
    currentVideo: null,

    // --- 核心函数 ---
    setup: function(story) {
        this.storyData = story;
    },

    load: function(nodeId) {
        if (this.currentVideo) {
            this.currentVideo.stop();
            this.currentVideo.remove();
            this.currentVideo = null;
        }
        console.log(`%c--- LOADING SCENE: "${nodeId}" ---`, 'color: blue; font-weight: bold;');
        this.sceneLoadTime = millis();
        this.currentSceneData = this.storyData[nodeId];
        if (!this.currentSceneData) {
            console.error(`错误：找不到节点ID "${nodeId}"！`);
            return;
        }
        if (this.currentSceneData.type === 'locationSelection') {
            this.locationPage = 0;
        }
        this.activeButtons = [];
        this.uiElements = {};
        this.dialogueWriter = null;
        this.dialogueIndex = 0;
        this.currentSpeaker = null;
        this.handleAudio(this.currentSceneData);

        switch (this.currentSceneData.type) {
            case 'mainMenu': this.createMainMenu(); break;
            case 'actionSelection': this.createActionSelection(); break;
            case 'locationSelection': this.createLocationSelection(); break;
            case 'ending': this.createEnding(); break;
            case 'achievements': this.createAchievementsPage(); break;
            case 'cgScene': this.createCgScene(); break;
            case 'shopScene': this.createShopScene(); break;
            case 'chatScene': this.createChatScene(); break;
        }

        const node = this.currentSceneData;
        const isLogicGate = node.type === 'actionSelection' && (node.target_conditional || node.target) && !node.choices && !node.dialogue;
        if (isLogicGate) {
            console.log(`[LOGIC GATE] 检测到逻辑节点 "${nodeId}"，立即执行判断...`);
            if (node.action) {
                this.executeAction(node.action);
            }
            let target = null;
            if (node.target_conditional) {
                target = this.evaluateConditionalTarget(node.target_conditional);
            } else if (node.target) {
                target = node.target;
            }
            if (target) {
                this.load(target);
            }
        }
    },

    draw: function() {
        if (!this.currentSceneData) return;
        if (assets.handwritingFont) {
            textFont(assets.handwritingFont);
        }
        background(this.currentSceneData.type === 'ending' || this.currentSceneData.type === 'cgScene' ? 0 : 255);

        switch (this.currentSceneData.type) {
            case 'mainMenu': this.drawMainMenu(); break;
            case 'actionSelection': this.drawActionSelection(); break;
            case 'locationSelection': this.drawLocationSelection(); break;
            case 'ending': this.drawEnding(); break;
            case 'achievements': this.drawAchievementsPage(); break;
            case 'cgScene': this.drawCgScene(); break;
            case 'shopScene': this.drawShopScene(); break;
            case 'chatScene': this.drawChatScene(); break;
        }

        if (isPaused) {
            this.drawPauseMenu();
        }
        if (this.uiElements.pauseButton && this.currentSceneData.type !== 'ending') {
            this.uiElements.pauseButton.display();
            if (gameStatus.newAchievements.size > 0 || newFaqContent) {
                push();
                fill(255, 0, 0); noStroke();
                ellipse(this.uiElements.pauseButton.x + this.uiElements.pauseButton.w - 5, this.uiElements.pauseButton.y + 5, 15, 15);
                fill(255); textAlign(CENTER, CENTER); textSize(12); text('!', this.uiElements.pauseButton.x + this.uiElements.pauseButton.w - 5, this.uiElements.pauseButton.y + 6);
                pop();
            }
        }
        if (achievementPopup) {
            achievementPopup.display();
        }
    },

        handleMousePress: function() {
        // 【核心修正】将暂停状态的处理作为最高优先级
        // 如果游戏已暂停，则只处理暂停菜单的点击，然后立即退出函数
        if (isPaused) {
            this.handlePauseMenuClick();
            return;
        }

        // --- 如果游戏未暂停，则按以下顺序处理 ---

        // 1. 检查是否点击了“暂停”按钮
        if (this.uiElements.pauseButton && this.uiElements.pauseButton.isMouseOver() && this.currentSceneData.type !== 'ending') {
            isPaused = true;
            this.pauseAllMedia();
            return; // 暂停后，立即退出，等待下一次点击
        }
        
        // 2. 场景专属的点击处理 (这部分代码只有在游戏非暂停时才会执行)
        switch(this.currentSceneData.type) {
            case 'shopScene':
                if (this.uiElements.closeButton && this.uiElements.closeButton.isMouseOver()) {
                    loadScene(this.currentSceneData.target_on_close);
                }
                return;
            case 'chatScene':
                this.handleChatSceneClick();
                return;
            case 'ending':
                loadScene('loopingCG');
                return;
            case 'achievements':
                if (this.uiElements.closeButton && this.uiElements.closeButton.isMouseOver()) {
                    loadScene(previousGameState);
                }
                return;
        }

        // --- 3. 常规流程：处理默认的交互逻辑 ---

        // a. 如果打字机正在打字，则立即完成
        if (this.dialogueWriter && !this.dialogueWriter.isFinished) {
            this.dialogueWriter.finish();
            return;
        }

        // b. 如果是多行对话，则推进到下一句
        if (this.currentSceneData.dialogue && Array.isArray(this.currentSceneData.dialogue)) {
            if (this.dialogueIndex < this.currentSceneData.dialogue.length - 1) {
                console.log(`[EVENT] Advancing dialogue...`);
                this.dialogueIndex++;
                let nextText = '';
                const dialogueData = this.currentSceneData.dialogue;
                if (typeof dialogueData[this.dialogueIndex] === 'object') {
                    const nextDialogue = dialogueData[this.dialogueIndex];
                    this.currentSpeaker = nextDialogue.speaker;
                    nextText = nextDialogue.line;
                } else {
                    this.currentSpeaker = null;
                    nextText = dialogueData[this.dialogueIndex];
                }

                const dialogueBoxW = width * 0.8;
                const dialogueBoxH = 120;
                const padding = 25;
                const dialogueBoxTopLeftX = (width / 2) - (dialogueBoxW / 2);
                const dialogueBoxTopLeftY = (height - dialogueBoxH - 30);
                this.dialogueWriter = new Typewriter(nextText, dialogueBoxTopLeftX + padding, dialogueBoxTopLeftY, dialogueBoxW - padding * 2, dialogueBoxH);
                
                return; // 推进对话后，结束本次点击事件
            }
        }

        // c. 处理所有按钮的点击（包括地点选择的箭头）
        if (this.currentSceneData.type === 'locationSelection') {
            if (this.uiElements.leftArrow && this.uiElements.leftArrow.isMouseOver()) {
                this.previousLocationPage();
                return;
            }
            if (this.uiElements.rightArrow && this.uiElements.rightArrow.isMouseOver()) {
                this.nextLocationPage(); 
                return;
            }
        }
        
        for (const button of this.activeButtons) {
            if (button.isMouseOver()) {
                console.log(`%c[EVENT] Button clicked: "${button.text || button.name}"`, 'color: green;');
                if (assets.sfx_click) assets.sfx_click.play();

                let target = button.targetNode;
                let action = button.action;
                let targetConditional = button.target_conditional;

                // 特殊处理地点选择的淡出效果
                if (this.currentSceneData.type === 'locationSelection' && target) {
                    this.transitionLocationButtons();
                    setTimeout(() => loadScene(target), 250);
                    return;
                }

                if (action) this.executeAction(action);
                if (targetConditional) target = this.evaluateConditionalTarget(targetConditional);
                if (target) {
                    loadScene(target);
                } else if (!targetConditional) {
                    console.warn(`动作 '${button.text}' 没有设置目标节点。`);
                }
                return; 
            }
        }
        
        // d. 处理“点击屏幕继续”的自动跳转
        if (this.dialogueWriter && this.dialogueWriter.isFinished) {
            const hasAutoTarget = this.currentSceneData.target && !this.currentSceneData.choices;
            if (hasAutoTarget) {
                if (this.currentSceneData.action) {
                    this.executeAction(this.currentSceneData.action);
                }
                console.log(`[EVENT] "Click to continue" detected. Jumping to "${this.currentSceneData.target}"`);
                loadScene(this.currentSceneData.target);
                return;
            }
        }  
        
        // e. 处理场景自身的 target_conditional (适用于无按钮的条件跳转场景)
        if (this.currentSceneData.target_conditional) {
            if (this.currentSceneData.action) this.executeAction(this.currentSceneData.action);
            let target = this.evaluateConditionalTarget(this.currentSceneData.target_conditional);
            if (target) loadScene(target);
        }
    },
    
    handleMouseWheel: function(event) {
        // 检查鼠标在哪一个列表上，并将滚动事件传递给它
        if (this.uiElements.achievementsList && mouseX > this.uiElements.achievementsList.x && mouseX < this.uiElements.achievementsList.x + this.uiElements.achievementsList.w) {
            this.uiElements.achievementsList.handleScroll(event);
        }
        if (this.uiElements.endingsList && mouseX > this.uiElements.endingsList.x && mouseX < this.uiElements.endingsList.x + this.uiElements.endingsList.w) {
            this.uiElements.endingsList.handleScroll(event);
        }
        if (this.currentSceneData.type === 'chatScene') {
            this.chatScrollY += event.deltaY * 0.5;
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
    
    previousLocationPage: function() {
        if (this.currentSceneData.type === 'locationSelection' && this.locationPage > 0) {
            this.locationPage--;
            this.transitionLocationButtons(true); // 重新加载并显示当前页的地点
        }
    },
    
    nextLocationPage: function() {
        if (this.currentSceneData.type === 'locationSelection') {
            const totalLocations = this.currentSceneData.locations.length;
            const totalPages = Math.ceil(totalLocations / 4);
            if (this.locationPage < totalPages - 1) {
                this.locationPage++;
                this.transitionLocationButtons(true); // 重新加载并显示当前页的地点
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
        const btnX = width * 0.85; const btnW = 220; const btnH = 50;
        this.activeButtons = [
            new TextButton(btnX, height * 0.45, btnW, btnH, "Start", false, true),
            new TextButton(btnX, height * 0.60, btnW, btnH, "Achievements", false, true),
        ];
        this.activeButtons[0].targetNode = "start";
        this.activeButtons[1].targetNode = "achievements";

        // 【新增】如果FAQ已解锁，添加FAQ按钮
        if (faqUnlocked) {
            let faqBtn = new TextButton(btnX, height * 0.75, btnW, btnH, "FAQ", false, true);
            faqBtn.targetNode = "faq_scene";
            this.activeButtons.push(faqBtn);
        }
    },

    createActionSelection: function() {
        this.uiElements.pauseButton = new ImageButton(40, 40, 40, 40, assets.ui_pause_normal, assets.ui_pause_hover);
        
        if (this.currentSceneData.dialogue) {
                const dialogueBoxW = width * 0.8; 
                const dialogueBoxH = 120;
                const padding = 25; 
                const dialogueBoxTopLeftX = (width / 2) - (dialogueBoxW / 2);
                const dialogueBoxTopLeftY = (height - dialogueBoxH - 30);

                let textToShow = '';
                const dialogueData = this.currentSceneData.dialogue;

                // 【核心修改】识别新的对话格式
                if (Array.isArray(dialogueData) && typeof dialogueData[this.dialogueIndex] === 'object') {
                    // 如果是对象数组
                    const currentDialogue = dialogueData[this.dialogueIndex];
                    this.currentSpeaker = currentDialogue.speaker;
                    textToShow = currentDialogue.line;
                } else if (Array.isArray(dialogueData)) {
                    // 兼容旧的字符串数组格式
                    this.currentSpeaker = null; // 确保没有说话人
                    textToShow = dialogueData[this.dialogueIndex];
                } else {
                    // 兼容旧的单字符串格式
                    this.currentSpeaker = null;
                    textToShow = dialogueData;
                }

               this.dialogueWriter = new Typewriter(
                   textToShow,
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
        let gap = 40;
        
        let col = index % 2;
        let row = Math.floor(index / 2);

        let x = (width / 2) - (boxW + gap / 2) + col * (boxW + gap);
        let y = (height / 2) - (boxH + gap / 2) + row * (boxH + gap);
        
        // 【核心修改】创建新的 LocationButton
        let imageAsset = assets[loc.image] || null; // 从 assets 中获取图片
        let btn = new LocationButton(x, y, boxW, boxH, loc.name, imageAsset); 
        
        btn.targetNode = loc.target;
        // 如果地点没有 target，则设为不可点击
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
    // 检查在当前这个刚刚结束的循环中，魔宠是否处于死亡状态
    if (gameStatus.lordCactusAlive === false) {
        // 如果是，则将其命运“固化”为永久死亡
        isLordCactusPermanentlyDead = true;
        console.log("%c[PERMANENT STATE] Lord Cactus death has been sealed.", "color: red; font-weight: bold;");
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

    const listWidth = (width - 150) / 2; // 计算每个列表的宽度
    // 创建左边的成就列表
    this.uiElements.achievementsList = new AchievementsList(50, 120, listWidth, height - 180, allAchievements, 'achievements');
    // 创建右边的结局列表
    this.uiElements.endingsList = new AchievementsList(50 + listWidth + 50, 120, listWidth, height - 180, allEndings, 'endings');

    // 【关键】当玩家查看成就页面时，清除“新”成就标记
    gameStatus.newAchievements.clear();
},

createCgScene: function() {
this.cgStartTime = millis();
this.cgDuration = this.currentSceneData.duration || 3000;
this.cgTarget = this.currentSceneData.target || 'start';
},

drawMainMenu: function() {
    if (assets.mainMenu_bg) {
        // 如果已加载，就将它作为背景图画满整个画布
        image(assets.mainMenu_bg, 0, 0, width, height);
    } else {
        // 如果未加载，则显示一个全屏的灰色占位符
        push();
        fill(230);
        noStroke();
        rect(0, 0, width, height);
        fill(180);
        textAlign(CENTER, CENTER);
        textSize(30);
        text("主菜单背景图片占位符\n(mainMenu_bg.png)", width / 2, height / 2);
        pop();
    }
    this.activeButtons.forEach(btn => btn.display());
},

drawActionSelection: function() {
    let bgKey = this.currentSceneData.background;
    if (assets[bgKey]) {
        image(assets[bgKey], 0, 0, width, height);
    } else {
        // 保留占位符作为后备
        push();
        fill(230); noStroke(); rect(0, 0, width, height);
        fill(180); textAlign(CENTER, CENTER); textSize(30);
        text(`背景图片 "${bgKey}" 未加载`, width/2, height/2);
        pop();
    }

    let isDialogueFinished = true;
    if (Array.isArray(this.currentSceneData.dialogue)) {
        isDialogueFinished = (this.dialogueIndex >= this.currentSceneData.dialogue.length - 1);
    }

    if ((this.dialogueWriter && this.dialogueWriter.isFinished && isDialogueFinished) || !this.dialogueWriter) {        
        this.activeButtons.forEach(btn => btn.display());
    }

    if (this.currentSceneData.dialogue) {
        let dialogueBoxW = width * 0.8;
        let dialogueBoxH = 120;
        push();

        const boxCenterX = width / 2;
        const boxCenterY = height - dialogueBoxH / 2 - 30;
        
        rectMode(CENTER);
        stroke(0);
        strokeWeight(2);
        fill(255, 255, 255, 230); 
        rect(boxCenterX, boxCenterY, dialogueBoxW, dialogueBoxH, 15);

        // --- 绘制说话人名字框 (如果需要的话) ---
        if (this.currentSpeaker && this.currentSpeaker !== "旁白") {
            const nameBoxPadding = 15;
            const nameTextSize = 20;

            // 准备文字样式以测量宽度
            textSize(nameTextSize);
            if (assets.handwritingFont) {
                textFont(assets.handwritingFont);
            }

            const nameWidth = textWidth(this.currentSpeaker);
            const nameBoxW = nameWidth + nameBoxPadding * 2;
            const nameBoxH = 35;

            // 计算名字框的位置 (在主对话框左上角)
            const nameBoxX = boxCenterX - dialogueBoxW / 2;
            const nameBoxY = boxCenterY - dialogueBoxH / 2;

            // 绘制名字框的矩形
            noStroke();
            fill(240, 240, 240, 230); // 可以给名字框一个不同的颜色
            rectMode(CORNER); // 改为角点模式方便定位
            rect(nameBoxX, nameBoxY - nameBoxH, nameBoxW, nameBoxH, 10, 10, 0, 0); // 左上和右上是圆角

            // 绘制名字文本
            fill(0);
            textAlign(CENTER, CENTER);
            text(this.currentSpeaker, nameBoxX + nameBoxW / 2, nameBoxY - nameBoxH / 2);
        }
        pop();
        
        if (this.dialogueWriter) {
            this.dialogueWriter.display();
        }
    }

    if (this.dialogueWriter && this.dialogueWriter.isFinished) {
        const isLastDialogue = !Array.isArray(this.currentSceneData.dialogue) || this.dialogueIndex >= this.currentSceneData.dialogue.length - 1;
        // 检查是否存在 target (用于自动跳转) 或 存在多行对话且未到最后一句 (用于继续对话)
        const hasAutoContinue = (this.currentSceneData.target && !this.currentSceneData.choices) || (Array.isArray(this.currentSceneData.dialogue) && !isLastDialogue);

        if (hasAutoContinue) {
            push();
            
            // 计算对话框的右下角位置，作为箭头绘制的基准点
            const dialogueBoxW = width * 0.8;
            const dialogueBoxBottomRightX = (width / 2) + (dialogueBoxW / 2) - 20; // 离右边距20px
            const dialogueBoxBottomRightY = height - 30 - 20; // 离下边距20px

            // 箭头动画：使用 sin 函数创建上下浮动效果
            // frameCount 是 p5.js 内置的帧计数器，可以用于动画
            // 0.1 是速度因子，3 是浮动高度
            const arrowYOffset = sin(frameCount * 0.1) * 3; 

            // 绘制小箭头 (一个简单的三角形)
            fill(255); // 箭头颜色为白色
            noStroke();
            
            // 箭头中心点
            const arrowBaseX = dialogueBoxBottomRightX - 10; // 稍微向左偏移，让箭头尖端对齐
            const arrowBaseY = dialogueBoxBottomRightY + arrowYOffset;
            
            // 绘制一个指向右下角的三角形
            triangle(
                arrowBaseX - 5, arrowBaseY,          // 左上角点
                arrowBaseX + 5, arrowBaseY,          // 右上角点
                arrowBaseX,     arrowBaseY + 7       // 下面的尖角点
            );
            pop();
        }
    }
},

    drawLocationSelection: function() {
        // 1. 绘制背景（这部分会立即显示）
        const bgKey = this.currentSceneData.background;
        if (bgKey && assets[bgKey]) {
            image(assets[bgKey], 0, 0, width, height);
        } else {
            push();
            fill(230);
            noStroke();
            rect(0, 0, width, height);
            pop();
        }
        
        // 2. 绘制箭头（也会立即显示）
        if (this.uiElements.leftArrow && this.locationPage > 0) {
            this.uiElements.leftArrow.display();
        }
        if (this.uiElements.rightArrow && this.locationPage < Math.ceil(this.currentSceneData.locations.length / 4) - 1) {
            this.uiElements.rightArrow.display();
        }
        
        // 3. 【核心修改】检查是否已过去0.5秒
        // 只有在满足条件后，才开始绘制地点选项按钮
        if (millis() - this.sceneLoadTime > 500) {
            this.activeButtons.forEach(btn => btn.display());
        }
    },

    drawEnding: function() {
        let bgKey = this.currentSceneData.endingImage;
        if (assets[bgKey]) {
            image(assets[bgKey], 0, 0, width, height);
        } else {
            // 保留占位符作为后备
            push();
            fill(50); noStroke(); rect(0, 0, width, height);
            fill(120); textAlign(CENTER, CENTER); textSize(40);
            text(`结局图片 "${bgKey}" 未加载`, width/2, height/2);
            pop();
        }

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
            let newTagX = width/2 + titleW/2 + 120;
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
        textAlign(CENTER, TOP); fill(0); textSize(48);
        text("Achievements", width/2, 40);
        pop();

        // 分别绘制两个列表
        if (this.uiElements.achievementsList) {
            this.uiElements.achievementsList.display(gameStatus.unlockedAchievements, gameStatus.newAchievements);
        }
        if (this.uiElements.endingsList) {
            this.uiElements.endingsList.display(unlockedEndings, new Set()); // 结局列表没有“新”标记
        }

        if (this.uiElements.closeButton) {
            this.uiElements.closeButton.display();
        }
    },

    drawPauseMenu: function() {
        push(); fill(0, 0, 0, 150); noStroke(); rect(0, 0, width, height); pop();

        if (!this.uiElements.pauseMenuButtons || faqUnlocked !== this.uiElements.faqButtonExists) {
            this.uiElements.faqButtonExists = faqUnlocked;
            
            const btnY_start = height/2 - 150;
            const btnGap = 60; 

            this.uiElements.pauseMenuButtons = [
                new TextButton(width / 2, btnY_start, 280, 50, "Continue", false, true),
                new TextButton(width / 2, btnY_start + btnGap, 280, 50, "Main Menu", false, true),
                new TextButton(width / 2, btnY_start + btnGap * 2, 280, 50, "Achievements", false, true),
                new TextButton(width / 2, btnY_start + btnGap * 3, 280, 50, "Let's call it a day", false, true)
            ];
            if (faqUnlocked) {
                this.uiElements.pauseMenuButtons.push(new TextButton(width / 2, btnY_start + btnGap * 4, 280, 50, "FAQ", false, true));
            }
        }
        this.uiElements.pauseMenuButtons.forEach(btn => btn.display());
        
        // 为成就按钮绘制感叹号
        const achievementsButton = this.uiElements.pauseMenuButtons[2];
        if (gameStatus.newAchievements.size > 0) {
            push();
            fill(255, 0, 0); noStroke();
            const btnX = achievementsButton.x + achievementsButton.w - 20;
            const btnY = achievementsButton.y + 20;
            ellipse(btnX, btnY, 15, 15);
            fill(255); textAlign(CENTER, CENTER); textSize(12); text('!', btnX, btnY + 1);
            pop();
        }
        
        // 为FAQ按钮绘制感叹号
        const faqButton = this.uiElements.pauseMenuButtons.find(btn => btn.text === 'FAQ');
        if (faqButton && newFaqContent) {
            push();
            fill(255, 0, 0); noStroke();
            const btnX = faqButton.x + faqButton.w - 20;
            const btnY = faqButton.y + 20;
            ellipse(btnX, btnY, 15, 15);
            fill(255); textAlign(CENTER, CENTER); textSize(12); text('!', btnX, btnY + 1);
            pop();
        }    
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
        // 在 drawPauseMenu 中创建的按钮数组
        const btns = this.uiElements.pauseMenuButtons;
        if (!btns) return; // 如果按钮还未创建，则不执行任何操作

        // 0: Continue
        if (btns[0] && btns[0].isMouseOver()) {
            isPaused = false;
            this.resumeAllMedia();
        } 
        // 1: Main Menu
        else if (btns[1] && btns[1].isMouseOver()) {
            isPaused = false;
            this.resumeAllMedia();
            loadScene('mainMenu');
        } 
        // 2: Achievements
        else if (btns[2] && btns[2].isMouseOver()) {
            isPaused = false;
            this.resumeAllMedia();
            previousGameState = gameState;
            loadScene('achievements');
        } 
        // 3: Let's call it a day
        else if (btns[3] && btns[3].isMouseOver()) {
            isPaused = false;
            this.resumeAllMedia();
            loadScene('ending_didntGetUp');
        } 
        // 检查是否存在 FAQ 按钮并处理点击
        else {
            const faqButton = this.uiElements.pauseMenuButtons.find(btn => btn.text === 'FAQ');
            if (faqButton && faqButton.isMouseOver()) {
                isPaused = false;
                this.resumeAllMedia();
                previousGameState = gameState;
                loadScene('faq_scene');
            }
        }
    },

    executeAction: function(actionString) {
        if (!actionString) return;

        const actions = actionString.split(';');

        actions.forEach(singleAction => {
            const [command, key, value] = singleAction.trim().split(':');

            switch(command) {
                case 'unlockAchievement': {
                    const achievementId = key;
                    if (allAchievements[achievementId] && !gameStatus.unlockedAchievements.has(achievementId)) {
                        gameStatus.unlockedAchievements.add(achievementId);
                        gameStatus.newAchievements.add(achievementId);
                        achievementPopup = new AchievementPopup(allAchievements[achievementId].title);
                        console.log(`%c[ACHIEVEMENT] Unlocked: "${achievementId}"`, 'color: gold;');
                    }
                    return;
                }
                case 'unlockFaq': {
                    if (!faqUnlocked) {
                        faqUnlocked = true;
                        newFaqContent = true;
                    }
                    return;
                }
                // 【核心修正】将 unlockBladesFaq 的逻辑重新加回来
                // case 'unlockBladesFaq': {
                //     // 只有在主FAQ已解锁，且玩家确实有刀片时才触发
                //     if (faqUnlocked && gameStatus.inventory['blades'] > 0) {
                //         newFaqContent = true;
                //         faqCurrentStage = 'start_blades';
                //     }
                //     return;
                // }
                case 'lordDies': {
                    gameStatus.lordCactusAlive = false;
                    return;
                }
            }

            const oldValue = gameStatus[key];
            switch(command) {
                case 'update': 
                    let newValue;
                    if (value === 'true') newValue = true;
                    else if (value === 'false') newValue = false;
                    else newValue = value;
                    gameStatus[key] = newValue;
                    break;
                case 'increment': 
                    gameStatus[key]++; 
                    break;
                case 'decrement': 
                    gameStatus[key]--; 
                    break;
            }
        });
    },

    evaluateCondition: function(conditionString) {
        if (!conditionString) return true;
        const parts = conditionString.split(':');
        const key = parts[0];
        const operator = parts.length === 3 ? parts[1] : '===';
        const valueString = parts.length === 3 ? parts[2] : parts[1];
        let statusValue = gameStatus[key];
        let conditionValue = valueString === 'true' ? true : valueString === 'false' ? false : parseFloat(valueString);
        
        if (valueString === 'true') {
            conditionValue = true;
        } else if (valueString === 'false') {
            conditionValue = false;
        } else {
            conditionValue = parseFloat(valueString);
        }

        let result;
        
        switch(operator) {
            case '===': result = statusValue === conditionValue; break;
            case '==': result = statusValue == conditionValue; break;
            case '>=': result = statusValue >= conditionValue; break;
            case '<=': result = statusValue <= conditionValue; break;
            case '>': result = statusValue > conditionValue; break;
            case '<': result = statusValue < conditionValue; break;
            default: return true; break;
        }

        // --- DEBUG ---
        console.log(
            `[CONDITION] Evaluating: "${conditionString}"\n` +
            `            - Game Status: gameStatus.${key} (${typeof statusValue} ${statusValue})\n` +
            `            - Operator: "${operator}"\n` +
            `            - Compare Value: (${typeof conditionValue} ${conditionValue})\n` +
            `            - Result: ${result}`
        );
        
        return result;

    },

    evaluateConditionalTarget: function(conditionals) {
        for (const cond of conditionals) {
            if (cond.condition === 'default' || this.evaluateCondition(cond.condition)) {
                return cond.target;
            }
        }
        return null;
    },

    createShopScene: function() {
            const sceneData = this.currentSceneData;

            if (!gameStatus.shopInitialized) {
                console.log("[SHOP] Initializing stock for the first time this loop.");
                if (sceneData.itemsForSale) {
                    sceneData.itemsForSale.forEach(itemBlueprint => {
                        gameStatus.shopStock[itemBlueprint.id] = itemBlueprint.stock;
                    });
                }
                gameStatus.shopInitialized = true;
            }

            this.activeShopItems = [];
            this.shopScrollX = 0;
            this.uiElements.pauseButton = new ImageButton(40, 40, 40, 40, assets.ui_pause_normal, assets.ui_pause_hover);
            this.uiElements.closeButton = new ImageButton(width - 40, 40, 40, 40, assets.ui_close_icon_normal, assets.ui_close_icon_hover);

            const videoKey = sceneData.tvVideos[gameStatus.crimeLevel] || sceneData.tvVideos[0];
            this.currentVideo = assets[videoKey];
            if (this.currentVideo) {
                this.currentVideo.loop();
                this.currentVideo.volume(1);
            }
            
            const itemW = 135, itemH = 180, itemGap = 20;
            const startX = 50;
            const itemY = height - itemH - 20;
            
            sceneData.itemsForSale.forEach((itemData, index) => {
                const itemX = startX + index * (itemW + itemGap);
                const newItem = new ShopItemButton(itemX, itemY, itemW, itemH, itemData);
                this.activeShopItems.push(newItem);
            });

            const totalWidth = this.activeShopItems.length * (itemW + itemGap) - itemGap;
            this.maxShopScroll = Math.max(0, totalWidth - (width - startX * 2));
        },

drawShopScene: function() {
    const bgKey = this.currentSceneData.background;
    if (assets[bgKey]) {
        image(assets[bgKey], 0, 0, width, height);
    }

    const tvX = 90, tvY = 60, tvW = 320, tvH = 240; 
    
    if (this.currentVideo && this.currentVideo.width > 0) {
        image(this.currentVideo, tvX, tvY, tvW, tvH);
    } else {
        push();
        fill(50); noStroke(); rect(tvX, tvY, tvW, tvH);
        fill(200); textAlign(CENTER, CENTER); textSize(24);
        text("TV Placeholder", tvX + tvW / 2, tvY + tvH / 2);
        pop();
    }

    this.uiElements.closeButton.display();
    push();
    fill(0); textAlign(RIGHT, CENTER); textSize(30);
    text(`$ ${gameStatus.money}`, width - 120, 40);
    pop();

    this.activeShopItems.forEach(itemBtn => {
        itemBtn.display(this.shopScrollX);
    });
},

    // 【新增】处理鼠标拖拽滚动的函数
    handleMouseDrag: function() {
        if (this.currentSceneData.type === 'shopScene') {
            // 检查是否在商品区域拖拽
            const itemAreaY = height - 200 - 40;
            if (mouseY > itemAreaY) {
                this.shopScrollX += (mouseX - pmouseX);
                // 限制滚动范围，防止滚出边界
                this.shopScrollX = constrain(this.shopScrollX, -this.maxShopScroll, 0);
            }
        }
        if (this.currentSceneData.type === 'chatScene') {
            this.chatScrollY -= (mouseY - pmouseY);
        }
    },

    handleDoubleClick: function() {
        if (isPaused) return; // 暂停时禁用双击

        // 双击事件专门用于处理商品购买
        if (this.currentSceneData.type === 'shopScene') {
            for (const itemBtn of this.activeShopItems) {
                if (itemBtn.isMouseOver(this.shopScrollX)) {
                    if(itemBtn.purchase()) {
                        // 可以在这里播放购买成功的音效
                        if (assets.sfx_cash) assets.sfx_cash.play();
                    } else {
                        // 可以在这里播放钱不够或售罄的音效
                        if (assets.sfx_cantpurchase) assets.sfx_cantpurchase.play();
                    }
                    return; 
                }
            }
        }
    },

    // --- 【新增】聊天场景专属函数 ---

    createChatScene: function() {
        this.uiElements.backButton = new TextButton(80, 50, 100, 40, "< Back", false, true);
        newFaqContent = false;
        this.chatScrollY = 9999;
        this.isReplying = false;

        this.uiElements.chatBuffer = createGraphics(width - 100, height - 250);

        // 【核心修正】在进入场景时，检查并显示正确的对话历史
        // 这个函数会根据 faqCurrentStage 的值，自动添加作者的第一句话
        this.updateChatChoices();
    },

    drawChatScene: function() {
        background(240);
        
        push();
        textAlign(CENTER, CENTER); fill(0); textSize(48);
        text("FAQ", width/2, 50);
        this.uiElements.backButton.display();
        pop();

        // 【核心修正】直接使用已经创建好的“画板”，而不是每次都新建
        let chatBuffer = this.uiElements.chatBuffer;
        chatBuffer.background(240);
        if (assets.handwritingFont) chatBuffer.textFont(assets.handwritingFont);
        chatBuffer.textLeading(22);

        chatBuffer.push();
        let currentY = 10;
        faqChatHistory.forEach(msg => {
            const bubbleMaxWidth = chatBuffer.width * 0.7;
            const bubbleSize = this.calculateBubbleSize(msg.line, bubbleMaxWidth, chatBuffer);
            const bubblePadding = 10;
            
            if (msg.speaker === 'player') {
                chatBuffer.fill(220, 255, 220);
                chatBuffer.rect(chatBuffer.width - bubbleSize.w - 20, currentY, bubbleSize.w, bubbleSize.h, 10);
                chatBuffer.fill(0);
                chatBuffer.textAlign(LEFT, TOP);
                chatBuffer.text(bubbleSize.wrappedText, chatBuffer.width - bubbleSize.w - 20 + bubblePadding, currentY + bubblePadding);
            } else {
                chatBuffer.fill(255);
                chatBuffer.rect(20, currentY, bubbleSize.w, bubbleSize.h, 10);
                chatBuffer.fill(0);
                chatBuffer.textAlign(LEFT, TOP);
                chatBuffer.text(bubbleSize.wrappedText, 20 + bubblePadding, currentY + bubblePadding);
            }
            currentY += bubbleSize.h + 10;
        });
        chatBuffer.pop();
        
        const totalContentHeight = currentY;
        const maxScroll = Math.max(0, totalContentHeight - (height - 250));
        this.chatScrollY = constrain(this.chatScrollY, 0, maxScroll);
        image(chatBuffer, 50, 100, width - 100, height - 250, 0, this.chatScrollY, width - 100, height - 250);

        this.activeButtons.forEach(btn => btn.display());
    },

    updateChatChoices: function() {
        this.activeButtons = [];
        const currentStageData = this.currentSceneData.conversationTree[faqCurrentStage];
        if (!currentStageData || this.isReplying) return;

        // 如果作者有台词且历史记录里最后一条不是这条，则添加
        if (currentStageData.authorLine) {
            let linesToAdd = [];
            if (typeof currentStageData.authorLine === 'object' && currentStageData.authorLine.type === 'conditional') {
                for (const conditionalLine of currentStageData.authorLine.lines) {
                    if (conditionalLine.condition === 'default' || this.evaluateCondition(conditionalLine.condition)) {
                        linesToAdd.push(conditionalLine.text);
                        break;
                    }
                }
            } else {
                linesToAdd = Array.isArray(currentStageData.authorLine) ? currentStageData.authorLine : [currentStageData.authorLine];
            }
            const lastHistoryLine = faqChatHistory.length > 0 ? faqChatHistory[faqChatHistory.length - 1].line : null;
            if (linesToAdd.length > 0 && linesToAdd[0] !== lastHistoryLine) {
                linesToAdd.forEach(line => {
                    faqChatHistory.push({ speaker: 'author', line: line });
                });
            }
        }
        
        // 如果有玩家选项，则创建按钮
        const choices = currentStageData.playerChoices;
        if (choices && choices.length > 0) {
            this.uiElements.backButton.isClickable = false; // 会话期间禁用返回
            const btnW = (width - 100) / choices.length - 10;
            choices.forEach((choice, i) => {
                let btn = new TextButton(60 + i * (btnW + 10), height - 120, btnW, 50, choice.text, false);
                btn.targetNode = choice.nextStage;
                this.activeButtons.push(btn);
            });
        } else {
            // --- 【核心修正】当一个对话分支结束时 ---
            this.uiElements.backButton.isClickable = true; // 1. 启用返回按钮

            // 2. 检查这是否是“仙人掌主线FAQ”的结尾
            // if (faqCurrentStage === 'player_silent') {
            //     // 3. 检查玩家背包里是否已经有刀片
            //     if (gameStatus.inventory['blades'] && gameStatus.inventory['blades'] > 0) {
            //         console.log("[FAQ LOGIC] Main FAQ ended. Blades found in inventory. Triggering new content.");
            //         // 4. 如果有，则触发“新内容”提示，并将下一次的对话入口切换到刀片分支
            //         newFaqContent = true;
            //         faqCurrentStage = 'start_blades';
            //     }
            // }
        }
    },

    handleChatSceneClick: function() {
        if (this.uiElements.backButton.isMouseOver()) {
            loadScene(previousGameState || 'mainMenu');
            return;
        }

        for (const btn of this.activeButtons) {
            if (btn.isMouseOver()) {
                this.isReplying = true;
                const nextStageId = btn.targetNode;
                const nextStageData = this.currentSceneData.conversationTree[nextStageId];
                
                // 添加玩家说的话到历史记录
                if (nextStageData.playerLine) {
                    faqChatHistory.push({ speaker: 'player', line: nextStageData.playerLine });
                }

                // 执行新阶段的 action (如果有)
                if (nextStageData.action) {
                    this.executeAction(nextStageData.action);
                }

                // 更新当前阶段并清空选项
                faqCurrentStage = nextStageId;
                this.activeButtons = [];
                this.chatScrollY = 9999; // 滚动到底部

                // 5秒后模拟作者回复
                setTimeout(() => {
                    this.isReplying = false;
                    this.updateChatChoices();
                    this.chatScrollY = 9999;
                }, 1800);

                return;
            }
        }
    },


    calculateBubbleSize: function(text, maxWidth, graphicsBuffer) {
        graphicsBuffer.textSize(18); // 确保字体大小设置正确
        
        let words = text.split(' ');
        let lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            let word = words[i];
            let testLine = currentLine + " " + word;
            if (graphicsBuffer.textWidth(testLine) < maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        const wrappedText = lines.join('\n');
        const textLeadingVal = graphicsBuffer.textLeading(); // 获取行高
        const bubbleHeight = lines.length * textLeadingVal + 20; // 20是垂直内边距
        
        // 找出最长的一行来确定气泡宽度
        let maxLineWidth = 0;
        for (const line of lines) {
            maxLineWidth = max(maxLineWidth, graphicsBuffer.textWidth(line));
        }
        const bubbleWidth = maxLineWidth + 20; // 20是水平内边距
        
        return {
            wrappedText: wrappedText,
            w: bubbleWidth,
            h: bubbleHeight
        };
    },

    pauseAllMedia: function() {
        // 使用 outputVolume() 替代 masterVolume() 来避免 "not defined" 错误
        outputVolume(0, 0.15); // 0.15秒淡出

        // 检查并暂停背景音乐
        if (this.currentBGM && this.currentBGM.isPlaying()) {
            this.currentBGM.pause();
        }
        // 检查并暂停视频
        if (this.currentVideo) {
            this.currentVideo.pause();
        }
    },

    // 【最终修复】
    resumeAllMedia: function() {
        // 恢复全局音量
        outputVolume(1, 0.15); // 0.15秒淡入

        // 检查BGM是否存在且已暂停，然后用 .play() 恢复播放
        if (this.currentBGM && !this.currentBGM.isPlaying()) {
            this.currentBGM.play();
        }
        // 检查并恢复视频循环播放
        if (this.currentVideo) {
            this.currentVideo.loop();
        }
    }

};
