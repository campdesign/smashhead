/*
 * Retro Bouncing Image Game - V16.0 (Clickable Heads & UI Polish)
 * - Added Scanlines overlay.
 * - Added Glow effect to "Press Any Key" text.
 * - Added Pixel Frame around instructions.
 * - Added Hover Selection Box for heads.
 * - Added Blip sound on hover/select (using blip.mp3).
 * - Adjusted layout of character select screen.
 * - Added Screen Shake on hammer hit.
 * - Added Particle Effects (trailing, bumper destroy, hammer impact).
 * - Added Visual Timer Bar.
 * - Added High Score saving and display using localStorage.
 * - Added Combo system (timing, score bonus, visual effect).
 * - Added Confetti effect on Win screen.
 * - Removed Pick buttons, made head images clickable.
 * - Moved head names below images.
 * - Enhanced How-to-Play box (larger text, background effect).
 */

// --- Global Variables ---
// Head Image Arrays
let normalHeadImages = [];
let hitHeadImages = [];
// Gameplay Image Variables
let imgNormal, imgHit, currentImage;
// Other Images
let hammerImg;

let isSwapped = false, hitSwapStartTime = 0, imageSwapDuration = 100;
let gameState = 'titleScreen';
let gameOverStartTimeFrame = 0;

let scanlines; // For CRT effect

// Sounds & Font & Music
let squeakSound, owSound, fartSound, retroFont;
let musicPlaying, musicSelect, musicGameplay, musicGameOver;
let selectBlipSound; // For blip.mp3
let titleMusicStarted = false, selectMusicStarted = false, gameMusicStarted = false;

let score = 0;
let gameTimer = 120; let gameStartTime = 0; let gameDuration = 120;
let x, y, vx, vy, angle = 0, angularVelocity = 0;
let imgWidth, imgHeight;
let angularDamping = 0.98, spinAmount = 0.1, hammerHitSpinAmount = 0.3;
let maxImageWidth = 150;
let lastBounceTime = 0, bounceCooldown = 100;
let bumpers = [], numInitialBumpers = 15, bumperRadius = 8, bumperMaxHits = 3;
let hammerAngle, hammerRestAngle, hammerStrikeAngle;
let hammerTargetAngle, isHammerStriking = false, hammerAnimStartTime = 0;
let hammerAnimDuration = 180, hammerHitCheckDone = false;
let hammerDisplayWidth, hammerDisplayHeight;
let hammerPivotRatioX = 0.5, hammerPivotRatioY = 0.85;
let hammerHeadCenterRatioX = 0.5, hammerHeadCenterRatioY = 0.2;
let hammerHeadRadiusRatio = 0.3;
let potentialBumperX = -1, potentialBumperY = -1;
let addBumperAfterSwing = false, hammerLandedHit = false;
let titleHue = 0;
let titleFaceX, titleFaceY, titleHammerX, titleHammerY;
let titleFaceSpeed = 2.5;
let titleHammerFollowSpeed = 0.08;
let titleHammerAngle = 0, isTitleHammerStriking = false, titleHammerAnimStartTime = 0;
let titleSweepStartX, titleSweepEndX;
let smashHeadY, smashHeadTargetY, smashHeadAnimDone = false;
let headlineSpacing = 65;
// Removed selectButton variables
let selectHeadSize;
let chosenHeadIndex = 0;
let selectHue = 0;
let gameOverImgWidth, gameOverImgHeight, gameOverY, gameOverVY;
let gameOverBounceTop, gameOverBounceBottom, gameOverBounceSpeed = 1.8;
let pacManBlack, pacManBlue, pacManYellow, pacManPink, pacManCyan, pacManOrange, pacManRed;
let ghostColors = [];
let titleAttribution = 'Music: bit-shift/Kevin MacLeod (uppbeat.io/...) License: AZCT0WLNSVYIVLKN';
let selectAttribution = 'Music: bitmap.mp3 (Source?) License: ???'; // UPDATE NEEDED
let gameplayAttribution = 'Music: Panic.mp3 (Source?) License: ???'; // UPDATE NEEDED
let gameOverAttribution = 'Music: pookatori/Kevin MacLeod (uppbeat.io/...) License: 44IE20MPZFDGHQC5';
let currentAttributionText = '';
let isMuted = false; // Mute state
let muteButton;

// --- New Feature Variables ---
let shakeAmount = 0; let shakeDuration = 0; let shakeStartTime = 0; // Screen Shake
let particles = []; let effects = []; // Particles & Effects (combos)
let highScore = 0; // High Score
let hoveredHeadIndex = -1; let previousHoverIndex = -1; // Head Selection Hover
let lastBumperHitTime = 0; let comboCount = 0; // Combo System
const COMBO_WINDOW = 1000; // 1 second window for combos

// --- Preload Assets ---
function preload() {
  print("--- Preload Starting ---");
  const sl=(n)=>console.log(`Preload OK: ${n}`); const sle=(e,n)=>console.error(`Preload FAIL: ${n}!`,e); const ale=(e,n)=>console.error(`Preload FAIL: ${n}! Check path/name.`,e);
  soundFormats('mp3','wav','ogg');
  retroFont = loadFont('PressStart2P-Regular.ttf', ()=>sl('Font'), (e)=>ale(e,'Font'));
  imgNormal = loadImage('face5.png', ()=>sl('head1_normal (face5.png)'), (e)=>ale(e,'face5.png'));
  hammerImg = loadImage('hammer.png', ()=>sl('hammer.png'), (e)=>ale(e,'hammer.png'));
  musicPlaying = loadSound('bit.mp3', ()=>sl('Title Music'), (e)=>sle(e,'MusicPlay'));
  chosenHeadIndex = 0; currentImage = imgNormal; normalHeadImages[0] = imgNormal; imgHit = null;
  print("--- Preload Finished ---");
}

