// ui.js

// 这个类负责处理所有逐字显示的文本效果，并确保文本在指定区域内居中换行。
class Typewriter {
    constructor(fullText, x, y, w, h) {
        this.fullText = fullText;
        this.x = x; // 文本区域的左上角 x
        this.y = y; // 文本区域的左上角 y
        this.w = w;
        this.h = h;
        this.displayedText = '';
        this.currentIndex = 0;
        this.frameCounter = 0;
        this.speed = 1; 
        this.isFinished = false;
        
        // 【核心修正】预先处理换行
        this.processedText = this.wrapText(fullText, w);
    }

    // 文本自动换行函数
    wrapText(text, maxWidth) {
        let words = text.split(' ');
        let lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            let word = words[i];
            // 检查字体是否已加载
            if (assets.handwritingFont) {
                textFont(assets.handwritingFont);
            }
            textSize(22);
            let width = textWidth(currentLine + " " + word);
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines.join('\n');
    }

    update() {
        if (!this.isFinished) {
            this.frameCounter++;
            if (this.frameCounter % this.speed === 0 && this.currentIndex < this.processedText.length) {
                this.displayedText += this.processedText[this.currentIndex];
                this.currentIndex++;
            }
            if (this.currentIndex >= this.processedText.length) {
                this.isFinished = true;
            }
        }
    }

    display(textColor = 0) {
        this.update();
        push();
        fill(textColor);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(22);
        if (assets.handwritingFont) {
            textFont(assets.handwritingFont);
        }
        // 使用矩形的中心点来绘制文本
        text(this.displayedText, this.x + this.w / 2, this.y + this.h / 2);
        pop();
    }

    finish() {
        this.displayedText = this.processedText;
        this.currentIndex = this.processedText.length;
        this.isFinished = true;
    }
}


// 文本按钮类
class TextButton {
    constructor(x, y, w, h, text, isSmall = false, useCenterMode = false) {
        this.useCenterMode = useCenterMode;
        this.w = w;
        
        this.text = text;
        this.isSmall = isSmall;
        this.isHovered = false;

        let calculatedHeight;

        if (assets.handwritingFont) {
            textFont(assets.handwritingFont);
        }
        
        if(this.isSmall){
            textSize(20);
            calculatedHeight = textSize() * 1.9;
        } else {
            textSize(28); // 您之前调整后的大小
            calculatedHeight = textSize() * 1.8; // 为大按钮也设置一个紧凑的比例
        }
        
        this.h = h > 0 ? h : calculatedHeight;

        if (this.useCenterMode) {
            this.x = x - this.w / 2;
            this.y = y - this.h / 2;
        } else {
            this.x = x;
            this.y = y;
        }
        
        this.alpha = 255;
        this.targetAlpha = 255;
        this.fadeSpeed = 15;
        this.isClickable = true;
    }

    fadeIn() {
        this.alpha = 0;
        this.targetAlpha = 255;
    }

    fadeOut() {
        this.targetAlpha = 0;
    }

    update() {
        this.isHovered = (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h);
        
        if (this.alpha < this.targetAlpha) {
            this.alpha = min(this.alpha + this.fadeSpeed, this.targetAlpha);
        } else if (this.alpha > this.targetAlpha) {
            this.alpha = max(this.alpha - this.fadeSpeed, this.targetAlpha);
        }
    }

    display() {
        this.update();
        
        push();
        if (assets.handwritingFont) {
            textFont(assets.handwritingFont);
        }
        
        let currentAlpha = this.isClickable ? this.alpha : this.alpha * 0.4;
        
        let strokeWeightValue = this.isSmall ? 1 : 2;
        let cornerRadius = this.isSmall ? 0 : 10;
        
        stroke(0, 0, 0, currentAlpha);
        strokeWeight(strokeWeightValue);
        fill(255, 255, 255, currentAlpha);
        rect(this.x, this.y, this.w, this.h, cornerRadius);
        
        noStroke();
        fill(0, 0, 0, currentAlpha);
        
        if (this.isSmall) {
            textSize(20);
            textAlign(LEFT, CENTER);
            let pad = this.textPadding !== undefined ? this.textPadding : 15;
            text(this.text, this.x + pad, this.y + this.h / 2);
        } else {
            textSize(28);
            textAlign(CENTER, CENTER);
            text(this.text, this.x + this.w / 2, this.y + this.h / 2);
        }

        if (this.isHovered && this.isClickable) {
            fill(0, 0, 0, 50);
            noStroke();
            rect(this.x, this.y, this.w, this.h, cornerRadius);
        }
        pop();
    }

