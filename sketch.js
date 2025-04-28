/*
 * SmashHead - Retro Bouncing Game (Full Clean Version)
 * Version: V17.0 (Fixed Visitor Count + Scanlines + Hover + Floating Heads)
 */

// --- Global Variables ---
let normalHeadImages = [], hitHeadImages = [];
let imgNormal, imgHit, hammerImg;
let isSwapped = false, hitSwapStartTime = 0, imageSwapDuration = 100;
let gameState = 'titleScreen';
let titleMusicStarted = false, selectMusicStarted = false, gameMusicStarted = false;
let squeakSound, owSound, fartSound, retroFont;
let musicPlaying, musicSelect, musicGameplay, musicGameOver, selectBlipSound;
let score = 0, highScore = 0;
let x, y, vx, vy, angle = 0, angularVelocity = 0;
let imgWidth, imgHeight, hammerDisplayWidth, hammerDisplayHeight;
let bumpers = [], particles = [], effects = [];
let hammerAngle, hammerRestAngle, hammerStrikeAngle, hammerTargetAngle;
let isHammerStriking = false, hammerAnimStartTime = 0, hammerHitCheckDone = false;
let pacManBlack, pacManBlue, pacManYellow, pacManPink, pacManCyan, pacManOrange, pacManRed;
let ghostColors = [];
let titleHue = 0;
let scanlines;
let selectHue = 0;
let chosenHeadIndex = 0;
let hoveredHeadIndex = -1, previousHoverIndex = -1;
let smashHeadTargetY = 0, smashHeadY = -150, smashHeadAnimDone = false;
let hammerPivotRatioX = 0.5, hammerPivotRatioY = 0.85;
let hammerHeadCenterRatioX = 0.5, hammerHeadCenterRatioY = 0.2;
let hammerHeadRadiusRatio = 0.3;
let gameDuration = 120, gameStartTime = 0, gameTimer = 120;
let shakeAmount = 0, shakeDuration = 0, shakeStartTime = 0;
let currentAttributionText = '', isMuted = false;
let muteButton;
let titleFaceX, titleFaceY, titleHammerX, titleHammerY, titleSweepStartX, titleSweepEndX;
let titleFaceSpeed = 2.5;
let comboCount = 0;
let lastBumperHitTime = 0;
let bumperRadius = 8, numInitialBumpers = 15;
let maxImageWidth = 150;
let hammerLandedHit = false;
let retroFontURL = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';

function createScanlinesGraphic() {
  scanlines = createGraphics(windowWidth, windowHeight);
  scanlines.pixelDensity(1);
  scanlines.stroke(0, 35);
  scanlines.strokeWeight(1);
  for (let i = 0; i < windowHeight; i += 3) {
    scanlines.line(0, i, windowWidth, i);
  }
}

// Attribution
const titleAttribution = 'Music: bit-shift/Kevin MacLeod (uppbeat.io)';
const selectAttribution = 'Music: bitmap.mp3 (source TBD)';
const gameplayAttribution = 'Music: Panic.mp3 (source TBD)';
const gameOverAttribution = 'Music: pookatori/Kevin MacLeod (uppbeat.io)';