// --- Setup ---
function setup() {
  print("--- Setup Starting ---");
  let loadingMsg = select('#loading-message'); if (loadingMsg) loadingMsg.remove();
  createCanvas(windowWidth, windowHeight); pixelDensity(1);
  colorMode(RGB, 255, 255, 255, 255); imageMode(CENTER); textAlign(LEFT, TOP);

  pacManBlack=color(0); pacManBlue=color(33,33,255); pacManYellow=color(255,255,0); pacManPink=color(255,184,255); pacManCyan=color(0,255,255); pacManOrange=color(255,184,82); pacManRed=color(255,0,0);
  ghostColors=[pacManPink,pacManCyan,pacManOrange,pacManRed,pacManBlue];

  createScanlinesGraphic();

  // Create Mute Button (Pick buttons removed)
  muteButton = createButton('Mute'); muteButton.position(20, height - 40); muteButton.style('padding', '5px 10px'); muteButton.style('font-size', '12px'); muteButton.mousePressed(toggleMute);

  hammerRestAngle = -PI / 5; hammerStrikeAngle = PI / 2.5; hammerAngle = hammerRestAngle; hammerTargetAngle = hammerRestAngle;
  calculateImageSize();

  print("--- Starting Deferred Asset Loading ---");
  const slSetup=(n)=>console.log(`Setup OK: ${n}`); const sleSetup=(e,n)=>console.error(`Setup FAIL: ${n}!`,e); const aleSetup=(e,n)=>console.error(`Setup FAIL: ${n}! Check path/name.`,e);
  if (normalHeadImages.length < 2) {
    normalHeadImages[1]=loadImage('face4.png',()=>slSetup('head2_normal'),(e)=>aleSetup(e,'face4.png'));
    normalHeadImages[2]=loadImage('face3.png',()=>slSetup('head3_normal'),(e)=>aleSetup(e,'face3.png'));
    hitHeadImages[0]=loadImage('face5b.png',()=> {slSetup('head1_hit'); if(chosenHeadIndex === 0) imgHit = hitHeadImages[0]; }, (e)=>aleSetup(e,'face5b.png'));
    hitHeadImages[1]=loadImage('face4b.png',()=>slSetup('head2_hit'),(e)=>aleSetup(e,'face4b.png'));
    hitHeadImages[2]=loadImage('face3b.png',()=>slSetup('head3_hit'),(e)=>aleSetup(e,'face3b.png'));
    if (!imgHit && normalHeadImages[0] && hitHeadImages[0]) imgHit = hitHeadImages[0];
  }
  squeakSound = loadSound('boing.mp3', ()=>slSetup('boing'), (e)=>sleSetup(e,'boing'));
  owSound = loadSound('ow.mp3', ()=>slSetup('ow'), (e)=>sleSetup(e,'ow'));
  fartSound = loadSound('dry-fart.mp3', ()=>slSetup('fart'), (e)=>sleSetup(e,'fart'));
  musicSelect = loadSound('bitmap.mp3', ()=>slSetup('Select Music'), (e)=>sleSetup(e,'MusicSelect'));
  musicGameplay = loadSound('Panic.mp3', ()=>slSetup('Gameplay Music'), (e)=>sleSetup(e,'MusicGameplay'));
  musicGameOver = loadSound('pooka.mp3', ()=>slSetup('GO Music'), (e)=>sleSetup(e,'MusicGO'));
  selectBlipSound = loadSound('blip.mp3', ()=>slSetup('Select Blip'), (e)=>sleSetup(e,'Select Blip'));

  try { let storedScore = getItem('smashHeadHighScore'); if (storedScore !== null) { highScore = int(storedScore); print(`Loaded High Score: ${highScore}`); } else { print("No high score found."); } } catch (e) { console.error("Could not access localStorage:", e); }

  initializeTitleScreenState();
  gameOverBounceTop = height * 0.15; gameOverBounceBottom = height * 0.45;
  resetOtherStates();
  gameState = 'titleScreen'; currentAttributionText = titleAttribution;
  print("--- Setup Finished ---");
}

// --- Helper Functions ---
function createScanlinesGraphic() { scanlines = createGraphics(width, height); scanlines.pixelDensity(1); scanlines.stroke(0, 35); scanlines.strokeWeight(1); for (let i = 0; i < height; i += 3) { scanlines.line(0, i, width, i); } }
function resetOtherStates() { isSwapped = false; titleMusicStarted = false; selectMusicStarted = false; gameMusicStarted = false; isMuted = isMuted; isHammerStriking = false; score = 0; addBumperAfterSwing = false; hammerLandedHit = false; selectHue = random(360); particles = []; effects = []; shakeAmount = 0; lastBumperHitTime = 0; comboCount = 0; resetImageState(); }
function initializeTitleScreenState() { if(typeof imgWidth!=='number'|| !imgWidth)calculateImageSize(); titleSweepStartX=-(imgWidth||100)-50; titleSweepEndX=width+(imgWidth||100)+50; titleFaceX=titleSweepStartX; titleFaceY=height*0.55; titleHammerX=titleSweepStartX-150; titleHammerY=height*0.6; titleHue=random(360); smashHeadTargetY=height*0.20; smashHeadY=-150; smashHeadAnimDone=false; titleMusicStarted=false; titleHammerAngle=hammerRestAngle; isTitleHammerStriking=false; currentAttributionText=titleAttribution; console.log("Title Screen State Initialized"); }
function createInitialBumpers() { bumpers = []; let margin = 50; let R = bumperRadius; for (let i = 0; i < numInitialBumpers; i++) { let safeX = random(margin + R, width - margin - R); let safeY = random(margin + R, height - margin - R); bumpers.push({ x: safeX, y: safeY, r: bumperRadius, baseColor: random(ghostColors), hits: 0, maxHits: bumperMaxHits, active: true }); } console.log(`Created ${bumpers.length} gameplay bumpers.`); }
function calculateImageSize() { if (!imgNormal) { if(normalHeadImages[chosenHeadIndex]){imgNormal=normalHeadImages[chosenHeadIndex];} else if(normalHeadImages[0]){imgNormal=normalHeadImages[0];} else {imgWidth=100;imgHeight=100;console.warn("No images for size calc!");}} if(imgNormal && imgNormal.width > 0){ let dw=width*0.15; let targetWidth=min(dw,maxImageWidth); let sf=targetWidth/imgNormal.width; imgWidth=imgNormal.width*sf; imgHeight=imgNormal.height*sf; if(imgHeight>height*0.8){sf=(height*0.8)/imgNormal.height; imgWidth=imgNormal.width*sf; imgHeight=imgNormal.height*sf;}} else {if(!imgWidth){imgWidth=100;imgHeight=100;}} hammerDisplayWidth=imgWidth; if(hammerImg?.width>0){hammerDisplayHeight=hammerImg.height*(hammerDisplayWidth/hammerImg.width);} else {hammerDisplayHeight=hammerDisplayWidth*1.5;} selectHeadSize=imgWidth*0.9; }
function resetImageState() { let margin = 30; x = (imgWidth/2 || 50) + margin; y = (imgHeight/2 || 50) + margin; angle = 0; angularVelocity = 0; let speed = 5; vx = random(2, speed); vy = random(2, speed); }
function triggerShake(amount, duration) { shakeAmount = amount; shakeDuration = duration; shakeStartTime = millis(); }
function checkAndSaveHighScore() { if (score > highScore) { highScore = score; try { storeItem('smashHeadHighScore', highScore); print(`New High Score Saved: ${highScore}`); } catch (e) { console.error("Failed to save high score:", e); } } }
function updateAndDrawParticles() { for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; p.x += p.vx; p.y += p.vy; p.lifespan -= 1; p.size *= 0.98; if (p.lifespan <= 0 || p.size < 0.5) { particles.splice(i, 1); } else { noStroke(); let currentAlpha = map(p.lifespan, 0, 40, 0, alpha(p.color || color(255))); fill(red(p.color || 255), green(p.color || 255), blue(p.color || 255), currentAlpha); if (p.isConfetti) { push(); translate(p.x, p.y); rotate(p.angle || 0); p.angle = (p.angle || 0) + p.vx * 0.1; rect(-p.size/2, -p.size/4, p.size, p.size/2); pop(); } else { ellipse(p.x, p.y, p.size, p.size); } } } }
function updateAndDrawEffects() { for (let i = effects.length - 1; i >= 0; i--) { let fx = effects[i]; fx.lifespan -= 1; fx.y -= 0.5; if (fx.lifespan <= 0) { effects.splice(i, 1); } else { push(); let currentAlpha = map(fx.lifespan, 0, fx.initialLifespan, 0, 255); textSize(fx.size); textAlign(CENTER, CENTER); if (retroFont) textFont(retroFont); else textFont('monospace'); fill(red(fx.color), green(fx.color), blue(fx.color), currentAlpha); text(fx.text, fx.x, fx.y); pop(); } } }