    isMouseOver() {
        return this.isHovered && this.isClickable && this.alpha > 250;
    }
}


// 图片按钮类，现在也用于箭头和暂停
class ImageButton {
    constructor(x, y, w, h, normalImg, hoverImg) {
        this.x = x - w/2;
        this.y = y - h/2;
        this.w = w;
        this.h = h;
        this.normalImg = normalImg;
        this.hoverImg = hoverImg;
        this.isHovered = false;
    }

    update() {
        this.isHovered = mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h;
    }

    display() {
        this.update();
        let imgToShow = this.isHovered ? this.hoverImg : this.normalImg;
        if (imgToShow) {
            image(imgToShow, this.x, this.y, this.w, this.h);
        } else {
            // 占位符
            push();
            rectMode(CORNER);
            stroke(150);
            noFill();
            if (this.isHovered) { fill(230); }
            rect(this.x, this.y, this.w, this.h);
            
            // 绘制一个简单的图形作为占位符
            stroke(100);
            strokeWeight(2);
            // 简单的“箭头”或“暂停”符号
            if (this.w < 50 && this.h > 50) { // 竖着的箭头
                 line(this.x + this.w*0.7, this.y + this.h*0.3, this.x + this.w*0.3, this.y + this.h*0.5);
                 line(this.x + this.w*0.3, this.y + this.h*0.5, this.x + this.w*0.7, this.y + this.h*0.7);
            } else if (this.w > 50 && this.h < 50) { // 横着的箭头
                 line(this.x + this.w*0.3, this.y + this.h*0.3, this.x + this.w*0.7, this.y + this.h*0.5);
                 line(this.x + this.w*0.7, this.y + this.h*0.5, this.x + this.w*0.3, this.y + this.h*0.7);
            }
            else { // 暂停按钮
                line(this.x + 15, this.y + 10, this.x + 15, this.y + 30);
                line(this.x + 25, this.y + 10, this.x + 25, this.y + 30);
            }
            pop();
        }
    }

    isMouseOver() {
        return this.isHovered;
    }
}


// 成就列表类
class AchievementsList {
    constructor(x, y, w, h, dataObject, type) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.dataObject = dataObject; // allAchievements 或 allEndings
        this.type = type; // 'achievements' 或 'endings'
        this.scrollY = 0;
        this.entryHeight = 80;
        this.totalContentHeight = Object.keys(this.dataObject).length * this.entryHeight;
        this.maxScroll = Math.max(0, this.totalContentHeight - this.h);
    }

    handleScroll(event) {
        this.scrollY += event.deltaY * 0.5;
        this.scrollY = constrain(this.scrollY, 0, this.maxScroll);
    }

    display(unlockedSet, newSet) { // 接收两个 Set
        let listBuffer = createGraphics(this.w, this.h);
        listBuffer.background(255);
        if (assets.handwritingFont) listBuffer.textFont(assets.handwritingFont);

        listBuffer.push();
        listBuffer.translate(0, -this.scrollY); // 应用滚动

        let currentY = 0;
        for (const id in this.dataObject) {
            const info = this.dataObject[id];
            const isUnlocked = unlockedSet.has(id);
            const isNew = newSet.has(id); // 检查是否是“新”的

            listBuffer.stroke(220);
            listBuffer.line(0, currentY + this.entryHeight, this.w, currentY + this.entryHeight);

            if (isUnlocked) {
                listBuffer.fill(0); listBuffer.noStroke();
                listBuffer.textAlign(LEFT, TOP);
                listBuffer.textSize(20); listBuffer.textStyle(BOLD);
                listBuffer.text(info.title, 20, currentY + 15);

                listBuffer.textSize(14); listBuffer.textStyle(NORMAL);
                listBuffer.fill(100);
                listBuffer.text(info.description, 20, currentY + 45);

                // 如果是“新”的，在末尾绘制感叹号
                if (isNew) {
                    listBuffer.fill(255, 0, 0); listBuffer.noStroke();
                    listBuffer.ellipse(this.w - 25, currentY + 25, 15, 15);
                    listBuffer.fill(255); listBuffer.textAlign(CENTER, CENTER); listBuffer.textSize(12);
                    listBuffer.text('!', this.w - 25, currentY + 26);
                }
            } else {
                // ... (未解锁的显示逻辑保持不变) ...
            }
            currentY += this.entryHeight;
        }
        listBuffer.pop();
        image(listBuffer, this.x, this.y);

        // 绘制列表标题
        push();
        fill(100); textSize(24); textAlign(CENTER, TOP);
        text(this.type === 'achievements' ? 'Achievements' : 'Endings', this.x + this.w / 2, this.y - 35);
        pop();
    }
}