// --- Preload Assets ---
function preload() {
  soundFormats('mp3', 'wav', 'ogg');
  retroFont = loadFont('PressStart2P-Regular.ttf');
  imgNormal = loadImage('face5.png');
  hammerImg = loadImage('hammer.png');
  musicPlaying = loadSound('bit.mp3');
  musicSelect = loadSound('bitmap.mp3');
  musicGameplay = loadSound('Panic.mp3');
  musicGameOver = loadSound('pooka.mp3');
  squeakSound = loadSound('boing.mp3');
  owSound = loadSound('ow.mp3');
  fartSound = loadSound('dry-fart.mp3');
  selectBlipSound = loadSound('blip.mp3');
}
// --- Setup ---
function setup() {
  let loadingMsg = select('#loading-message');
  if (loadingMsg) loadingMsg.remove();

  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  colorMode(RGB, 255, 255, 255, 255);
  imageMode(CENTER);
  textAlign(LEFT, TOP);

  // Colors
  pacManBlack = color(0);
  pacManBlue = color(33, 33, 255);
  pacManYellow = color(255, 255, 0);
  pacManPink = color(255, 184, 255);
  pacManCyan = color(0, 255, 255);
  pacManOrange = color(255, 184, 82);
  pacManRed = color(255, 0, 0);
  ghostColors = [pacManPink, pacManCyan, pacManOrange, pacManRed, pacManBlue];

  createScanlinesGraphic();

  hammerRestAngle = -PI / 5;
  hammerStrikeAngle = PI / 2.5;
  hammerAngle = hammerRestAngle;
  hammerTargetAngle = hammerRestAngle;

  calculateImageSize();

  muteButton = createButton('Mute');
  muteButton.position(20, height - 40);
  muteButton.style('padding', '5px 10px');
  muteButton.style('font-size', '12px');
  muteButton.mousePressed(toggleMute);

  initializeTitleScreenState();
  resetOtherStates();

  currentAttributionText = titleAttribution;
}

// --- Create Scanlines Effect ---
function createScanlinesGraphic() {
  scanlines = createGraphics(width, height);
  scanlines.pixelDensity(1);
  scanlines.stroke(0, 35);
  scanlines.strokeWeight(1);
  for (let i = 0; i < height; i += 3) {
    scanlines.line(0, i, width, i);
  }
}

// --- Reset Other States ---
function resetOtherStates() {
  isSwapped = false;
  titleMusicStarted = false;
  selectMusicStarted = false;
  gameMusicStarted = false;
  isMuted = isMuted;
  isHammerStriking = false;
  score = 0;
  hammerLandedHit = false;
  selectHue = random(360);
  particles = [];
  effects = [];
  shakeAmount = 0;
  lastBumperHitTime = 0;
  comboCount = 0;
}

// --- Calculate Image Size for Normal and Hammer ---
function calculateImageSize() {
  if (!imgNormal || imgNormal.width <= 0) {
    imgWidth = 100;
    imgHeight = 100;
    return;
  }
  let dw = width * 0.15;
  let targetWidth = min(dw, maxImageWidth);
  let scaleFactor = targetWidth / imgNormal.width;
  imgWidth = imgNormal.width * scaleFactor;
  imgHeight = imgNormal.height * scaleFactor;

  hammerDisplayWidth = imgWidth;
  hammerDisplayHeight = (hammerImg && hammerImg.width > 0) ? 
    hammerImg.height * (hammerDisplayWidth / hammerImg.width) : 
    hammerDisplayWidth * 1.5;
}

// --- Initialize Title Screen Values ---
function initializeTitleScreenState() {
  titleSweepStartX = -(imgWidth || 100) - 50;
  titleSweepEndX = width + (imgWidth || 100) + 50;
  titleFaceX = titleSweepStartX;
  titleFaceY = height * 0.55;
  titleHammerX = titleSweepStartX - 150;
  titleHammerY = height * 0.6;
  smashHeadTargetY = height * 0.20;
  smashHeadY = -150;
  smashHeadAnimDone = false;
}
// ============================
// --- DRAW FUNCTION (Main Dispatcher) ---
// ============================
function draw() {
  push(); // Screen shake handling
  let currentShake = 0;
  if (millis() < shakeStartTime + shakeDuration) {
    currentShake = shakeAmount;
    let offsetX = random(-currentShake, currentShake);
    let offsetY = random(-currentShake, currentShake);
    translate(offsetX, offsetY);
  } else {
    shakeAmount = 0;
  }

  if (gameState === 'titleScreen') drawTitleScreen();
  else if (gameState === 'characterSelect') drawCharacterSelect();
  else if (gameState === 'playing') drawPlayingState();
  else if (gameState === 'gameOver') drawGameOverWin();
  else if (gameState === 'gameOverTime') drawGameOverTime();

  if (scanlines) {
    image(scanlines, 0, 0, width, height);
  }

  drawAttributionText();
  pop();
}

