@ -1,17 +1,235 @@
// --- SmashHead Retro Game V17 (Clean Full Build) ---
// Heads float and hover match properly, fonts load, layout polished

// --- Global Variables ---
let normalHeadImages = [], hitHeadImages = [];
let imgNormal, imgHit, currentImage;
let hammerImg, squeakSound, owSound, fartSound, retroFont;
let musicPlaying, musicSelect, musicGameplay, musicGameOver, selectBlipSound;
let gameState = 'titleScreen';
let score = 0, highScore = 0;
let x, y, vx, vy, angle = 0, angularVelocity = 0;
let imgWidth, imgHeight;
let hammerAngle = 0, hammerTargetAngle = 0, isHammerStriking = false;
let hammerDisplayWidth, hammerDisplayHeight;
let bumpers = [], particles = [], effects = [];
let isMuted = false, muteButton;
let titleHue = 0, smashHeadY = -150, smashHeadTargetY, smashHeadAnimDone = false;
let titleFaceX, titleFaceY, titleHammerX, titleHammerY;
let titleSweepStartX, titleSweepEndX;
let hoveredHeadIndex = -1, previousHoverIndex = -1;
let selectHue = 0;
let hammerRestAngle, hammerStrikeAngle;
let ghostColors = [];
let pacManBlack, pacManBlue, pacManYellow, pacManPink, pacManCyan, pacManOrange, pacManRed;
let gameTimer = 120, gameStartTime = 0, gameDuration = 120;
let normalHeadFloatOffsets = [0, 0, 0];
let normalHeadFloatSpeeds = [0.015, 0.017, 0.02]; // Different float speeds
let selectedHeadIndex = 0;
let scanlines;
let currentAttributionText = '';
let titleAttribution = 'Music: bit-shift/Kevin MacLeod (uppbeat.io/...) License: AZCT0WLNSVYIVLKN';
let selectAttribution = 'Music: bitmap.mp3 (Source?) License: ???';
let gameplayAttribution = 'Music: Panic.mp3 (Source?) License: ???';
let gameOverAttribution = 'Music: pookatori/Kevin MacLeod (uppbeat.io/...) License: 44IE20MPZFDGHQC5';