// 专门用于 Location Selection 的图片按钮类
class LocationButton {
    constructor(x, y, w, h, text, imageAsset) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.text = text;
        this.imageAsset = imageAsset;
        this.isHovered = false;
        this.isClickable = true; // 默认为可点击

        this.alpha = 0; // 用于淡入效果
        this.targetAlpha = 255;
        this.fadeSpeed = 15;
    }

    fadeIn() {
        this.alpha = 0;
        this.targetAlpha = 255;
    }

    fadeOut() {
        this.targetAlpha = 0;
    }

    update() {
        // 更新鼠标悬停状态
         this.isHovered = !isPaused && (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h);

        // 更新透明度以实现淡入淡出
        if (this.alpha < this.targetAlpha) {
            this.alpha = min(this.alpha + this.fadeSpeed, this.targetAlpha);
        } else if (this.alpha > this.targetAlpha) {
            this.alpha = max(this.alpha - this.fadeSpeed, this.targetAlpha);
        }
    }

    display() {
        this.update();

        push();
        // 设置整体透明度，以实现淡入效果
        tint(255, this.alpha);

        // 1. 绘制封面图（如果存在）
        if (this.imageAsset) {
            image(this.imageAsset, this.x, this.y, this.w, this.h);
        } else {
            // 如果没有图片，绘制一个占位符
            fill(200);
            noStroke();
            rect(this.x, this.y, this.w, this.h, 10);
        }

        // 2. 如果鼠标悬停，则绘制半透明白色遮罩和文字
        if (this.isHovered && this.isClickable) {
            // 白色遮罩，75% 透明度
            fill(255, 255, 255, 255 * 0.75);
            noStroke();
            rect(this.x, this.y, this.w, this.h, 10);

            // 在遮罩上绘制地点名称
            if (assets.handwritingFont) {
                textFont(assets.handwritingFont);
            }
            fill(0); // 黑色文字
            textAlign(CENTER, CENTER);
            textSize(28);
            text(this.text, this.x + this.w / 2, this.y + this.h / 2);
        }

        // 3. 绘制边框（无论是否悬停）
        noFill();
        strokeWeight(2);
        // 如果该地点不可点击，边框变灰色
        if (!this.isClickable) {
            stroke(150);
        } else {
            stroke(0);
        }
        rect(this.x, this.y, this.w, this.h, 10);

        pop();
    }

    isMouseOver() {
        return this.isHovered && this.isClickable && this.alpha > 250;
    }
}

// 【新增】专门用于商店商品的按钮类
class ShopItemButton {
    constructor(x, y, w, h, itemData) {
        this.baseX = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.item = itemData; // 商品“蓝图” (id, name, price, image)
        this.isHovered = false;
    }

    isMouseOver(scrollX) {
        const currentX = this.baseX + scrollX;
        return mouseX > currentX && mouseX < currentX + this.w && mouseY > this.y && mouseY < this.y + this.h;
    }
    
