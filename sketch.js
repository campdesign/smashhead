/*
 * SmashHead - Retro Bounce Game V17.0 (Floating Heads Update)
 * - Floating Heads Effect
 * - Rainbow Text Animations
 * - Fixed Centering, Tighter Layout
 * - Visitor Counter & Favicon supported
 */

// --- Global Variables ---
let normalHeadImages = [], hitHeadImages = [], imgNormal, imgHit, hammerImg;
let gameState = 'titleScreen', selectHue = 0, hoveredHeadIndex = -1;
let retroFont, hammerDisplayWidth, hammerDisplayHeight;
let isMuted = false, musicPlaying, musicSelect, musicGameplay, musicGameOver;
let titleMusicStarted = false, selectMusicStarted = false, gameMusicStarted = false;
let currentAttributionText = '';
let smashHeadFloatingOffset = [0, 0, 0];

// Colors
let pacManBlack, pacManYellow, pacManCyan, pacManRed;

function preload() {
  retroFont = loadFont('PressStart2P-Regular.ttf');
  imgNormal = loadImage('face5.png');
  hammerImg = loadImage('hammer.png');
  musicPlaying = loadSound('bit.mp3');
  musicSelect = loadSound('bitmap.mp3');
  musicGameplay = loadSound('Panic.mp3');
  musicGameOver = loadSound('pooka.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB);
  textAlign(CENTER, CENTER);
  pacManBlack = color(0);
  pacManYellow = color(255, 255, 0);
  pacManCyan = color(0, 255, 255);
  pacManRed = color(255, 0, 0);

  hammerDisplayWidth = 100;
  hammerDisplayHeight = 150;

  normalHeadImages = [imgNormal, imgNormal, imgNormal];
}

function draw() {
  background(pacManBlack);
  if (gameState === 'titleScreen') {
    drawTitleScreen();
  } else if (gameState === 'characterSelect') {
    drawCharacterSelect();
  }
}

function drawTitleScreen() {
  fill(pacManYellow);
  textSize(50);
  text('SMASH HEAD', width/2, height/2);
}

function drawCharacterSelect() {
  background(pacManBlack);

  if (!isMuted && !selectMusicStarted && musicSelect?.isLoaded()) {
    musicSelect.loop();
    selectMusicStarted = true;
  }

  // Rainbow SmashHead mini-logo
  push();
  colorMode(HSB);
  fill((frameCount) % 360, 90, 100);
  textSize(40);
  text('SMASH', width/2, 50);
  text('HEAD', width/2, 90);
  pop();

  // Instructions Box
  let instructionsArray = [
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

  let instructionY = 140;
  let instructionWidth = width * 0.65;
  let lineSpacing = 26;
  let textX = width * 0.2;

  fill(0, 0, 100, 80);
  noStroke();
  rect(width*0.1, instructionY-40, width*0.8, 300);
  stroke(pacManCyan);
  strokeWeight(4);
  noFill();
  rect(width*0.1, instructionY-40, width*0.8, 300);
  noStroke();

  textAlign(LEFT, TOP);
  for (let i = 0; i < instructionsArray.length; i++) {
    let line = instructionsArray[i];
    if (line.trim() !== "") {
      push();
      colorMode(HSB);
      fill((frameCount + i * 20) % 360, 80, 100);
      if (i === 0) {
        textSize(22);
      } else {
        textSize(18);
      }
      text(line, textX, instructionY + i * lineSpacing);
      pop();
    }
  }

  // Heads Floating
  let centerX = width/2;
  let selectY = height * 0.72;
  let spacing = 140;
  let headNames = ["Ol' Greenie", "Blurg", "Frank"];

  selectHue = (selectHue + 1) % 360;

  // Headline
  push();
  colorMode(HSB);
  fill(selectHue, 90, 100);
  textSize(28);
  text('Pick your head to SMASH!', centerX, selectY - 100);
  pop();

  // Floating heads
  for (let i = 0; i < 3; i++) {
    let imgXPos = centerX + (i-1) * spacing;
    let floatOffset = 10 * sin(radians(frameCount*2 + i*60));
    imageMode(CENTER);
    if (normalHeadImages[i]) {
      image(normalHeadImages[i], imgXPos, selectY + floatOffset, 80, 80);
    } else {
      fill(pacManRed);
      rect(imgXPos, selectY + floatOffset, 80, 80);
    }

    // Names
    fill(pacManYellow);
    textSize(16);
    text(headNames[i], imgXPos, selectY + 50 + floatOffset);
  }
}

function keyPressed() {
  if (gameState === 'titleScreen') {
    gameState = 'characterSelect';
  }
}

function mousePressed() {
  userStartAudio();
}

function userStartAudio() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}