// --- Preload ---
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
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textAlign(CENTER, CENTER);
  colorMode(RGB, 255, 255, 255, 255);

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

  smashHeadTargetY = height * 0.2;

  // Load head images
  normalHeadImages = [
    loadImage('face5.png'),
    loadImage('face4.png'),
    loadImage('face3.png')
  ];
  hitHeadImages = [
    loadImage('face5b.png'),
    loadImage('face4b.png'),
    loadImage('face3b.png')
  ];
  selectedHeadIndex = 0;
  imgNormal = normalHeadImages[selectedHeadIndex];
  imgHit = hitHeadImages[selectedHeadIndex];
  currentImage = imgNormal;
  calculateImageSize();

  muteButton = createButton('Mute');
  muteButton.position(20, height - 40);
  muteButton.style('padding', '5px 10px');
  muteButton.style('font-size', '12px');
  muteButton.mousePressed(toggleMute);

  gameState = 'titleScreen';
}
// --- Main draw loop ---
function draw() {
  push();

  if (shakeAmount > 0 && millis() < shakeStartTime + shakeDuration) {
    let offsetX = random(-shakeAmount, shakeAmount);
    let offsetY = random(-shakeAmount, shakeAmount);
    translate(offsetX, offsetY);
  }

  background(pacManBlack);

  if (gameState === 'titleScreen') {
    drawTitleScreen();
  } else if (gameState === 'characterSelect') {
    drawCharacterSelect();
  } else if (gameState === 'playing') {
    drawPlayingState();
  } else if (gameState === 'gameOver') {
    drawGameOverWin();
  } else if (gameState === 'gameOverTime') {
    drawGameOverTime();
  }

  if (scanlines) {
    image(scanlines, 0, 0, width, height);
  }

  drawAttributionText();

  pop();
}
function drawTitleScreen() {
  background(pacManBlack);

  if (!isMuted && !titleMusicStarted && musicPlaying?.isLoaded()) {
    musicPlaying.loop();
    titleMusicStarted = true;
    currentAttributionText = titleAttribution;
  }

  // Animate SMASH HEAD logo
  titleHue = (titleHue + 1.5) % 360;
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

    // Floating face animation
    let faceX = width / 2 + sin(frameCount * 0.05) * 100;
    let faceY = height * 0.5 + cos(frameCount * 0.04) * 20;

    if (imgNormal && typeof imgWidth === 'number') {
      imageMode(CENTER);
      image(imgNormal, faceX, faceY, imgWidth, imgHeight);
    }

    // Hammer follows face
    let hammerX = lerp(hammerTargetX || 0, faceX, 0.1);
    let hammerY = lerp(hammerTargetY || 0, faceY, 0.1);
    hammerTargetX = hammerX;
    hammerTargetY = hammerY;

    if (hammerImg && typeof hammerDisplayHeight === 'number') {
      push();
      translate(hammerX, hammerY);
      rotate(hammerAngle);
      imageMode(CORNER);
      image(hammerImg, -hammerDisplayWidth * 0.5, -hammerDisplayHeight * 0.8, hammerDisplayWidth, hammerDisplayHeight);
      pop();
      imageMode(CENTER);
    }

    // "Press Any Key" Glow Text
    let pressKeyY = height * 0.85;
    let baseColor = (frameCount % 60 < 30) ? pacManYellow : pacManPink;

    textAlign(CENTER, CENTER);
    if (retroFont) textFont(retroFont);
    else textFont('monospace');

    noStroke();
    fill(255, 255, 255, 80);
    textSize(26);
    text("PRESS ANY KEY", width / 2 + 1, pressKeyY + 1);
    text("PRESS ANY KEY", width / 2 - 1, pressKeyY - 1);

    fill(baseColor);
    textSize(24);
    text("PRESS ANY KEY", width / 2, pressKeyY);
  }
}
function drawCharacterSelect() {
  background(pacManBlack);

  // --- Music on Select Screen ---
  if (!isMuted && !selectMusicStarted && musicSelect?.isLoaded()) {
    musicSelect.loop();
    selectMusicStarted = true;
    currentAttributionText = selectAttribution;
  }

  // --- SmashHEAD Logo at Top (50% smaller) ---
  textAlign(CENTER, CENTER);
  if (retroFont) textFont(retroFont);
  else textFont('monospace');

  // --- SmashHEAD Logo Smaller at Top ---
  push();
  colorMode(HSB, 360, 100, 100, 100);
  fill((frameCount) % 360, 90, 100);
@ -36,7 +254,6 @@ function drawCharacterSelect() {
  let frameX = blockStartX - framePadding / 2;
  let frameY = instructionY - framePadding * 1.5;

  // Instructions Array
  const instructionsArray = [
    "HOW TO PLAY",
    "",
@ -100,8 +317,8 @@ function drawCharacterSelect() {

  // --- Pick Your Head Section ---
  let centerX = width / 2;
  let selectY = frameY + frameHeight + 170; // Lower heads
  let spacing = 150; // tighter heads
  let selectY = frameY + frameHeight + 180; // Push it lower
  let spacing = 160; // Tighter together
  let headNames = ["Ol' Greenie", "Blurg", "Frank"];

  selectHue = (selectHue + 1.5) % 360;
@ -110,7 +327,7 @@ function drawCharacterSelect() {
  push();
  colorMode(HSB, 360, 100, 100, 100);
  fill(selectHue, 90, 100);
  text("Pick your head to SMASH!", centerX, selectY - 80); // headline above
  text("Pick your head to SMASH!", centerX, selectY - 100);
  pop();
  colorMode(RGB, 255, 255, 255, 255);

@ -131,7 +348,7 @@ function drawCharacterSelect() {

    if (i === hoveredHeadIndex) {
      hoverOffsetY = -10 * abs(sin(millis() / 200));
      hoverScale = 1.05;
      hoverScale = 1.08;
    }

    push();
@ -153,3 +370,4 @@ function drawCharacterSelect() {
    text(headNames[i], imgXPos, selectY + currentHeadHeight * 0.5 + 20);
  }
}

here is my currennt code. 

I want to move the heads down on teh Choose your head to smsh page
