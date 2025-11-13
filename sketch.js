let textContent; // 存储原始文本
let words = []; // 存储分割后的单词
let typedWords = []; // 已打字的单词
let typingSpeed = 3; // 打字速度控制 (数字越大越快)
let currentIndex = 0; // 当前打字位置
let isTypingComplete = false; // 是否完成打字
let fontSize = 14; // 初始字体大小
let particleSystems = []; // 存储粒子系统(用于拖尾效果)
let maxParticles = 500; // 最大粒子数量
let particleLifetime = 60; // 粒子生命周期
let interactionRadius = 100; // 交互半径
let interactionStrength = 0.1; // 交互强度

function setup() {
  createCanvas(600, 800);
  background(255);
  
  // 原始文本
  textContent = "Consider a world in which cause and effect are erratic. Sometimes the first precedes the second, sometimes the second the first. Or perhaps cause lies forever in the past while effect in the future, but future and past are entwined. On the terrace of the Bundesterrasse is a striking view: the river Aare below and the Bernese Alps above. A man stands there just now, absently emptying his pockets and weeping. Without reason, his friends have abandoned him. No one calls any more, no one meets him for supper or beer at the tavern, no one invites him to their home. For twenty years he has been the ideal friend to his friends, generous, interested, soft-spoken, affectionate. What could have happened? A week from this moment on the terrace, the same man begins acting the goat, insulting everyone, wearing smelly clothes, stingy with money, allowing no one to come to his apartment on Laupenstrasse. Which was cause and which effect, which future and which past? In Zürich, strict laws have recently been approved by the Council. Pistols may not be sold to the public. Banks and trading houses must be audited. All visitors, whether entering Zürich by boat on the river Limmat or by rail on the Selnau line, must be searched for contraband. The civil military is doubled. One month after the crackdown, Zürich is ripped by the worst crimes in its history. In daylight, people are murdered in the Weinplatz, paintings are stolen from the Kunsthaus, liquor is drunk in the pews of the Münsterhof. Are these criminal acts not misplaced in time? Or perhaps the new laws were action rather than reaction? A young woman sits near a fountain in the Botanischer Garten. She comes here every Sunday to smell the white double violets, the musk rose, the matted pink gillyflowers. Suddenly, her heart soars, she blushes, she paces anxiously, she becomes happy for no reason. Days later, she meets a young man and is smitten with love. Are the two events not connected? But by what bizarre connection, by what twist in time, by what reversed logic? In this acausal world, scientists are helpless. Their predictions become postdictions. Their equations become justifications, their logic, illogic. Scientists turn reckless and mutter like gamblers who cannot stop betting. Scientists are buffoons, not because they are rational but because the cosmos is irrational. Or perhaps it is not because the cosmos is irrational but because they are rational. Who can say which, in an acausal world? In this world, artists are joyous. Unpredictability is the life of their paintings, their music, their novels. They delight in events not forecasted, happenings without explanation, retrospective. Most people have learned how to live in the moment. The argument goes that if the past has uncertain effect on the present, there is no need to dwell on the past. And if the present has little effect on the future, present actions need not be weighed for their consequence. Rather, each act is an island in time, to be judged on its own. Families comfort a dying uncle not because of a likely inheritance, but because he is loved at that moment. Employees are hired not because of their résumés, but because of their good sense in interviews. Clerks trampled by their bosses fight back at each insult, with no fear for their future. It is a world of impulse. It is a world of sincerity. It is a world in which every word spoken speaks just to that moment, every glance given has only one meaning, each touch has no past or no future, each kiss is a kiss of immediacy.";
  
  // 分割文本为单词数组
  words = splitTextToWords(textContent);
  
  // 创建GUI控件
  createControls();
}

function draw() {
  background(255, 20); // 半透明背景用于拖尾效果
  
  // 打字机效果
  if (!isTypingComplete && frameCount % (10 - typingSpeed) === 0) {
    if (currentIndex < words.length) {
      typedWords.push(new Word(
        words[currentIndex].word, 
        words[currentIndex].x, 
        words[currentIndex].y, 
        random([color(255, 0, 0), color(0, 0, 255)]), // 随机红蓝
        fontSize
      ));
      currentIndex++;
    } else {
      isTypingComplete = true;
    }
  }
  
  // 更新和显示已打字的单词
  for (let word of typedWords) {
    word.update();
    word.display();
  }
  
  // 更新和显示粒子系统
  for (let i = particleSystems.length - 1; i >= 0; i--) {
    particleSystems[i].update();
    particleSystems[i].display();
    if (particleSystems[i].particles.length === 0) {
      particleSystems.splice(i, 1);
    }
  }
}