// ============================
// --- DRAW TITLE SCREEN ---
// ============================
function drawTitleScreen() {
  background(pacManBlack);

  if (!isMuted && !titleMusicStarted && musicPlaying?.isLoaded()) {
    musicPlaying.loop();
    titleMusicStarted = true;
    currentAttributionText = titleAttribution;
  }

  if (!smashHeadAnimDone) {
    smashHeadY = lerp(smashHeadY, smashHeadTargetY, 0.08);
    if (abs(smashHeadY - smashHeadTargetY) < 1) {
      smashHeadY = smashHeadTargetY;
      smashHeadAnimDone = true;
    }
  }

  textAlign(CENTER, CENTER);
  if (retroFont) textFont(retroFont);
  else textFont('monospace');

  textSize(80);
  push();
  colorMode(HSB, 360, 100, 100, 100);
  titleHue = (titleHue + 1.5) % 360;
  fill(titleHue, 90, 100);
  text("SMASH", width / 2, smashHeadY);
  text("HEAD", width / 2, smashHeadY + headlineSpacing);
  pop();
  colorMode(RGB, 255, 255, 255, 255);

  if (smashHeadAnimDone) {
    textSize(28);
    fill(pacManYellow);
    text("It's a Banger", width / 2, smashHeadTargetY + headlineSpacing + 70);

    fill(pacManCyan);
    textSize(18);
    text('High Score: ' + highScore, width / 2, smashHeadTargetY + headlineSpacing + 110);
    
    let pressKeyY = height * 0.80;
    textSize(24);
    if (frameCount % 45 < 25) fill(pacManYellow);
    else fill(pacManPink);
    text("PRESS ANY KEY TO CHOOSE HEAD", width / 2, pressKeyY);
  }
}

// ============================
// --- DRAW CHARACTER SELECT ---
// ============================
function drawCharacterSelect() {
  background(pacManBlack);

  if (!isMuted && !selectMusicStarted && musicSelect?.isLoaded()) {
    musicSelect.loop();
    selectMusicStarted = true;
    currentAttributionText = selectAttribution;
  }

  // SmashHEAD logo at top
  textAlign(CENTER, CENTER);
  if (retroFont) textFont(retroFont);
  else textFont('monospace');
  push();
  colorMode(HSB, 360, 100, 100, 100);
  fill((frameCount) % 360, 90, 100);
  textSize(40);
  text("SMASH", width / 2, 60);
  text("HEAD", width / 2, 100);
  pop();

  // How to Play Box
  drawHowToPlay();

  // Pick Your Head
  drawHeadSelect();
}