// --- Input Handlers ---
function selectHead(index) { // Called by mousePressed now
    if (selectBlipSound?.isLoaded() && !isMuted) { selectBlipSound.play(); }
    chosenHeadIndex = index - 1; console.log(`Head index ${chosenHeadIndex} selected`);
    // Ensure images are loaded before starting game
    if (normalHeadImages[chosenHeadIndex] && hitHeadImages[chosenHeadIndex]) {
        startGame(); // Start the game
    } else {
        console.error(`Images for head ${chosenHeadIndex + 1} not loaded yet!`);
        // Optional: Visual feedback like making the selection box red briefly?
        alert(`Head ${chosenHeadIndex + 1} images still loading... Please wait.`);
        // Stay on character select screen
        gameState = 'characterSelect';
    }
}

function mousePressed() {
    userStartAudio();
    if (gameState === 'playing') { // Hammer swing in playing state
        if (!isHammerStriking) {
            isHammerStriking=true; hammerTargetAngle=hammerStrikeAngle; hammerAnimStartTime=millis(); hammerHitCheckDone=false; hammerLandedHit=false;
            let margin=50; if(mouseX>margin && mouseX<width-margin && mouseY>margin && mouseY<height-margin && mouseY>50){ potentialBumperX = mouseX; potentialBumperY = mouseY; addBumperAfterSwing = true; } else { addBumperAfterSwing = false; }
        }
    } else if (gameState === 'characterSelect') { // Head selection click
        let selectY = height * 0.70;
        let spacing = width / 4;
        let currentSelectHeadSize = typeof selectHeadSize === 'number' ? selectHeadSize : 90;

        for (let i = 0; i < 3; i++) {
            let imgXPos = spacing * (i + 1);
            let displayImg = normalHeadImages[i];
            let headLeft, headRight, headTop, headBottom, currentHeadHeight = currentSelectHeadSize;

            if (displayImg && displayImg.width > 0) {
                let aspect = displayImg.height / displayImg.width || 1;
                currentHeadHeight = currentSelectHeadSize * aspect;
            }
            // Calculate bounds regardless of image loaded status for click detection
            headLeft = imgXPos - currentSelectHeadSize / 2;
            headRight = imgXPos + currentSelectHeadSize / 2;
            headTop = selectY - currentHeadHeight / 2;
            headBottom = selectY + currentHeadHeight / 2;

            if (mouseX > headLeft && mouseX < headRight && mouseY > headTop && mouseY < headBottom) {
                selectHead(i + 1); // Call selectHead with index 1, 2, or 3
                break; // Stop checking once a head is clicked
            }
        }
    }
}