// 将文本分割为单词并计算初始位置
function splitTextToWords(text) {
  let tokens = text.split(/\s+/); // 按空格分割
  let result = [];
  let x = 10;
  let y = 20;
  let lineHeight = fontSize * 1.5;
  
  for (let token of tokens) {
    // 检查单词是否超出画布宽度
    let tokenWidth = textWidth(token + " ");
    if (x + tokenWidth > width - 10) {
      x = 10;
      y += lineHeight;
    }
    
    // 如果超出画布高度，停止添加
    if (y > height - lineHeight) break;
    
    result.push({
      word: token,
      x: x,
      y: y
    });
    
    x += tokenWidth;
  }
  
  return result;
}

// Word类 - 表示每个单词对象
class Word {
  constructor(word, x, y, col, size) {
    this.word = word;
    this.originalX = x;
    this.originalY = y;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.col = col;
    this.size = size;
    this.velocity = createVector(0, 0);
    this.isSelected = false;
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.groupId = -1; // 不属于任何组
    this.groupWords = []; // 同组的其他单词
    this.groupCenter = createVector(0, 0);
  }
  
  // 更新单词位置
  update() {
    if (this.isDragging) {
      this.x = mouseX + this.dragOffsetX;
      this.y = mouseY + this.dragOffsetY;
    } else {
      // 向目标位置移动
      let dx = this.targetX - this.x;
      let dy = this.targetY - this.y;
      this.velocity.x = dx * 0.1;
      this.velocity.y = dy * 0.1;
      
      // 添加一些随机运动
      if (!this.isSelected && random() < 0.02) {
        this.velocity.x += random(-0.5, 0.5);
        this.velocity.y += random(-0.5, 0.5);
      }
      
      this.x += this.velocity.x;
      this.y += this.velocity.y;
      
      // 限制速度
      this.velocity.mult(0.95);
    }
    
    // 检查鼠标悬停
    let d = dist(mouseX, mouseY, this.x, this.y);
    this.isSelected = d < textWidth(this.word)/2 + 10;
    
    // 如果单词属于一个组，计算组中心
    if (this.groupId !== -1) {
      this.calculateGroupCenter();
    }
  }
  
  // 计算组中心
  calculateGroupCenter() {
    if (this.groupWords.length === 0) return;
    
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    
    for (let word of this.groupWords) {
      sumX += word.x;
      sumY += word.y;
      count++;
    }
    
    this.groupCenter.set(sumX / count, sumY / count);
  }
  
  // 显示单词
  display() {
    push();
    fill(this.col);
    textSize(this.size);
    textAlign(LEFT, TOP);
    
    // 如果被选中或有交互，增加效果
    if (this.isSelected || this.isDragging) {
      stroke(0);
      strokeWeight(1);
      noFill();
      ellipse(this.x + textWidth(this.word)/2, this.y + this.size/2, 
             textWidth(this.word) + 10, this.size + 10);
      noStroke();
      fill(this.col);
    }
    
    text(this.word, this.x, this.y);
    pop();
  }
  
  // 检查点击
  checkPressed() {
    if (this.isSelected) {
      this.isDragging = true;
      this.dragOffsetX = this.x - mouseX;
      this.dragOffsetY = this.y - mouseY;
      return true;
    }
    return false;
  }
  
  // 释放
  release() {
    this.isDragging = false;
    
    // 创建拖尾粒子
    if (dist(this.x, this.y, this.targetX, this.targetY) > 10) {
      this.createTrail();
    }
    
    this.targetX = this.x;
    this.targetY = this.y;
  }
  
  // 创建拖尾效果
  createTrail() {
    let particles = [];
    let steps = 10;
    let prevX = this.targetX;
    let prevY = this.targetY;
    
    for (let i = 0; i < steps; i++) {
      let t = i / steps;
      let x = lerp(prevX, this.x, t);
      let y = lerp(prevY, this.y, t);
      
      for (let j = 0; j < 5; j++) {
        particles.push(new Particle(
          x, 
          y, 
          this.col,
          this.size * 0.5
        ));
      }
    }
    
    particleSystems.push(new ParticleSystem(particles));
  }
  
  // 与其他单词交互
  interactWith(other) {
    if (this === other) return;
    
    let d = dist(this.x, this.y, other.x, other.y);
    let minDist = (textWidth(this.word) + textWidth(other.word)) / 2 + 20;
    
    if (d < minDist) {
      // 排斥力
      let angle = atan2(this.y - other.y, this.x - other.x);
      let force = map(d, 0, minDist, interactionStrength * 2, 0);
      
      if (!this.isDragging) {
        this.velocity.x += cos(angle) * force;
        this.velocity.y += sin(angle) * force;
      }
      
      if (!other.isDragging) {
        other.velocity.x -= cos(angle) * force;
        other.velocity.y -= sin(angle) * force;
      }
    }
    
    // 如果属于同一组，有吸引力
    if (this.groupId !== -1 && this.groupId === other.groupId && d > minDist * 1.5) {
      let angle = atan2(other.y - this.y, other.x - this.x);
      let force = interactionStrength * 0.5;
      
      if (!this.isDragging) {
        this.velocity.x += cos(angle) * force;
        this.velocity.y += sin(angle) * force;
      }
      
      if (!other.isDragging) {
        other.velocity.x -= cos(angle) * force;
        other.velocity.y -= sin(angle) * force;
      }
    }
  }
  