// ============================
// --- How to Play Section ---
// ============================
function drawHowToPlay() {
  let instructionY = 160;
  let instructionWidth = width * 0.65;
  let hammerScale = 0.8;
  if (!hammerDisplayWidth || !hammerDisplayHeight) calculateImageSize();
  let hammerW = hammerDisplayWidth * hammerScale;
  let hammerH = hammerDisplayHeight * hammerScale;
  let blockStartX = (width - (instructionWidth + hammerW + 40)) / 2;
  let imgX = blockStartX + hammerW / 2;
  let imgY = instructionY + hammerH * 0.6;
  let textX = imgX + hammerW / 2 + 20;

  const instructionsArray = [
    "HOW TO PLAY",
    "",
    "SmashHead needs your help!",
    "",
    "Smack the head with the hammer to bounce around.",
    "",
    "Hit all the dots before time runs out.",
    "",
    "More smacks = more chaos = more wins."
  ];

  let instructionSize = 20;
  let lineSpacing = 25;
  let estimatedLines = instructionsArray.length;
  let estTextHeight = estimatedLines * lineSpacing + 30;
  let frameHeight = max(hammerH, estTextHeight) + 40;
  let frameWidth = instructionWidth + hammerW + 80;

  noFill();
  stroke(pacManCyan);
  strokeWeight(4);
  rect(blockStartX - 20, instructionY - 30, frameWidth, frameHeight);
  noStroke();

  fill(0, 0, 100, 80);
  rect(blockStartX - 15, instructionY - 25, frameWidth - 10, frameHeight - 10);

  textAlign(LEFT, TOP);
  textLeading(lineSpacing);

  for (let i = 0; i < instructionsArray.length; i++) {
    let line = instructionsArray[i];
    if (line.trim() !== "") {
      push();
      colorMode(HSB, 360, 100, 100, 100);
      if (i === 0) {
        let pulse = 1 + 0.05 * sin(millis() / 300);
        textSize(instructionSize * pulse);
      } else {
        textSize(instructionSize);
      }
      fill((frameCount + i * 20) % 360, 80, 100);
      text(line, textX, instructionY + i * lineSpacing, instructionWidth);
      pop();
    }
  }

  if (hammerImg && typeof hammerDisplayHeight === 'number') {
    push();
    translate(imgX, imgY);
    rotate(-PI / 6);
    imageMode(CENTER);
    image(hammerImg, 0, 0, hammerW, hammerH);
    pop();
    imageMode(CENTER);
  }
}

// ============================
// --- Draw Floating Heads Selection ---
// ============================
function drawHeadSelect() {
  let centerX = width / 2;
  let selectY = height * 0.75;
  let spacing = 150;
  let headNames = ["Ol' Greenie", "Blurg", "Frank"];

  selectHue = (selectHue + 1.5) % 360;
  textAlign(CENTER, CENTER);
  textSize(26);
  push();
  colorMode(HSB, 360, 100, 100, 100);
  fill(selectHue, 90, 100);
  text("Pick your head to SMASH!", centerX, selectY - 120);
  pop();
  colorMode(RGB, 255, 255, 255, 255);

  for (let i = 0; i < 3; i++) {
    let displayImg = normalHeadImages[i];
    let currentSelectHeadSize = typeof selectHeadSize === 'number' ? selectHeadSize : 90;
    let imgXPos = centerX + (i - 1) * spacing;
    let currentHeadHeight = currentSelectHeadSize;
    let aspect = 1;

    if (displayImg && displayImg.width > 0) {
      aspect = displayImg.height / displayImg.width || 1;
      currentHeadHeight = currentSelectHeadSize * aspect;
    }

    let hoverOffsetY = 0;
    let hoverScale = 1.0;
    if (i === hoveredHeadIndex) {
      hoverOffsetY = -10 * abs(sin(millis() / 200));
      hoverScale = 1.05;
    }

    push();
    translate(imgXPos, selectY + hoverOffsetY);
    scale(hoverScale);
    if (displayImg && displayImg.width > 0) {
      imageMode(CENTER);
      image(displayImg, 0, 0, currentSelectHeadSize, currentHeadHeight);
    } else {
      fill(pacManRed);
      rectMode(CENTER);
      rect(0, 0, currentSelectHeadSize, currentSelectHeadSize);
    }
    pop();

    fill(pacManYellow);
    textAlign(CENTER, TOP);
    text(headNames[i], imgXPos, selectY + currentHeadHeight * 0.5 + 20);
  }
}
// ============================
// --- PLAYING STATE ---
// ============================
function drawPlayingState() {
  background(pacManBlack);

  if (!isMuted && !gameMusicStarted && musicGameplay?.isLoaded()) {
    musicGameplay.loop();
    gameMusicStarted = true;
    currentAttributionText = gameplayAttribution;
  }

  if (isSwapped && millis() - hitSwapStartTime > imageSwapDuration) {
    currentImage = imgNormal;
    isSwapped = false;
  }

  noStroke();

  // Draw bumpers
  for (let b of bumpers) {
    if (!b.active) continue;
    let eh = constrain(b.hits, 0, b.maxHits - 1);
    let ca = map(eh, 0, b.maxHits - 1, 255, 70);
    fill(red(b.baseColor), green(b.baseColor), blue(b.baseColor), ca);
    ellipse(b.x, b.y, b.r * 2, b.r * 2);
  }

  // Handle hammer striking
  updateHammer();

  // Draw bouncing face
  drawBouncingFace();

  // Timer and score
  drawGameHUD();

  // Handle transition to game over
  if (gameState === 'playing') {
    handleTimerCountdown();
  } else if (gameState === 'fadingOut') {
    handleFadingOut();
  }
}