function keyPressed() { userStartAudio(); if (key === 'm' || key === 'M') { toggleMute(); } else if (gameState === 'gameOver' || gameState === 'gameOverTime') { restartSketch(); } else if (gameState === 'titleScreen') { goToCharacterSelect(); } }
function mouseMoved() { if (gameState === 'characterSelect') { let currentHover = -1; let selectY = height * 0.70; let spacing = width / 4; let currentSelectHeadSize = typeof selectHeadSize === 'number' ? selectHeadSize : 90; for (let i = 0; i < 3; i++) { let imgXPos = spacing * (i + 1); let displayImg = normalHeadImages[i]; let headLeft, headRight, headTop, headBottom, currentHeadHeight = currentSelectHeadSize; if (displayImg && displayImg.width > 0) { let aspect = displayImg.height / displayImg.width || 1; currentHeadHeight = currentSelectHeadSize * aspect; headLeft = imgXPos - currentSelectHeadSize / 2; headRight = imgXPos + currentSelectHeadSize / 2; headTop = selectY - currentHeadHeight / 2; headBottom = selectY + currentHeadHeight / 2; } else { headLeft = imgXPos - currentSelectHeadSize / 2; headRight = imgXPos + currentSelectHeadSize / 2; headTop = selectY - currentSelectHeadSize / 2; headBottom = selectY + currentSelectHeadSize / 2; } if (mouseX > headLeft && mouseX < headRight && mouseY > headTop && mouseY < headBottom) { currentHover = i; break; } } hoveredHeadIndex = currentHover; if (hoveredHeadIndex !== previousHoverIndex) { if (hoveredHeadIndex !== -1 && selectBlipSound?.isLoaded() && !isMuted) { selectBlipSound.play(); } previousHoverIndex = hoveredHeadIndex; } } else { hoveredHeadIndex = -1; previousHoverIndex = -1; } }
function windowResized() { resizeCanvas(windowWidth,windowHeight); createScanlinesGraphic(); gameOverBounceTop=height*0.15; gameOverBounceBottom=height*0.45; let baseImg = imgNormal || normalHeadImages[0]; if(baseImg){ calculateImageSize(); let halfW=imgWidth/2; let halfH=imgHeight/2; if(gameState==='playing'||gameState==='fadingOut'){x=constrain(x,halfW,width-halfW); y=constrain(y,halfH,height-halfH);} if(gameState==='gameOver'){calculateGameOverImageSizeAndPosition(); if(typeof gameOverY==='number'&&typeof gameOverImgHeight==='number'){gameOverY=constrain(gameOverY,gameOverBounceTop+gameOverImgHeight/2,gameOverBounceBottom-gameOverImgHeight/2);}} else if (gameState === 'gameOverTime') { if(imgNormal) calculateImageSize(); } else if(gameState==='titleScreen'){ initializeTitleScreenState(); } else if(gameState === 'characterSelect'){ /* Layout updated in draw */ } } if (muteButton) { muteButton.position(20, height - 40); } }

// ============================
// --- DRAW FUNCTION (Dispatcher) ---
// ============================
function draw() {
    push(); // Isolate screen shake
    let currentShake = 0; if (millis() < shakeStartTime + shakeDuration) { currentShake = shakeAmount; let offsetX = random(-currentShake, currentShake); let offsetY = random(-currentShake, currentShake); translate(offsetX, offsetY); } else { shakeAmount = 0; }

    // Call state-specific drawing functions
    if (gameState === 'titleScreen') { drawTitleScreen(); }
    else if (gameState === 'characterSelect') { drawCharacterSelect(); }
    else if (gameState === 'playing' || gameState === 'fadingOut') { drawPlayingState(); }
    else if (gameState === 'gameOver') { drawGameOverWin(); }
    else if (gameState === 'gameOverTime') { drawGameOverTime(); }

    // Update particles/effects if in relevant states
    if (gameState === 'playing' || gameState === 'fadingOut' || gameState === 'gameOver') { updateAndDrawParticles(); }
    if (gameState === 'playing' || gameState === 'fadingOut') { updateAndDrawEffects(); }

    // Draw overlays (affected by shake)
    if (scanlines) { image(scanlines, 0, 0, width, height); }
    drawAttributionText();

    pop(); // Restore translation
} // End draw()


// ============================
// --- State-Specific Drawing Functions ---
// ============================