  // 尝试与附近单词组成组
  tryFormGroup() {
    if (this.groupId !== -1) return; // 已经在一个组中
    
    let nearbyWords = [];
    
    for (let word of typedWords) {
      if (word !== this && dist(this.x, this.y, word.x, word.y) < interactionRadius) {
        nearbyWords.push(word);
      }
    }
    
    // 最多5个单词的组
    if (nearbyWords.length > 0 && nearbyWords.length <= 4) {
      let groupId = floor(random(100000)); // 随机组ID
      this.groupId = groupId;
      this.groupWords = [this];
      
      for (let word of nearbyWords) {
        word.groupId = groupId;
        word.groupWords = [];
      }
      
      // 更新所有组成员的groupWords数组
      let allGroupWords = [this, ...nearbyWords];
      for (let word of allGroupWords) {
        word.groupWords = allGroupWords.filter(w => w !== word);
      }
    }
  }
}

// 粒子类 - 用于拖尾效果
class Particle {
  constructor(x, y, col, size) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(0.5, 2));
    this.acc = createVector(0, 0);
    this.lifetime = particleLifetime;
    this.maxLifetime = particleLifetime;
    this.col = col;
    this.size = size;
  }
  
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.lifetime--;
  }
  
  display() {
    push();
    let alpha = map(this.lifetime, this.maxLifetime, 0, 200, 0);
    fill(red(this.col), green(this.col), blue(this.col), alpha);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.size);
    pop();
  }
  
  isDead() {
    return this.lifetime <= 0;
  }
}

// 粒子系统类
class ParticleSystem {
  constructor(particles) {
    this.particles = particles;
  }
  
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  display() {
    for (let particle of this.particles) {
      particle.display();
    }
  }
}

// 创建GUI控件
function createControls() {
  let controls = createDiv();
  controls.position(10, height + 10);
  
  // 打字速度控制
  let speedLabel = createP('Typing Speed:');
  speedLabel.parent(controls);
  let speedSlider = createSlider(1, 9, typingSpeed);
  speedSlider.parent(controls);
  speedSlider.input(function() {
    typingSpeed = this.value();
  });
  
  // 字体大小控制
  let sizeLabel = createP('Font Size:');
  sizeLabel.parent(controls);
  let sizeSlider = createSlider(8, 24, fontSize);
  sizeSlider.parent(controls);
  sizeSlider.input(function() {
    fontSize = this.value();
    for (let word of typedWords) {
      word.size = fontSize;
    }
  });
  
  // 交互半径控制
  let radiusLabel = createP('Interaction Radius:');
  radiusLabel.parent(controls);
  let radiusSlider = createSlider(20, 200, interactionRadius);
  radiusSlider.parent(controls);
  radiusSlider.input(function() {
    interactionRadius = this.value();
  });
  
  // 交互强度控制
  let strengthLabel = createP('Interaction Strength:');
  strengthLabel.parent(controls);
  let strengthSlider = createSlider(0, 0.5, interactionStrength, 0.01);
  strengthSlider.parent(controls);
  strengthSlider.input(function() {
    interactionStrength = this.value();
  });
  
  // 重置按钮
  let resetButton = createButton('Reset');
  resetButton.parent(controls);
  resetButton.mousePressed(function() {
    // 重置所有单词到原始位置
    for (let i = 0; i < typedWords.length; i++) {
      typedWords[i].x = words[i].x;
      typedWords[i].y = words[i].y;
      typedWords[i].targetX = words[i].x;
      typedWords[i].targetY = words[i].y;
      typedWords[i].velocity = createVector(0, 0);
      typedWords[i].groupId = -1;
      typedWords[i].groupWords = [];
    }
  });
}

// 鼠标按下事件
function mousePressed() {
  for (let word of typedWords) {
    if (word.checkPressed()) {
      // 拖动时断开组连接
      word.groupId = -1;
      word.groupWords = [];
      return;
    }
  }
}

// 鼠标释放事件
function mouseReleased() {
  for (let word of typedWords) {
    word.release();
    
    // 尝试形成组
    if (word.isSelected) {
      word.tryFormGroup();
    }
  }
}

// 单词之间的交互
function mouseMoved() {
  for (let i = 0; i < typedWords.length; i++) {
    for (let j = i + 1; j < typedWords.length; j++) {
      typedWords[i].interactWith(typedWords[j]);
    }
  }
}