// --- Hammer Update ---
function updateHammer() {
  if (isHammerStriking) {
    let elapsed = millis() - hammerAnimStartTime;
    let p = constrain(elapsed / hammerAnimDuration, 0, 1);

    if (p < 0.5) hammerAngle = lerp(hammerRestAngle, hammerStrikeAngle, p * 2);
    else hammerAngle = lerp(hammerStrikeAngle, hammerRestAngle, (p - 0.5) * 2);

    if (!hammerHitCheckDone && p >= 0.4 && p <= 0.6) {
      checkHammerHit();
      hammerHitCheckDone = true;
    }

    if (p >= 1) {
      isHammerStriking = false;
      hammerAngle = hammerRestAngle;
      if (addBumperAfterSwing) {
        if (!hammerLandedHit && potentialBumperX > 0 && potentialBumperY > 0) {
          bumpers.push({
            x: potentialBumperX,
            y: potentialBumperY,
            r: bumperRadius,
            baseColor: random(ghostColors),
            hits: 0,
            maxHits: bumperMaxHits,
            active: true
          });
        }
        addBumperAfterSwing = false;
        potentialBumperX = -1;
        potentialBumperY = -1;
      }
    }
  } else {
    hammerAngle = hammerRestAngle;
  }

  // Draw hammer following the mouse
  if (hammerImg && typeof hammerDisplayHeight === 'number') {
    let cpxo = hammerDisplayWidth * hammerPivotRatioX;
    let cpyo = hammerDisplayHeight * hammerPivotRatioY;
    push();
    translate(mouseX, mouseY);
    rotate(hammerAngle);
    imageMode(CORNER);
    image(hammerImg, -cpxo, -cpyo, hammerDisplayWidth, hammerDisplayHeight);
    imageMode(CENTER);
    pop();
  }
}

// --- Draw Bouncing Face ---
function drawBouncingFace() {
  if (imgNormal && currentImage && typeof imgWidth === 'number' && imgWidth > 0) {
    angle += angularVelocity;
    angularVelocity *= angularDamping;

    x += vx;
    y += vy;

    let halfW = imgWidth / 2;
    let halfH = imgHeight / 2;

    // Wall bounces
    if (x - halfW <= 0 || x + halfW >= width) {
      vx *= -1;
      angularVelocity += spinAmount * Math.sign(vy || 1);
    }
    if (y - halfH <= 0 || y + halfH >= height) {
      vy *= -1;
      angularVelocity += spinAmount * -Math.sign(vx || 1);
    }

    // Bumper collisions
    checkBumperCollisions();

    // Draw face
    push();
    translate(x, y);
    rotate(angle);
    image(currentImage, 0, 0, imgWidth, imgHeight);
    pop();

    // Particle trail (fun bounce effect)
    if (frameCount % 4 === 0) {
      let particleColor = color(255, 255, 0, 150);
      particles.push({
        x: x + random(-imgWidth / 4, imgWidth / 4),
        y: y + random(-imgHeight / 4, imgHeight / 4),
        vx: random(-0.5, 0.5),
        vy: random(-0.5, 0.5),
        lifespan: random(20, 40),
        color: particleColor,
        size: random(3, 6)
      });
    }
  }
}