function drawTitleScreen() {
    background(pacManBlack);
    // Pick buttons removed
    if (!isMuted && !titleMusicStarted && musicPlaying?.isLoaded()) { musicPlaying.loop(); titleMusicStarted = true; currentAttributionText = titleAttribution; }
    titleHue = (titleHue + 1.5) % 360; if (!smashHeadAnimDone) { smashHeadY = lerp(smashHeadY, smashHeadTargetY, 0.08); if (abs(smashHeadY - smashHeadTargetY) < 1) { smashHeadY = smashHeadTargetY; smashHeadAnimDone = true;}}
    if (retroFont) textFont(retroFont); else textFont('monospace'); textAlign(CENTER, CENTER); textSize(80); push(); colorMode(HSB, 360, 100, 100, 100); fill(titleHue, 90, 100); text("SMASH", width / 2, smashHeadY); text("HEAD", width / 2, smashHeadY + headlineSpacing); pop(); colorMode(RGB, 255, 255, 255, 255);
    if (smashHeadAnimDone) {
        textSize(28); fill(pacManYellow); text("It's a Banger", width / 2, smashHeadTargetY + headlineSpacing + 70);
        fill(pacManCyan); textSize(18); text('High Score: ' + highScore, width / 2, smashHeadTargetY + headlineSpacing + 110);
        if (typeof titleSweepEndX !== 'number') {titleSweepEndX = width + (imgWidth || 100); titleSweepStartX = - (imgWidth || 100);} titleFaceX+=titleFaceSpeed; if(titleFaceX>titleSweepEndX){titleFaceX=titleSweepStartX; titleHammerX=titleSweepStartX - 150;} titleFaceY=height*0.55+sin(frameCount*0.03)*20; titleHammerX+=titleFaceSpeed; titleHammerY=lerp(titleHammerY,titleFaceY,titleHammerFollowSpeed);
        if (frameCount % 100 === 0 && !isTitleHammerStriking) { isTitleHammerStriking = true; titleHammerAnimStartTime = millis(); }
        if (isTitleHammerStriking) { let e=millis()-hammerAnimStartTime; let p=constrain(e/hammerAnimDuration,0,1); if(p<0.5){titleHammerAngle=lerp(hammerRestAngle,hammerStrikeAngle,p*2);}else{titleHammerAngle=lerp(hammerStrikeAngle,hammerRestAngle,(p-0.5)*2);} if(p>=1){isTitleHammerStriking=false; titleHammerAngle=hammerRestAngle;}} else { titleHammerAngle = hammerRestAngle; }
        let titleFaceImg = imgNormal || normalHeadImages[0]; if (titleFaceImg && typeof imgWidth === 'number') image(titleFaceImg, titleFaceX, titleFaceY, imgWidth, imgHeight);
        if (hammerImg && typeof hammerDisplayHeight === 'number') { push(); translate(titleHammerX,titleHammerY); rotate(titleHammerAngle); image(hammerImg, 0, 0, hammerDisplayWidth, hammerDisplayHeight); pop(); }
        let pressKeyY = height * 0.80; let pressKeySize = 24; let glowSize = pressKeySize + 2; let baseColor = (frameCount % 45 < 25) ? pacManYellow : pacManPink; let glowColor = color(red(baseColor), green(baseColor), blue(baseColor), 80);
        textAlign(CENTER, CENTER); if (retroFont) textFont(retroFont); else textFont('monospace'); noStroke(); fill(glowColor); textSize(glowSize); text("PRESS ANY KEY TO CHOOSE HEAD", width / 2 + 1, pressKeyY + 1); text("PRESS ANY KEY TO CHOOSE HEAD", width / 2 - 1, pressKeyY - 1); fill(baseColor); textSize(pressKeySize); text("PRESS ANY KEY TO CHOOSE HEAD", width / 2, pressKeyY);
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
  push();
  colorMode(HSB, 360, 100, 100, 100);
  fill((frameCount) % 360, 90, 100);
  textSize(40);
  text("SMASH", width / 2, 60);
  text("HEAD", width / 2, 100);
  pop();

  // --- How to Play Box ---
  let instructionY = 160;
  let instructionWidth = width * 0.65;
  let hammerScale = 0.8;
  if (!hammerDisplayWidth || !hammerDisplayHeight) calculateImageSize();
  let hammerW = (hammerDisplayWidth || 100) * hammerScale;
  let hammerH = (hammerDisplayHeight || 150) * hammerScale;
  let totalBlockWidth = instructionWidth + hammerW + 40;
  let blockStartX = (width - totalBlockWidth) / 2;
  let imgX = blockStartX + hammerW / 2;
  let imgY = instructionY + hammerH * 0.6;
  let textX = imgX + hammerW / 2 + 20;
  let framePadding = 20;
  let frameX = blockStartX - framePadding / 2;
  let frameY = instructionY - framePadding * 1.5;

  // Instructions as an array of lines
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
  let frameHeight = max(hammerH + (imgY - instructionY) + framePadding, estTextHeight) + framePadding * 2;
  let frameWidth = totalBlockWidth + framePadding;

  // Draw outer frame
  noFill();
  stroke(pacManCyan);
  strokeWeight(4);
  rect(frameX, frameY, frameWidth, frameHeight);
  noStroke();

  // Draw subtle background inside frame
  fill(0, 0, 100, 80);
  noStroke();
  let innerPadding = 5;
  rect(frameX + innerPadding, frameY + innerPadding, frameWidth - 2 * innerPadding, frameHeight - 2 * innerPadding);

  // --- Draw Instructions Text, Line by Line ---
  textAlign(LEFT, TOP);
  textLeading(lineSpacing);

  for (let i = 0; i < instructionsArray.length; i++) {
    let line = instructionsArray[i];
    if (line.trim() !== "") {
      push();
      colorMode(HSB, 360, 100, 100, 100);

      // Pulse for HOW TO PLAY only
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

  // --- Draw Hammer Image ---
  if (hammerImg && typeof hammerDisplayHeight === 'number') {
    push();
    translate(imgX, imgY);
    rotate(-PI / 6);
    imageMode(CENTER);
    image(hammerImg, 0, 0, hammerW, hammerH);
    pop();
    imageMode(CENTER);
  }

  // --- Pick Your Head Section ---
  let selectY = frameY + frameHeight + 80;
  let spacing = width / 4;
  let btnWidth = 80;
  let headNames = ["Ol' Greenie", "Blurg", "Frank"];

  selectHue = (selectHue + 1.5) % 360;
  if (retroFont) textFont(retroFont);
  else textFont('monospace');
  textAlign(CENTER, CENTER);
  textSize(26);

  push();
  colorMode(HSB, 360, 100, 100, 100);
  fill(selectHue, 90, 100);
  text("Pick your head to SMASH!", width / 2, selectY - 50);
  pop();
  colorMode(RGB, 255, 255, 255, 255);

  // Draw heads, hover box, and names below
  textAlign(CENTER, TOP);
  textSize(16);
  for (let i = 0; i < 3; i++) {
    let displayImg = normalHeadImages[i];
    let currentSelectHeadSize = typeof selectHeadSize === 'number' ? selectHeadSize : 90;
    let imgXPos = spacing * (i + 1);
    let currentHeadHeight = currentSelectHeadSize;
    let aspect = 1;
    if (displayImg && displayImg.width > 0) {
      aspect = displayImg.height / displayImg.width || 1;
      currentHeadHeight = currentSelectHeadSize * aspect;
    }
    if (i === hoveredHeadIndex) {
      let boxPadding = 5;
      let boxW = currentSelectHeadSize + 2 * boxPadding;
      let boxH = currentHeadHeight + 2 * boxPadding;
      let boxX = imgXPos - boxW / 2;
      let boxY = selectY - boxH / 2;
      stroke(pacManYellow);
      strokeWeight(3);
      noFill();
      rect(boxX, boxY, boxW, boxH);
      noStroke();
    }
    if (displayImg && displayImg.width > 0) {
      image(displayImg, imgXPos, selectY, currentSelectHeadSize, currentHeadHeight);
    } else {
      fill(pacManRed);
      rect(imgXPos - currentSelectHeadSize / 2, selectY - currentSelectHeadSize / 2, currentSelectHeadSize, currentSelectHeadSize);
    }
    fill(pacManYellow);
    text(headNames[i], imgXPos, selectY + currentHeadHeight * 0.5 + 10);
  }
}

function drawPlayingState() {
    // Buttons removed
    background(pacManBlack);
    if (!isMuted && !gameMusicStarted && musicGameplay?.isLoaded()) { musicGameplay.loop(); gameMusicStarted = true; currentAttributionText = gameplayAttribution; }

    // Update effects (combos) - now called from main draw

    if(isSwapped && millis() - hitSwapStartTime > imageSwapDuration){ currentImage=imgNormal; isSwapped=false; }
    noStroke(); for(let b of bumpers){ if(!b.active) continue; let eh=constrain(b.hits,0,b.maxHits-1); let ca=map(eh,0,b.maxHits-1,255,70); fill(red(b.baseColor),green(b.baseColor),blue(b.baseColor),ca); ellipse(b.x,b.y,b.r*2,b.r*2); }
    if(isHammerStriking){ let e=millis()-hammerAnimStartTime; let p=constrain(e/hammerAnimDuration,0,1); if(p<0.5){hammerAngle=lerp(hammerRestAngle,hammerStrikeAngle,p*2);}else{hammerAngle=lerp(hammerStrikeAngle,hammerRestAngle,(p-0.5)*2);} if(!hammerHitCheckDone&&p>=0.4&&p<=0.6){checkHammerHit(); hammerHitCheckDone=true;} if(p>=1){isHammerStriking=false; hammerAngle=hammerRestAngle; if(addBumperAfterSwing){if(!hammerLandedHit){if(potentialBumperX>0&&potentialBumperY>0){bumpers.push({x:potentialBumperX,y:potentialBumperY,r:bumperRadius,baseColor:random(ghostColors),hits:0,maxHits:bumperMaxHits,active:true});}} addBumperAfterSwing=false; potentialBumperX=-1; potentialBumperY=-1;}}} else { hammerAngle = hammerRestAngle; }

    if(imgNormal && imgHit && currentImage && typeof imgWidth ==='number' && imgWidth > 0) {
        angle+=angularVelocity; angularVelocity*=angularDamping; if(abs(angularVelocity)<0.001)angularVelocity=0; x+=vx; y+=vy; let bounced=false; let currentTime=millis(); let halfW=imgWidth/2; let halfH=imgHeight/2; let approxImgRadius=min(halfW,halfH);
        if(x-halfW<=0){x=halfW; angularVelocity=spinAmount*Math.sign(vy||1); vx*=-1; bounced=true;}else if(x+halfW>=width){x=width-halfW; angularVelocity=spinAmount*Math.sign(vy||1); vx*=-1; bounced=true;} if(y-halfH<=0){y=halfH; angularVelocity=spinAmount*-Math.sign(vx||1); vy*=-1; bounced=true;}else if(y+halfH>=height){y=height-halfH; angularVelocity=spinAmount*-Math.sign(vx||1); vy*=-1; bounced=true;}

        for(let b of bumpers){ if(!b.active)continue; let d=dist(x,y,b.x,b.y); let cd=b.r+approxImgRadius; if(d<cd){
            let hitTime = millis(); if (hitTime - lastBumperHitTime < COMBO_WINDOW) { comboCount++; } else { comboCount = 1; } lastBumperHitTime = hitTime; let scoreBonus = 10 * comboCount; score += scoreBonus; if (comboCount >= 2) { let effectText = `${comboCount}x`; effects.push({ x: b.x, y: b.y - 15, text: effectText, lifespan: 60, initialLifespan: 60, size: 16 + comboCount * 2, color: color(255, 255, 0, 255) }); }
            let ovx=vx; let ovy=vy; let dx_c=x-b.x; let dy_c=y-b.y; if(abs(dx_c)>abs(dy_c)){if((dx_c>0&&vx<0)||(dx_c<0&&vx>0)){vx*=-1; angularVelocity=spinAmount*Math.sign(ovy||1);}}else{if((dy_c>0&&vy<0)||(dy_c<0&&vy>0)){vy*=-1; angularVelocity=spinAmount*-Math.sign(ovx||1);}} let ov=cd-d; let nx=dx_c/d||1; let ny=dy_c/d||0; x+=nx*(ov+1); y+=ny*(ov+1);
            b.hits++; if (b.hits >= b.maxHits) { b.active = false; for (let k = 0; k < 15; k++) { let angle = random(TWO_PI); let speed = random(1, 4); let particleColor = b.baseColor; particles.push({ x: b.x, y: b.y, vx: cos(angle) * speed, vy: sin(angle) * speed, lifespan: random(30, 60), color: color(red(particleColor), green(particleColor), blue(particleColor), 200), size: random(4, 8) }); } }
            bounced=true; break;
        }}

        if(bounced){ if(imgHit){currentImage=imgHit;} isSwapped=true; hitSwapStartTime=millis(); if(!isMuted && squeakSound?.isLoaded()&&(currentTime>lastBounceTime+bounceCooldown)){squeakSound.play(); lastBounceTime=currentTime;}}
        let speedSq = vx*vx + vy*vy; if (speedSq > 1 && frameCount % 4 === 0) { let particleColor = color(red(pacManYellow), green(pacManYellow), blue(pacManYellow), 150); particles.push({ x: x + random(-imgWidth / 4, imgWidth / 4), y: y + random(-imgHeight / 4, imgHeight / 4), vx: random(-0.5, 0.5) - vx * 0.1, vy: random(-0.5, 0.5) - vy * 0.1, lifespan: random(20, 40), color: particleColor, size: random(3, 6) }); }
        push(); translate(x,y); rotate(angle); image(currentImage,0,0,imgWidth,imgHeight); pop();

        if (gameState === 'playing') { let elapsedSeconds = floor((millis() - gameStartTime) / 1000); gameTimer = max(0, gameDuration - elapsedSeconds); if (gameTimer <= 0) { changeStateToGameOverTime(); } else { if (bumpers.length > 0 && bumpers.every(b => !b.active)) { checkAndSaveHighScore(); if (musicGameplay?.isPlaying()) { musicGameplay.stop(); gameMusicStarted = false;} gameState = 'fadingOut'; gameOverStartTimeFrame = frameCount; } } }
    } else { textAlign(CENTER,CENTER); fill(255,0,0); textSize(16); text("ERROR: Gameplay Images not ready!", width/2, height/2); }

    if(hammerImg&&typeof hammerDisplayHeight==='number'){ let cpxo=hammerDisplayWidth*hammerPivotRatioX; let cpyo=hammerDisplayHeight*hammerPivotRatioY; push(); translate(mouseX,mouseY); rotate(hammerAngle); imageMode(CORNER); image(hammerImg,-cpxo,-cpyo,hammerDisplayWidth,hammerDisplayHeight); imageMode(CENTER); pop(); }
    if (retroFont) textFont(retroFont); else textFont('monospace'); textSize(16); fill(pacManYellow); textAlign(LEFT, TOP); text('SCORE: ' + score, 20, 20);
    if (gameState === 'playing') { let timerColor = (gameTimer <= 10) ? pacManRed : pacManYellow; textSize(20); fill(timerColor); textAlign(RIGHT, TOP); text('TIME: ' + gameTimer, width - 20, 20); let timerBarWidth = 200; let timerBarHeight = 15; let timerBarX = width - timerBarWidth - 20; let timerBarY = 50; let timerProgress = gameTimer / gameDuration; fill(50, 50, 50); noStroke(); rect(timerBarX, timerBarY, timerBarWidth, timerBarHeight); let currentBarWidth = timerBarWidth * timerProgress; let barColor; if (timerProgress > 0.5) { barColor = lerpColor(pacManYellow, color(0, 255, 0), map(timerProgress, 0.5, 1.0, 0, 1)); } else { barColor = lerpColor(pacManRed, pacManYellow, map(timerProgress, 0, 0.5, 0, 1)); } fill(barColor); rect(timerBarX, timerBarY, currentBarWidth, timerBarHeight); noFill(); stroke(150); strokeWeight(1); rect(timerBarX, timerBarY, timerBarWidth, timerBarHeight); noStroke(); }
    if(gameState==='fadingOut'){ let fd=60; let fl=constrain(frameCount-gameOverStartTimeFrame,0,fd)/fd; fill(0,0,0,fl*255); noStroke(); rect(0,0,width,height); if(fl>=1.0){gameState='gameOver'; calculateGameOverImageSizeAndPosition(); if(!isMuted && musicGameOver?.isLoaded()&&!musicGameOver.isPlaying()){musicGameOver.loop(); currentAttributionText=gameOverAttribution;}}}
}

function drawGameOverWin() {
    // Buttons removed
    background(pacManBlack);
    if (frameCount % 3 === 0 && particles.length < 200) { let confettiX = random(width); let confettiColor = random(ghostColors); particles.push({ x: confettiX, y: random(-20, 0), vx: random(-0.5, 0.5), vy: random(1.5, 4), lifespan: 150, color: color(red(confettiColor), green(confettiColor), blue(confettiColor), 200), size: random(5, 10), isConfetti: true }); }

    if(imgNormal&&typeof gameOverY==='number'){gameOverY+=gameOverVY; let hgh=gameOverImgHeight/2; let bTop=gameOverBounceTop; let bBottom=gameOverBounceBottom; if(gameOverY-hgh<=bTop){gameOverY=bTop+hgh; gameOverVY*=-1;}else if(gameOverY+hgh>=bBottom){gameOverY=bBottom-hgh; gameOverVY*=-1;} image(imgNormal,width/2,gameOverY,gameOverImgWidth,gameOverImgHeight);}else if(imgNormal){image(imgNormal,width/2,height*0.3,imgWidth*1.2,imgHeight*1.2);}
    if(retroFont)textFont(retroFont); else textFont('monospace'); fill(pacManYellow); textAlign(CENTER,CENTER); let textY=(typeof gameOverBounceBottom==='number'?gameOverBounceBottom:height*0.45)+60;
    textSize(32); text("YOU WIN!", width / 2, textY);
    textSize(20); text("FINAL SCORE: " + score, width / 2, textY + 60);
    fill(pacManCyan); text('High Score: ' + highScore, width / 2, textY + 90);
    textSize(14); text("(Press any key to restart)", width / 2, textY + 120);
}

function drawGameOverTime() {
    // Buttons removed
    background(pacManBlack);
    if(imgNormal && typeof imgWidth === 'number'){ image(imgNormal, width/2, height * 0.3, imgWidth * 1.2, imgHeight * 1.2); }
    if(retroFont)textFont(retroFont); else textFont('monospace'); fill(pacManRed); textAlign(CENTER, CENTER); let textY = height * 0.55;
    textSize(32); text("Oh no, you lost!", width / 2, textY);
    textSize(20); text("FINAL SCORE: " + score, width / 2, textY + 50);
    fill(pacManCyan); text('High Score: ' + highScore, width / 2, textY + 80);
    textSize(14); text("(Press any key to restart)", width / 2, textY + 110);
}

function drawAttributionText(){ push(); textFont('sans-serif'); textSize(10); textAlign(RIGHT, BOTTOM); let muteText = isMuted ? "[M] Muted / " : "[M] Music ON / "; fill(180); text(muteText + currentAttributionText, width - 10, height - 10); pop(); }
function checkHammerHit() { if (!imgNormal || !currentImage || typeof x !== 'number' || typeof y !== 'number' || typeof hammerStrikeAngle !== 'number' || typeof hammerDisplayWidth !== 'number') return; let a=hammerStrikeAngle; let cpX=hammerDisplayWidth*hammerPivotRatioX; let cpY=hammerDisplayHeight*hammerPivotRatioY; let chaX=hammerDisplayWidth*hammerHeadCenterRatioX; let chaY=hammerDisplayHeight*hammerHeadCenterRatioY; let chOX=chaX-cpX; let chOY=chaY-cpY; let chRad=hammerDisplayWidth*hammerHeadRadiusRatio; let rHeadX=chOX*cos(a)-chOY*sin(a); let rHeadY=chOX*sin(a)+chOY*cos(a); let headX=mouseX+rHeadX; let headY=mouseY+rHeadY; let faceX=x; let faceY=y; let d=dist(headX,headY,faceX,faceY); let iW=imgWidth||100; let iH=imgHeight||100; let hitDist=chRad+min(iW,iH)/2; let hitImageObject = hitHeadImages[chosenHeadIndex] || imgHit; if(d<hitDist){ if(!isMuted && owSound?.isLoaded())owSound.play(); let speed=6; vx=random(3,speed)*(random()>0.5?1:-1); vy=random(3,speed)*(random()>0.5?1:-1); angularVelocity+=random(-hammerHitSpinAmount,hammerHitSpinAmount); if(hitImageObject){currentImage=hitImageObject;} else {console.warn("Hit occurred but no hit image loaded!");} isSwapped=true; hitSwapStartTime=millis(); hammerLandedHit=true; triggerShake(5, 150); let impactX = faceX; let impactY = faceY; for (let k = 0; k < 10; k++) { let angle = random(TWO_PI); let speed = random(2, 5); particles.push({ x: impactX, y: impactY, vx: cos(angle) * speed * 0.5, vy: sin(angle) * speed * 0.5, lifespan: random(15, 30), color: color(255, 255, 255, 200), size: random(3, 6) }); } } else { if(!isMuted && fartSound?.isLoaded())fartSound.play(); hammerLandedHit=false; } }
function toggleMute() { isMuted = !isMuted; if (muteButton) { muteButton.html(isMuted ? 'Unmute' : 'Mute'); } if (isMuted) { if (musicPlaying?.isPlaying()) musicPlaying.stop(); if (musicSelect?.isPlaying()) musicSelect.stop(); if (musicGameplay?.isPlaying()) musicGameplay.stop(); if (musicGameOver?.isPlaying()) musicGameOver.stop(); titleMusicStarted = false; selectMusicStarted = false; gameMusicStarted = false; currentAttributionText = ''; console.log("--- Music MUTED ---"); } else { console.log("--- Music UNMUTED ---"); if (gameState === 'titleScreen' && musicPlaying?.isLoaded()) { musicPlaying.loop(); titleMusicStarted = true; currentAttributionText = titleAttribution; } else if (gameState === 'characterSelect' && musicSelect?.isLoaded()) { musicSelect.loop(); selectMusicStarted = true; currentAttributionText = selectAttribution; } else if ((gameState === 'playing' || gameState === 'fadingOut') && musicGameplay?.isLoaded()) { musicGameplay.loop(); gameMusicStarted = true; currentAttributionText = gameplayAttribution; } else if ((gameState === 'gameOver' || gameState === 'gameOverTime') && musicGameOver?.isLoaded()) { musicGameOver.loop(); currentAttributionText = gameOverAttribution; } } }
function goToCharacterSelect() { console.log("Transitioning to Character Select..."); if (musicPlaying?.isPlaying()) { musicPlaying.stop(); titleMusicStarted = false; } if (musicGameOver?.isPlaying()) { musicGameOver.stop(); } if (musicGameplay?.isPlaying()) { musicGameplay.stop(); gameMusicStarted = false;} if(!isMuted && musicSelect?.isLoaded() && !selectMusicStarted){ musicSelect.loop(); selectMusicStarted = true; currentAttributionText = selectAttribution;} else if (!isMuted) { currentAttributionText = selectAttribution; } else { currentAttributionText = ''; } gameState = 'characterSelect'; }
function startGame() { console.log(`Starting Game with Head Index ${chosenHeadIndex}...`); if (musicPlaying?.isPlaying()) { musicPlaying.stop(); titleMusicStarted = false; } if (musicSelect?.isPlaying()) { musicSelect.stop(); selectMusicStarted = false; } if (musicGameOver?.isPlaying()) { musicGameOver.stop(); } if (!isMuted && musicGameplay?.isLoaded()){ musicGameplay.loop(); gameMusicStarted = true; currentAttributionText = gameplayAttribution; } else if(!isMuted) { currentAttributionText = gameplayAttribution; } else { currentAttributionText = '';} if (normalHeadImages[chosenHeadIndex] && hitHeadImages[chosenHeadIndex]) { imgNormal = normalHeadImages[chosenHeadIndex]; imgHit = hitHeadImages[chosenHeadIndex]; currentImage = imgNormal; console.log("Set images."); calculateImageSize(); } else { console.error(`Cannot start, images for index ${chosenHeadIndex} missing!`); gameState = 'characterSelect'; return; } resetOtherStates(); score = 0; gameTimer = gameDuration; gameStartTime = millis(); createInitialBumpers(); hammerAngle = hammerRestAngle; isHammerStriking = false; addBumperAfterSwing = false; hammerLandedHit = false; gameState = 'playing'; console.log("Game Started."); }
function changeStateToGameOverTime() { console.log("Time's up! Game Over."); checkAndSaveHighScore(); if (musicGameplay?.isPlaying()) { musicGameplay.stop(); gameMusicStarted = false; } gameState = 'gameOverTime'; if (!isMuted && musicGameOver?.isLoaded() && !musicGameOver.isPlaying()) { musicGameOver.loop(); currentAttributionText = gameOverAttribution; console.log("Game Over music started (Time Loss)."); } else if (!isMuted) { currentAttributionText = gameOverAttribution; } else { currentAttributionText = '';} }
function restartSketch() { console.log("Resetting to Title Screen..."); if (musicGameOver?.isPlaying()) { musicGameOver.stop(); } if (musicPlaying?.isPlaying()) { musicPlaying.stop(); } if (musicSelect?.isPlaying()){ musicSelect.stop();} if (musicGameplay?.isPlaying()){ musicGameplay.stop();} /* Buttons removed */ resetOtherStates(); initializeTitleScreenState(); chosenHeadIndex=0; if (normalHeadImages[chosenHeadIndex]){ imgNormal = normalHeadImages[chosenHeadIndex];} else { imgNormal = normalHeadImages[0] || null;} if (imgNormal) { if(hitHeadImages[chosenHeadIndex]) {imgHit = hitHeadImages[chosenHeadIndex];} else {imgHit = hitHeadImages[0] || null;} currentImage = imgNormal; calculateImageSize(); } else {imgHit = null; currentImage = null;} gameState = 'titleScreen'; console.log("Sketch reset to Title Screen."); }
function calculateGameOverImageSizeAndPosition() { if(typeof imgWidth!=='number'||imgWidth<=0||typeof imgHeight!=='number'||imgHeight<=0){if(imgNormal)calculateImageSize(); if(typeof imgWidth!=='number'||imgWidth<=0||typeof imgHeight!=='number'||imgHeight<=0){imgWidth=100;imgHeight=100;}} let maxWidthGameOver = maxImageWidth * 1.2; gameOverImgWidth=min(imgWidth*1.2, maxWidthGameOver); gameOverImgHeight=imgHeight*1.2 * (gameOverImgWidth/(imgWidth*1.2 || 1)); let bTop=typeof gameOverBounceTop==='number'?gameOverBounceTop:height*0.15; let bBottom=typeof gameOverBounceBottom==='number'?gameOverBounceBottom:height*0.45; if(typeof gameOverImgHeight!=='number'||gameOverImgHeight<=0)gameOverImgHeight=120; gameOverY=bBottom-gameOverImgHeight/2-5; gameOverVY=-gameOverBounceSpeed; console.log("Initialized Game Over image bounce (Win)."); }
function userStartAudio() { if (getAudioContext().state !== 'running') { getAudioContext().resume().then(() => { console.log("AudioContext resumed."); }).catch(e => { console.error("AudioContext resume failed:", e); }); } }


