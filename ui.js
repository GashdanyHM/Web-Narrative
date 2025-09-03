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
            textSize(18);
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
        textSize(18);
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
        
        if (assets.handwritingFont) {
            textFont(assets.handwritingFont);
        }
        
        if(this.isSmall){
            textSize(16);
            this.h = textSize() * 2.2;
        } else {
            this.h = h;
        }

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
            textSize(16);
            textAlign(LEFT, CENTER);
            text(this.text, this.x + 15, this.y + this.h / 2);
        } else {
            textSize(24);
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
    constructor(x, y, w, h, allEndingsData) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.allEndingsData = allEndingsData;
        this.scrollY = 0;
        this.entryHeight = 80;
        this.totalContentHeight = Object.keys(this.allEndingsData).length * this.entryHeight;
        this.maxScroll = Math.max(0, this.totalContentHeight - this.h);
    }
  
    handleScroll(event) {
        this.scrollY += event.deltaY * 0.5;
        this.scrollY = constrain(this.scrollY, 0, this.maxScroll);
    }
  
    display(unlockedEndingsSet) {
        let listBuffer = createGraphics(this.w, this.h);
        listBuffer.background(255); 
        
        if (assets.handwritingFont) {
            listBuffer.textFont(assets.handwritingFont);
        }
        
        let currentY = -this.scrollY;
        
        for (const endingId in this.allEndingsData) {
            const endingInfo = this.allEndingsData[endingId];
            const isUnlocked = unlockedEndingsSet.has(endingId);
            
            listBuffer.stroke(220);
            listBuffer.strokeWeight(1);
            listBuffer.line(0, currentY + this.entryHeight, this.w, currentY + this.entryHeight);

            if (isUnlocked) {
                listBuffer.fill(0);
                listBuffer.noStroke();
                listBuffer.textAlign(LEFT, TOP);
                listBuffer.textSize(20);
                listBuffer.textStyle(BOLD);
                listBuffer.text(endingInfo.title, 20, currentY + 15);
                
                listBuffer.textSize(14);
                listBuffer.textStyle(NORMAL);
                listBuffer.fill(100);
                listBuffer.text(endingInfo.description, 20, currentY + 45);
            } else {
                listBuffer.fill(180);
                listBuffer.noStroke();
                listBuffer.textAlign(LEFT, TOP);
                listBuffer.textSize(20);
                listBuffer.textStyle(BOLD);
                listBuffer.text("???", 20, currentY + 15);

                listBuffer.textSize(14);
                listBuffer.textStyle(NORMAL);
                listBuffer.fill(200);
                listBuffer.text("Keep playing to unlock.", 20, currentY + 45);
            }

            currentY += this.entryHeight;
        }
        image(listBuffer, this.x, this.y);
    }
}