// --- Draw HUD (Score/Timer) ---
function drawGameHUD() {
  if (retroFont) textFont(retroFont);
  else textFont('monospace');

  textSize(16);
  fill(pacManYellow);
  textAlign(LEFT, TOP);
  text('SCORE: ' + score, 20, 20);

  textAlign(RIGHT, TOP);
  let timerColor = (gameTimer <= 10) ? pacManRed : pacManYellow;
  textSize(20);
  fill(timerColor);
  text('TIME: ' + gameTimer, width - 20, 20);

  // Draw timer bar
  let timerBarWidth = 200;
  let timerBarHeight = 15;
  let timerBarX = width - timerBarWidth - 20;
  let timerBarY = 50;
  let timerProgress = gameTimer / gameDuration;

  fill(50, 50, 50);
  rect(timerBarX, timerBarY, timerBarWidth, timerBarHeight);

  fill(lerpColor(pacManRed, pacManYellow, timerProgress));
  rect(timerBarX, timerBarY, timerBarWidth * timerProgress, timerBarHeight);

  noFill();
  stroke(150);
  strokeWeight(1);
  rect(timerBarX, timerBarY, timerBarWidth, timerBarHeight);
  noStroke();
}

// --- Handle Timer Countdown ---
function handleTimerCountdown() {
  let elapsedSeconds = floor((millis() - gameStartTime) / 1000);
  gameTimer = max(0, gameDuration - elapsedSeconds);

  if (gameTimer <= 0) {
    changeStateToGameOverTime();
  } else {
    if (bumpers.length > 0 && bumpers.every(b => !b.active)) {
      checkAndSaveHighScore();
      if (musicGameplay?.isPlaying()) {
        musicGameplay.stop();
        gameMusicStarted = false;
      }
      gameState = 'fadingOut';
      gameOverStartTimeFrame = frameCount;
    }
  }
}

// --- Handle Fading to Win ---
function handleFadingOut() {
  let fadeDuration = 60;
  let fadeProgress = constrain(frameCount - gameOverStartTimeFrame, 0, fadeDuration) / fadeDuration;
  fill(0, 0, 0, fadeProgress * 255);
  rect(0, 0, width, height);

  if (fadeProgress >= 1) {
    gameState = 'gameOver';
    calculateGameOverImageSizeAndPosition();
    if (!isMuted && musicGameOver?.isLoaded() && !musicGameOver.isPlaying()) {
      musicGameOver.loop();
      currentAttributionText = gameOverAttribution;
    }
  }
}
// ============================
// --- GAME OVER (WIN) STATE ---
// ============================
function drawGameOverWin() {
  background(pacManBlack);

  // Confetti Effect
  if (frameCount % 3 === 0 && particles.length < 200) {
    let confettiX = random(width);
    let confettiColor = random(ghostColors);
    particles.push({
      x: confettiX,
      y: random(-20, 0),
      vx: random(-0.5, 0.5),
      vy: random(1.5, 4),
      lifespan: 150,
      color: color(red(confettiColor), green(confettiColor), blue(confettiColor), 200),
      size: random(5, 10),
      isConfetti: true
    });
  }

  // Draw winning head bouncing
  if (imgNormal && typeof gameOverY === 'number') {
    gameOverY += gameOverVY;
    let hgh = gameOverImgHeight / 2;
    let bTop = gameOverBounceTop;
    let bBottom = gameOverBounceBottom;

    if (gameOverY - hgh <= bTop) {
      gameOverY = bTop + hgh;
      gameOverVY *= -1;
    } else if (gameOverY + hgh >= bBottom) {
      gameOverY = bBottom - hgh;
      gameOverVY *= -1;
    }

    image(imgNormal, width / 2, gameOverY, gameOverImgWidth, gameOverImgHeight);
  } else if (imgNormal) {
    image(imgNormal, width / 2, height * 0.3, imgWidth * 1.2, imgHeight * 1.2);
  }

  // Winning Text
  if (retroFont) textFont(retroFont);
  else textFont('monospace');
  
  fill(pacManYellow);
  textAlign(CENTER, CENTER);

  let textY = (typeof gameOverBounceBottom === 'number' ? gameOverBounceBottom : height * 0.45) + 60;

  textSize(32);
  text("YOU WIN!", width / 2, textY);

  textSize(20);
  text("FINAL SCORE: " + score, width / 2, textY + 60);

  fill(pacManCyan);
  text('High Score: ' + highScore, width / 2, textY + 90);

  textSize(14);
  text("(Press any key to restart)", width / 2, textY + 120);
}