    purchase() {
        // 【核心修正】从 gameStatus.shopStock 读取当前库存
        const currentStock = gameStatus.shopStock[this.item.id] || 0;

        if (gameStatus.money >= this.item.price && currentStock > 0) {
            gameStatus.money -= this.item.price;
            
            // 【核心修正】只修改 gameStatus.shopStock
            gameStatus.shopStock[this.item.id]--;
            
            if (gameStatus.inventory[this.item.id]) {
                gameStatus.inventory[this.item.id]++;
            } else {
                gameStatus.inventory[this.item.id] = 1;
            }

            if (this.item.purchaseAction) {
                sceneManager.executeAction(this.item.purchaseAction);
            }
            return true;
        }
        return false;
    }

    display(scrollX) {
        const currentX = this.baseX + scrollX;
        this.isHovered = this.isMouseOver(scrollX);

        // 【核心修正】从 gameStatus.shopStock 读取当前库存
        const currentStock = gameStatus.shopStock[this.item.id] || 0;

        push();
        // 如果物品售罄或买不起，变暗
        if (currentStock <= 0 || gameStatus.money < this.item.price) {
            tint(150);
        }

        // --- 绘制商品框 ---
        strokeWeight(2);
        stroke(0);
        fill(255);
        rect(currentX, this.y, this.w, this.h, 10);
        
        // --- 绘制商品名称 ---
        fill(0);
        noStroke();
        textAlign(CENTER, TOP);
        textSize(18);
        text(this.item.name, currentX + this.w / 2, this.y + 10);

        // --- 绘制商品图片 ---
        const imgAsset = assets[this.item.image];
        if (imgAsset) {
            const imgSize = this.w * 0.6;
            imageMode(CENTER);
            image(imgAsset, currentX + this.w / 2, this.y + this.h / 2, imgSize, imgSize);
        }

        // --- 绘制价格 ---
        textAlign(CENTER, BOTTOM);
        textSize(16);
        text(`$${this.item.price}`, currentX + this.w / 2, this.y + this.h - 10);

        // --- 绘制库存 ---
        if (currentStock > 0) {
            const stockCircleSize = 25;
            fill(200, 0, 0);
            ellipse(currentX + this.w - 15, this.y + this.h - 55, stockCircleSize, stockCircleSize);
            fill(255);
            textAlign(CENTER, CENTER);
            textSize(14);
            // 【核心修正】显示 gameStatus.shopStock 中的库存
            text(currentStock, currentX + this.w - 15, this.y + this.h - 55);
        }

        // --- 悬停效果 ---
        if (this.isHovered && currentStock > 0 && gameStatus.money >= this.item.price) {
            noFill();
            stroke(0, 150, 255);
            strokeWeight(3);
            rect(currentX, this.y, this.w, this.h, 10);
        }
        
        pop();
    }
}

// 【新增】成就解锁弹窗的 UI 类
class AchievementPopup {
    constructor(achievementTitle) {
        this.title = achievementTitle;
        this.startTime = millis();
        this.duration = 4000; // 总共显示4秒
        this.y = -80; // 从屏幕外开始
        this.targetY = 20; // 最终停在离顶部20px的位置
        this.state = 'sliding_in'; // 状态: sliding_in, waiting, sliding_out
    }

    update() {
        const elapsedTime = millis() - this.startTime;

        if (this.state === 'sliding_in') {
            this.y = lerp(this.y, this.targetY, 0.1);
            if (abs(this.y - this.targetY) < 1) {
                this.y = this.targetY;
                this.state = 'waiting';
            }
        } else if (this.state === 'waiting') {
            if (elapsedTime > this.duration - 1000) { // 最后1秒开始滑出
                this.state = 'sliding_out';
            }
        } else if (this.state === 'sliding_out') {
            this.targetY = -80; // 目标变为屏幕外
            this.y = lerp(this.y, this.targetY, 0.1);
        }

        // 动画结束后自我销毁
        if (elapsedTime >= this.duration) {
            achievementPopup = null;
        }
    }

    display() {
        this.update();
        push();
        rectMode(CORNER);
        noStroke();
        fill(30, 30, 30, 220);
        rect(width / 2 - 200, this.y, 400, 60, 10);

        fill(255, 215, 0); // 金色文字
        textAlign(CENTER, CENTER);
        textSize(16);
        text('~ Achievement Unlocked ~', width / 2, this.y + 20);

        fill(255);
        textSize(18);
        text(this.title, width / 2, this.y + 45);
        pop();
    }
}