// ============================
// --- GAME OVER (TIME OUT) STATE ---
// ============================
function drawGameOverTime() {
  background(pacManBlack);

  if (imgNormal && typeof imgWidth === 'number') {
    image(imgNormal, width / 2, height * 0.3, imgWidth * 1.2, imgHeight * 1.2);
  }

  if (retroFont) textFont(retroFont);
  else textFont('monospace');

  fill(pacManRed);
  textAlign(CENTER, CENTER);

  let textY = height * 0.55;

  textSize(32);
  text("Oh no, you lost!", width / 2, textY);

  textSize(20);
  text("FINAL SCORE: " + score, width / 2, textY + 50);

  fill(pacManCyan);
  text('High Score: ' + highScore, width / 2, textY + 80);

  textSize(14);
  text("(Press any key to restart)", width / 2, textY + 110);
}
// ============================
// --- FINAL UTILITY FUNCTIONS ---
// ============================

// Draw Attribution Text (music credit and mute hint)
function drawAttributionText() {
  push();
  textFont('sans-serif');
  textSize(10);
  textAlign(RIGHT, BOTTOM);
  let muteText = isMuted ? "[M] Muted / " : "[M] Music ON / ";
  fill(180);
  text(muteText + currentAttributionText, width - 10, height - 10);
  pop();
}

// Draw and Update Particles (for bounces, confetti, effects)
function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.lifespan -= 1;
    p.size *= 0.98;

    if (p.lifespan <= 0 || p.size < 0.5) {
      particles.splice(i, 1);
    } else {
      noStroke();
      let currentAlpha = map(p.lifespan, 0, 40, 0, alpha(p.color || color(255)));
      fill(red(p.color || 255), green(p.color || 255), blue(p.color || 255), currentAlpha);

      if (p.isConfetti) {
        push();
        translate(p.x, p.y);
        rotate(p.angle || 0);
        p.angle = (p.angle || 0) + p.vx * 0.1;
        rect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        pop();
      } else {
        ellipse(p.x, p.y, p.size, p.size);
      }
    }
  }
}

// Draw and Update Floating Effects (combos text like "2x" "3x")
function updateAndDrawEffects() {
  for (let i = effects.length - 1; i >= 0; i--) {
    let fx = effects[i];
    fx.lifespan -= 1;
    fx.y -= 0.5; // Slowly rise

    if (fx.lifespan <= 0) {
      effects.splice(i, 1);
    } else {
      push();
      let currentAlpha = map(fx.lifespan, 0, fx.initialLifespan, 0, 255);
      textSize(fx.size);
      textAlign(CENTER, CENTER);
      if (retroFont) textFont(retroFont);
      else textFont('monospace');
      fill(red(fx.color), green(fx.color), blue(fx.color), currentAlpha);
      text(fx.text, fx.x, fx.y);
      pop();
    }
  }
  function createScanlinesGraphic() {
  scanlines = createGraphics(windowWidth, windowHeight);
  scanlines.pixelDensity(1);
  scanlines.stroke(0, 35); // Black lines, semi-transparent
  scanlines.strokeWeight(1);

  for (let i = 0; i < windowHeight; i += 3) {
    scanlines.line(0, i, windowWidth, i);
  }
}

