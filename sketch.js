/*
 * SmashHead - Retro Bouncing Game (Full Clean Version)
 * Version: V17.0 (Fixed Visitor Count + Scanlines + Hover + Floating Heads)
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

// Head Image Arrays & Variables
let normalHeadImages = [];
let hitHeadImages = [];
let imgNormal, imgHit, currentImage; // Current images in use
let chosenHeadIndex = 0;

// Gameplay State & Timing
let gameState = 'titleScreen';
let gameTimer = 120;
let gameStartTime = 0;
let gameDuration = 120;
let isSwapped = false; // For hit image display
let hitSwapStartTime = 0;
let imageSwapDuration = 100; // ms to show hit image
let gameOverStartTimeFrame = 0; // For fadeout

// Physics & Position
let x, y, vx, vy;
let angle = 0;
let angularVelocity = 0;
let angularDamping = 0.98;
let spinAmount = 0.1;
let hammerHitSpinAmount = 0.3;
let lastBounceTime = 0;
let bounceCooldown = 100; // ms between bounce sounds

// Image & Display Sizes
let imgWidth, imgHeight;
let maxImageWidth = 150;
let hammerDisplayWidth, hammerDisplayHeight;
let selectHeadSize; // Size of heads on select screen
let gameOverImgWidth, gameOverImgHeight;

// Hammer Variables
let hammerImg;
let hammerAngle;
// Declare globally, but DO NOT initialize with PI here
let hammerRestAngle;
let hammerStrikeAngle;
let hammerTargetAngle;
let isHammerStriking = false;
let hammerAnimStartTime = 0;
let hammerAnimDuration = 180; // ms for hammer swing
let hammerHitCheckDone = false; // Ensure hit check runs once per swing
let hammerPivotRatioX = 0.5;  // Pivot point relative to hammer image width
let hammerPivotRatioY = 0.85; // Pivot point relative to hammer image height
let hammerHeadCenterRatioX = 0.5; // Hit detection center relative to width
let hammerHeadCenterRatioY = 0.2; // Hit detection center relative to height
let hammerHeadRadiusRatio = 0.3;  // Hit detection radius relative to width

// Bumpers
let bumpers = [];
let numInitialBumpers = 15;
let bumperRadius = 8;
let bumperMaxHits = 3;
let potentialBumperX = -1, potentialBumperY = -1; // For adding bumpers on miss
let addBumperAfterSwing = false;
let hammerLandedHit = false; // Track if the swing hit the face or a bumper

// Score & Combos
let score = 0;
let highScore = 0;
let lastBumperHitTime = 0;
let comboCount = 0;
const COMBO_WINDOW = 1000; // 1 second window for combos

// Effects & Visuals
let scanlines; // CRT effect overlay graphic
let particles = []; // General particle system (trails, impacts, confetti)
let effects = []; // Floating text effects (e.g., combos)
let shakeAmount = 0;
let shakeDuration = 0;
let shakeStartTime = 0; // Screen Shake
let titleHue = 0; // For rainbow title text
let selectHue = 0; // For rainbow select text

// Sounds & Music
let squeakSound, owSound, fartSound, retroFont;
let musicPlaying, musicSelect, musicGameplay, musicGameOver;
let selectBlipSound; // For blip.mp3 on hover/select
let titleMusicStarted = false;
let selectMusicStarted = false;
let gameMusicStarted = false;
let currentAttributionText = '';
let isMuted = false; // Mute state

// UI Elements
let muteButton;
let hoveredHeadIndex = -1; // Index of head currently hovered (-1 for none)
let previousHoverIndex = -1; // To detect hover change

// Title Screen Specific
let smashHeadY, smashHeadTargetY;
let smashHeadAnimDone = false;
let titleFaceX, titleFaceY, titleHammerX, titleHammerY;
let titleFaceSpeed = 2.5;
let titleHammerFollowSpeed = 0.08;
let titleHammerAngle = 0;
let isTitleHammerStriking = false;
let titleHammerAnimStartTime = 0;
let titleSweepStartX, titleSweepEndX;
let headlineSpacing = 65; // Space between "SMASH" and "HEAD"

// Game Over (Win) Specific
let gameOverY, gameOverVY;
let gameOverBounceTop, gameOverBounceBottom;
let gameOverBounceSpeed = 1.8;

// Colors (Pac-Man Theme)
let pacManBlack, pacManBlue, pacManYellow, pacManPink, pacManCyan, pacManOrange, pacManRed;
let ghostColors = []; // Array for bumper/confetti colors

// Attribution Text
const titleAttribution = 'Music: bit-shift/Kevin MacLeod (uppbeat.io)';
const selectAttribution = 'Music: bitmap.mp3 (source TBD)';
const gameplayAttribution = 'Music: Panic.mp3 (source TBD)';
const gameOverAttribution = 'Music: pookatori/Kevin MacLeod (uppbeat.io)';

// --- Preload Assets ---
function preload() {
    print("--- Preload Starting ---");
    // Define helper logging functions for preload
    const sl = (n) => console.log(`Preload OK: ${n}`);
    const sle = (e, n) => console.error(`Preload FAIL: ${n}!`, e);
    const ale = (e, n) => console.error(`Preload FAIL: ${n}! Check path/name.`, e);

    soundFormats('mp3', 'wav', 'ogg');

    // Load essential assets first (needed for title/initial state)
    retroFont = loadFont('PressStart2P-Regular.ttf', () => sl('Font'), (e) => ale(e, 'Font'));
    // Load the first head image (default)
    normalHeadImages[0] = loadImage('face5.png', () => sl('head1_normal (face5.png)'), (e) => ale(e, 'face5.png'));
    hammerImg = loadImage('hammer.png', () => sl('hammer.png'), (e) => ale(e, 'hammer.png'));
    musicPlaying = loadSound('bit.mp3', () => sl('Title Music'), (e) => sle(e, 'MusicPlay'));

    // Sounds needed early or commonly
    squeakSound = loadSound('boing.mp3', () => sl('boing'), (e) => sle(e, 'boing'));
    owSound = loadSound('ow.mp3', () => sl('ow'), (e) => sle(e, 'ow'));
    fartSound = loadSound('dry-fart.mp3', () => sl('fart'), (e) => sle(e, 'fart'));
    selectBlipSound = loadSound('blip.mp3', () => sl('Select Blip'), (e) => sle(e, 'Select Blip'));

    // Initialize currentImage with the preloaded one (if successful)
    // We will assign imgNormal properly in setup once chosenHeadIndex is confirmed
    currentImage = normalHeadImages[0]; // Assign tentatively

    print("--- Preload Finished ---");
} // End preload()

// --- Setup ---
function setup() {
    print("--- Setup Starting ---");
    // Remove loading message if it exists
    let loadingMsg = select('#loading-message');
    if (loadingMsg) loadingMsg.remove();

    createCanvas(windowWidth, windowHeight);
    pixelDensity(1); // Ensure graphics buffer matches display density
    colorMode(RGB, 255, 255, 255, 255);
    imageMode(CENTER);
    textAlign(LEFT, TOP); // Default alignment

    // --- Initialize hammer angles HERE using PI ---
    hammerRestAngle = -PI / 5;
    hammerStrikeAngle = PI / 2.5;
    hammerAngle = hammerRestAngle; // Also initialize current angle
    hammerTargetAngle = hammerRestAngle; // And target angle
    // --- End Hammer Angle Initialization ---

    // Define Pac-Man Colors
    pacManBlack = color(0);
    pacManBlue = color(33, 33, 255);
    pacManYellow = color(255, 255, 0);
    pacManPink = color(255, 184, 255);
    pacManCyan = color(0, 255, 255);
    pacManOrange = color(255, 184, 82);
    pacManRed = color(255, 0, 0);
    ghostColors = [pacManPink, pacManCyan, pacManOrange, pacManRed, pacManBlue];

    // Calculate initial image sizes based on preloaded assets (or defaults)
    calculateImageSize(); // Use default head 0 for initial calc

    // Create Scanlines Effect Graphic
    createScanlinesGraphic();

    // Create Mute Button
    muteButton = createButton('Mute');
    muteButton.position(20, height - 40);
    muteButton.style('padding', '5px 10px');
    muteButton.style('font-size', '12px');
    muteButton.mousePressed(toggleMute);

    // --- Deferred Asset Loading (for other heads and music) ---
    print("--- Starting Deferred Asset Loading ---");
    const slSetup = (n) => console.log(`Setup OK: ${n}`);
    const sleSetup = (e, n) => console.error(`Setup FAIL: ${n}!`, e);
    const aleSetup = (e, n) => console.error(`Setup FAIL: ${n}! Check path/name.`, e);

    // Load other head images
    normalHeadImages[1] = loadImage('face4.png', () => slSetup('head2_normal'), (e) => aleSetup(e, 'face4.png'));
    normalHeadImages[2] = loadImage('face3.png', () => slSetup('head3_normal'), (e) => aleSetup(e, 'face3.png'));
    hitHeadImages[0] = loadImage('face5b.png', () => { slSetup('head1_hit'); if (chosenHeadIndex === 0) imgHit = hitHeadImages[0]; }, (e) => aleSetup(e, 'face5b.png'));
    hitHeadImages[1] = loadImage('face4b.png', () => slSetup('head2_hit'), (e) => aleSetup(e, 'face4b.png'));
    hitHeadImages[2] = loadImage('face3b.png', () => slSetup('head3_hit'), (e) => aleSetup(e, 'face3b.png'));

    // Load remaining music tracks
    musicSelect = loadSound('bitmap.mp3', () => slSetup('Select Music'), (e) => sleSetup(e, 'MusicSelect'));
    musicGameplay = loadSound('Panic.mp3', () => slSetup('Gameplay Music'), (e) => sleSetup(e, 'MusicGameplay'));
    musicGameOver = loadSound('pooka.mp3', () => slSetup('GO Music'), (e) => sleSetup(e, 'MusicGO'));

    // --- Initialize Game State ---

    // Set the initial normal and hit images based on default chosenHeadIndex (0)
    imgNormal = normalHeadImages[chosenHeadIndex];
    // Attempt to set imgHit, might still be loading but will be assigned in callback
    imgHit = hitHeadImages[chosenHeadIndex];
    currentImage = imgNormal; // Ensure currentImage is the valid normal image

    // Load High Score from localStorage
    try {
        let storedScore = getItem('smashHeadHighScore');
        if (storedScore !== null) {
            highScore = int(storedScore);
            print(`Loaded High Score: ${highScore}`);
        } else {
            print("No high score found.");
        }
    } catch (e) {
        console.error("Could not access localStorage:", e);
    }

    // Initialize screen-specific states
    initializeTitleScreenState();
    // Set initial values for game over bounce (needed if window resized before game over)
    gameOverBounceTop = height * 0.15;
    gameOverBounceBottom = height * 0.45;
    resetOtherStates(); // Set defaults for other states

    // Set initial state and attribution
    gameState = 'titleScreen';
    currentAttributionText = titleAttribution;

    print("--- Setup Finished ---");
} // End setup()

// ============================
// --- DRAW FUNCTION (Dispatcher) ---
// ============================
function draw() {
    push(); // Isolate screen shake transformations

    // Apply Screen Shake if active
    let currentShake = 0;
    if (millis() < shakeStartTime + shakeDuration) {
        currentShake = shakeAmount;
        let offsetX = random(-currentShake, currentShake);
        let offsetY = random(-currentShake, currentShake);
        translate(offsetX, offsetY);
    } else {
        shakeAmount = 0; // Reset shake when duration ends
    }

    // Call state-specific drawing functions
    if (gameState === 'titleScreen') {
        drawTitleScreen();
    } else if (gameState === 'characterSelect') {
        drawCharacterSelect();
    } else if (gameState === 'playing' || gameState === 'fadingOut') { // Include fadingOut here
        drawPlayingState();
    } else if (gameState === 'gameOver') {
        drawGameOverWin();
    } else if (gameState === 'gameOverTime') {
        drawGameOverTime();
    }

    // Update particles/effects (run in relevant states)
    if (gameState === 'playing' || gameState === 'fadingOut' || gameState === 'gameOver' || gameState === 'gameOverTime') {
        updateAndDrawParticles(); // Draw particles during gameplay and game over screens
    }
    if (gameState === 'playing' || gameState === 'fadingOut') {
        updateAndDrawEffects(); // Draw combo effects during gameplay
    }

    // Draw overlays (affected by shake)
    if (scanlines) {
        imageMode(CORNER); // Scanlines are drawn from top-left
        image(scanlines, 0, 0, width, height);
        imageMode(CENTER); // Reset imageMode
    }
    drawAttributionText(); // Draw music/mute info

    pop(); // Restore translation from screen shake
} // End draw()


// ============================
// --- State-Specific Drawing Functions ---
// ============================

function drawTitleScreen() {
    background(pacManBlack);

    // Start title music if not muted and not already started
    if (!isMuted && !titleMusicStarted && musicPlaying?.isLoaded()) {
        musicPlaying.loop();
        titleMusicStarted = true;
        currentAttributionText = titleAttribution;
    }

    // Animate "SMASH HEAD" text falling into place
    if (!smashHeadAnimDone) {
        smashHeadY = lerp(smashHeadY, smashHeadTargetY, 0.08); // Smooth interpolation
        if (abs(smashHeadY - smashHeadTargetY) < 1) {
            smashHeadY = smashHeadTargetY;
            smashHeadAnimDone = true;
        }
    }

    // Draw "SMASH HEAD" Title
    textAlign(CENTER, CENTER);
    if (retroFont) textFont(retroFont); else textFont('monospace');
    textSize(80);
    push();
    colorMode(HSB, 360, 100, 100, 100); // Use HSB for easy hue cycling
    titleHue = (titleHue + 1.5) % 360; // Cycle hue
    fill(titleHue, 90, 100);
    text("SMASH", width / 2, smashHeadY);
    text("HEAD", width / 2, smashHeadY + headlineSpacing);
    pop();
    colorMode(RGB, 255, 255, 255, 255); // Reset color mode

    // Once title animation is done, show subtitle, score, and animation
    if (smashHeadAnimDone) {
        textSize(28);
        fill(pacManYellow);
        text("It's a Banger", width / 2, smashHeadTargetY + headlineSpacing + 70);

        fill(pacManCyan);
        textSize(18);
        text('High Score: ' + highScore, width / 2, smashHeadTargetY + headlineSpacing + 110);

        // --- Sweeping Face and Hammer Animation ---
        // Initialize sweep boundaries if they don't exist
        if (typeof titleSweepEndX !== 'number') {
             titleSweepEndX = width + (imgWidth || 100) + 50;
             titleSweepStartX = -(imgWidth || 100) - 50;
        }

        // Move face across the screen
        titleFaceX += titleFaceSpeed;
        if (titleFaceX > titleSweepEndX) { // Reset position when off-screen
            titleFaceX = titleSweepStartX;
            titleHammerX = titleSweepStartX - 150; // Reset hammer behind face
        }
        // Add subtle vertical bobbing
        titleFaceY = height * 0.55 + sin(frameCount * 0.03) * 20;

        // Move hammer, lagging slightly behind the face
        titleHammerX += titleFaceSpeed;
        titleHammerY = lerp(titleHammerY, titleFaceY, titleHammerFollowSpeed); // Smoothly follow Y

        // Trigger hammer swing animation periodically
        if (frameCount % 100 === 0 && !isTitleHammerStriking) {
            isTitleHammerStriking = true;
            titleHammerAnimStartTime = millis();
        }

        // Update hammer angle during swing animation
        if (isTitleHammerStriking) {
            let elapsed = millis() - titleHammerAnimStartTime; // Use separate timer for title hammer
            let progress = constrain(elapsed / hammerAnimDuration, 0, 1);
            if (progress < 0.5) { // Swing down
                titleHammerAngle = lerp(hammerRestAngle, hammerStrikeAngle, progress * 2);
            } else { // Swing back up
                titleHammerAngle = lerp(hammerStrikeAngle, hammerRestAngle, (progress - 0.5) * 2);
            }
            if (progress >= 1) { // End animation
                isTitleHammerStriking = false;
                titleHammerAngle = hammerRestAngle;
            }
        } else {
            titleHammerAngle = hammerRestAngle; // Keep at rest position
        }

        // Draw the face image (use default if specific one failed)
        let titleFaceImg = normalHeadImages[0]; // Always use the default for title
        if (titleFaceImg && typeof imgWidth === 'number' && imgWidth > 0) {
            image(titleFaceImg, titleFaceX, titleFaceY, imgWidth, imgHeight);
        }

        // Draw the hammer image
        if (hammerImg && typeof hammerDisplayHeight === 'number' && hammerDisplayHeight > 0) {
            push();
            translate(titleHammerX, titleHammerY); // Position at hammer's coordinates
            rotate(titleHammerAngle);           // Rotate around its pivot
            image(hammerImg, 0, 0, hammerDisplayWidth, hammerDisplayHeight); // Draw centered
            pop();
        }

        // --- Draw "Press Any Key" with Glow ---
        let pressKeyY = height * 0.80;
        let pressKeySize = 24;
        let glowSize = pressKeySize + 2; // Slightly larger for glow effect
        // Alternate color for flashing effect
        let baseColor = (frameCount % 45 < 25) ? pacManYellow : pacManPink;
        let glowColor = color(red(baseColor), green(baseColor), blue(baseColor), 80); // Semi-transparent glow

        textAlign(CENTER, CENTER);
        if (retroFont) textFont(retroFont); else textFont('monospace');
        noStroke();

        // Draw glow (slightly offset)
        fill(glowColor);
        textSize(glowSize);
        text("PRESS ANY KEY TO CHOOSE HEAD", width / 2 + 1, pressKeyY + 1); // Offset for subtle glow
        text("PRESS ANY KEY TO CHOOSE HEAD", width / 2 - 1, pressKeyY - 1);

        // Draw main text
        fill(baseColor);
        textSize(pressKeySize);
        text("PRESS ANY KEY TO CHOOSE HEAD", width / 2, pressKeyY);
    }
} // End drawTitleScreen()

// ============================
// --- DRAW CHARACTER SELECT ---
// ============================
function drawCharacterSelect() {
    background(pacManBlack);

    // Start select screen music if not muted and not already started
    if (!isMuted && !selectMusicStarted && musicSelect?.isLoaded()) {
        musicSelect.loop();
        selectMusicStarted = true;
        currentAttributionText = selectAttribution;
    }

    // --- Draw SmashHEAD Logo at Top ---
    textAlign(CENTER, CENTER);
    if (retroFont) textFont(retroFont); else textFont('monospace');
    textSize(40); // Smaller logo on this screen
    push();
    colorMode(HSB, 360, 100, 100, 100);
    selectHue = (selectHue + 0.8) % 360; // Slower hue cycle for select screen
    fill(selectHue, 90, 100);
    text("SMASH", width / 2, 60);
    text("HEAD", width / 2, 100);
    pop();
    colorMode(RGB, 255, 255, 255, 255); // Reset color mode

    // --- Draw How to Play Box ---
    drawHowToPlay(); // Encapsulated drawing logic

    // --- Draw Head Selection Area ---
    drawHeadSelect(); // Encapsulated drawing logic
} // End drawCharacterSelect()

// ============================
// --- Draw How to Play Section ---
// ============================
function drawHowToPlay() {
    let instructionY = 160; // Top position of the instruction area
    let instructionWidth = width * 0.65; // Max width for text lines
    let hammerScale = 0.8; // Scale down the hammer image for display

    // Ensure hammer dimensions are calculated
    if (!hammerDisplayWidth || !hammerDisplayHeight) calculateImageSize();
    let hammerW = (hammerDisplayWidth || 100) * hammerScale; // Use calculated or default size
    let hammerH = (hammerDisplayHeight || 150) * hammerScale;

    // Calculate layout to center the block (hammer + text)
    let totalBlockWidth = instructionWidth + hammerW + 40; // Text width + hammer width + spacing
    let blockStartX = (width - totalBlockWidth) / 2; // Starting X for the centered block

    // Position the hammer image and text within the block
    let imgX = blockStartX + hammerW / 2; // Center of hammer image X
    let imgY = instructionY + hammerH * 0.6; // Y pos of hammer (adjust pivot visually)
    let textX = imgX + hammerW / 2 + 20; // X pos of text (right of hammer + padding)

    // Calculate frame dimensions
    let framePadding = 20;
    let frameX = blockStartX - framePadding / 2;
    let frameY = instructionY - framePadding * 1.5; // Adjust frame Y position

    // Instructions Text
    const instructionsArray = [
        "HOW TO PLAY",
        "", // Blank line for spacing
        "Click to swing the hammer!",
        "Hit the bouncing head!",
        "Hit bumpers to clear them.",
        "Clear all bumpers to WIN!",
        "Hit bumpers quickly for COMBOS!",
        "Don't run out of TIME!"
    ];
    let instructionSize = 14; // Font size for instructions
    let lineSpacing = 25;     // Vertical space between lines
    let estimatedLines = instructionsArray.length;
    let estTextHeight = estimatedLines * lineSpacing + 30; // Estimated text block height

    // Calculate frame size to fit hammer and text
    let frameHeight = max(hammerH + (imgY - instructionY) + framePadding, estTextHeight) + framePadding * 2;
    let frameWidth = totalBlockWidth + framePadding;

    // --- Draw the Frame and Background ---
    // Outer frame (pixel style)
    noFill();
    stroke(pacManCyan); // Use a theme color
    strokeWeight(4);    // Thicker border
    rect(frameX, frameY, frameWidth, frameHeight); // Draw the outer rectangle

    // Subtle inner background (slightly transparent)
    noStroke();
    fill(0, 0, 100, 80); // Dark blue, semi-transparent
    let innerPadding = 5;
    rect(frameX + innerPadding, frameY + innerPadding, frameWidth - 2 * innerPadding, frameHeight - 2 * innerPadding);

    // --- Draw Instructions Text, Line by Line ---
    textAlign(LEFT, TOP); // Align text to the left top
    textLeading(lineSpacing); // Set line spacing
    fill(pacManYellow);       // Default text color

    for (let i = 0; i < instructionsArray.length; i++) {
        let line = instructionsArray[i];
        if (line.trim() !== "") { // Skip drawing empty lines
            push();
            colorMode(HSB, 360, 100, 100, 100); // Use HSB for color variation

            // Special styling for the title "HOW TO PLAY"
            if (i === 0) {
                let pulse = 1 + 0.05 * sin(millis() / 300); // Subtle size pulse
                textSize(instructionSize * pulse * 1.2); // Make title slightly larger and pulse
                fill(0, 0, 100); // White color for title
            } else {
                textSize(instructionSize); // Normal size for other lines
                 // Cycle through rainbow colors for instruction lines
                fill((frameCount + i * 20) % 360, 80, 100);
            }

            text(line, textX, frameY + framePadding + i * lineSpacing, instructionWidth); // Draw text line
            pop(); // Restore color mode and text size
        }
    }
     colorMode(RGB); // Restore default color mode

    // --- Draw Hammer Image ---
    if (hammerImg && typeof hammerDisplayHeight === 'number' && hammerDisplayHeight > 0) {
        push();
        translate(imgX, imgY); // Position at hammer's location
        rotate(-PI / 8);       // Slightly tilt the hammer for visual appeal
        imageMode(CENTER);       // Ensure hammer draws centered
        image(hammerImg, 0, 0, hammerW, hammerH); // Draw the scaled hammer
        pop();
        imageMode(CENTER); // Reset imageMode just in case
    }
} // End drawHowToPlay()


// ============================
// --- Draw Floating Heads Selection ---
// ============================
function drawHeadSelect() {
    // Position the head selection area below the How-to-Play box
    // Use the calculated frame position from drawHowToPlay if available
    // This requires frameY and frameHeight to be accessible or recalculated/passed
    // For simplicity, let's use a fixed offset based on typical frame height.
    // A more robust solution would involve passing layout info.
    // Estimate bottom of how-to-play (needs refinement if layout changes drastically)
    let howToPlayBottomApprox = 160 + max( (hammerDisplayHeight || 150) * 0.8 + (160 + (hammerDisplayHeight || 150)*0.8 * 0.6 - 160) + 20, (8 * 25 + 30)) + 20 * 2;
    let selectY = howToPlayBottomApprox + 80; // Y position for the row of heads
    let spacing = width / 4; // Horizontal spacing between heads

    let headNames = ["Ol' Greenie", "Blurg", "Frank"]; // Names corresponding to indices 0, 1, 2

    // Draw "Pick your head" text
    if (retroFont) textFont(retroFont); else textFont('monospace');
    textAlign(CENTER, CENTER);
    textSize(26);
    push();
    colorMode(HSB, 360, 100, 100, 100);
    // Use the same selectHue as the logo for consistency
    fill(selectHue, 90, 100);
    text("Pick your head to SMASH!", width / 2, selectY - 50); // Position text above heads
    pop();
    colorMode(RGB, 255, 255, 255, 255);

    // --- Draw Heads, Hover Box, and Names ---
    textAlign(CENTER, TOP); // Align names below heads
    textSize(16);           // Font size for names

    for (let i = 0; i < 3; i++) { // Assuming 3 heads
        let displayImg = normalHeadImages[i];
        // Use calculated selectHeadSize, or a default if not ready
        let currentSelectHeadSize = typeof selectHeadSize === 'number' ? selectHeadSize : 90;
        let imgXPos = spacing * (i + 1); // Calculate X position based on spacing

        // Calculate aspect ratio and height dynamically
        let currentHeadHeight = currentSelectHeadSize; // Default to square
        let aspect = 1;
        if (displayImg && displayImg.width > 0) {
            aspect = displayImg.height / displayImg.width;
            currentHeadHeight = currentSelectHeadSize * aspect;
        }

        // --- Hover Effects ---
        let hoverOffsetY = 0; // Vertical offset for hover bobbing
        let hoverScale = 1.0;  // Scale factor for hover zoom

        if (i === hoveredHeadIndex) { // Check if this head is being hovered over
            hoverOffsetY = -10 * abs(sin(millis() / 200)); // Bob up and down
            hoverScale = 1.05; // Slightly enlarge

            // Draw yellow selection box around the hovered head
            let boxPadding = 5;
            let boxW = currentSelectHeadSize + 2 * boxPadding;
            let boxH = currentHeadHeight + 2 * boxPadding;
            let boxX = imgXPos - boxW / 2; // Top-left X of the box
            let boxY = selectY - currentHeadHeight / 2 - boxPadding; // Top-left Y (use actual head height)

            stroke(pacManYellow);
            strokeWeight(3);
            noFill();
            rect(boxX, boxY, boxW, boxH); // Draw the rectangle
            noStroke(); // Reset stroke
        }

        // --- Draw Head Image ---
        push();
        translate(imgXPos, selectY + hoverOffsetY); // Apply hover offset
        scale(hoverScale);                        // Apply hover scale

        if (displayImg && displayImg.width > 0) {
            imageMode(CENTER); // Ensure image draws centered at translated origin
            image(displayImg, 0, 0, currentSelectHeadSize, currentHeadHeight); // Draw head
        } else {
            // Fallback: Draw a red square if the image hasn't loaded yet
            fill(pacManRed);
            rectMode(CENTER);
            rect(0, 0, currentSelectHeadSize, currentSelectHeadSize); // Draw placeholder
        }
        pop(); // Restore translation and scale

        // --- Draw Head Name Below Image ---
        fill(pacManYellow);
        textAlign(CENTER, TOP); // Align text top-center
        // Position name below the calculated bottom edge of the head image
        text(headNames[i], imgXPos, selectY + currentHeadHeight / 2 + 10);
    }
     imageMode(CENTER); // Reset just in case
     rectMode(CORNER); // Reset just in case
} // End drawHeadSelect()


// ============================
// --- PLAYING STATE ---
// ============================
function drawPlayingState() {
    background(pacManBlack);

    // Start gameplay music if not muted and not already started
    if (!isMuted && !gameMusicStarted && musicGameplay?.isLoaded()) {
        musicGameplay.loop();
        gameMusicStarted = true;
        currentAttributionText = gameplayAttribution;
    }

    // Revert image back to normal after hit display duration
    if (isSwapped && millis() - hitSwapStartTime > imageSwapDuration) {
        currentImage = imgNormal; // Switch back to normal image
        isSwapped = false;
    }

    // --- Draw Bumpers ---
    noStroke();
    for (let b of bumpers) {
        if (!b.active) continue; // Skip inactive (destroyed) bumpers
        // Fade bumper color based on hits taken
        let hitsTaken = constrain(b.hits, 0, b.maxHits - 1);
        let currentAlpha = map(hitsTaken, 0, b.maxHits - 1, 255, 70); // Fade out as hits increase
        fill(red(b.baseColor), green(b.baseColor), blue(b.baseColor), currentAlpha);
        ellipse(b.x, b.y, b.r * 2, b.r * 2); // Draw bumper
    }

    // --- Update and Draw Hammer ---
    updateHammer(); // Handles hammer animation, hit detection trigger, drawing

    // --- Update and Draw Bouncing Face ---
    drawBouncingFace(); // Handles physics, wall/bumper collisions, drawing

    // --- Draw HUD (Score, Timer, Timer Bar) ---
    drawGameHUD();

    // --- Handle Game Logic (Timer Countdown, Win Condition, Fading) ---
    if (gameState === 'playing') {
        handleTimerCountdown(); // Check timer, check win condition
    } else if (gameState === 'fadingOut') {
        handleFadingOut(); // Draw fade overlay and transition to win screen
    }
} // End drawPlayingState()

// --- Hammer Update Logic ---
function updateHammer() {
    if (isHammerStriking) {
        let elapsed = millis() - hammerAnimStartTime;
        let progress = constrain(elapsed / hammerAnimDuration, 0, 1); // Normalize time 0-1

        // Animate hammer angle: down then up
        if (progress < 0.5) { // Swing down (0 to 0.5)
            hammerAngle = lerp(hammerRestAngle, hammerStrikeAngle, progress * 2);
        } else { // Swing back up (0.5 to 1)
            hammerAngle = lerp(hammerStrikeAngle, hammerRestAngle, (progress - 0.5) * 2);
        }

        // Check for hit with the face *once* during the swing down (around midpoint)
        if (!hammerHitCheckDone && progress >= 0.4 && progress <= 0.6) {
            checkHammerHit(); // This function handles face hit logic
            hammerHitCheckDone = true; // Prevent multiple checks per swing
        }

        // End of swing animation
        if (progress >= 1) {
            isHammerStriking = false;
            hammerAngle = hammerRestAngle;

            // If swing finished and we intended to add a bumper (missed click)
            if (addBumperAfterSwing) {
                // Only add bumper if the swing *didn't* hit the face
                if (!hammerLandedHit && potentialBumperX > 0 && potentialBumperY > 0) {
                    bumpers.push({
                        x: potentialBumperX, y: potentialBumperY,
                        r: bumperRadius, baseColor: random(ghostColors),
                        hits: 0, maxHits: bumperMaxHits, active: true
                    });
                    console.log("Added bumper at missed location.");
                }
                // Reset bumper placement flags
                addBumperAfterSwing = false;
                potentialBumperX = -1;
                potentialBumperY = -1;
            }
        }
    } else {
        // If not striking, keep hammer at rest angle
        hammerAngle = hammerRestAngle;
    }

    // --- Draw Hammer Following Mouse ---
    if (hammerImg && typeof hammerDisplayHeight === 'number' && hammerDisplayHeight > 0) {
        // Calculate pivot point offset based on ratios
        let pivotOffsetX = hammerDisplayWidth * hammerPivotRatioX;
        let pivotOffsetY = hammerDisplayHeight * hammerPivotRatioY;

        push();
        translate(mouseX, mouseY); // Position hammer base at mouse coordinates
        rotate(hammerAngle);       // Rotate around the calculated pivot
        imageMode(CORNER);         // Draw relative to top-left corner for rotation pivot
        // Draw image offset by the pivot point so rotation happens correctly
        image(hammerImg, -pivotOffsetX, -pivotOffsetY, hammerDisplayWidth, hammerDisplayHeight);
        imageMode(CENTER); // Reset imageMode
        pop();
    }
} // End updateHammer()

// --- Draw Bouncing Face Logic ---
function drawBouncingFace() {
    // Ensure necessary images and dimensions are valid
    if (imgNormal && currentImage && typeof imgWidth === 'number' && imgWidth > 0) {

        // --- Update Physics ---
        angle += angularVelocity; // Apply rotation
        angularVelocity *= angularDamping; // Dampen spin over time
        if (abs(angularVelocity) < 0.001) angularVelocity = 0; // Stop tiny spins

        x += vx; // Apply horizontal velocity
        y += vy; // Apply vertical velocity

        // --- Wall Collisions ---
        let bounced = false; // Flag to check if a bounce occurred this frame
        let currentTime = millis();
        let halfW = imgWidth / 2;
        let halfH = imgHeight / 2;

        if (x - halfW <= 0) { // Left wall
            x = halfW;        // Correct position
            vx *= -1;         // Reverse horizontal velocity
            angularVelocity += spinAmount * Math.sign(vy || 1); // Add spin based on vertical direction
            bounced = true;
        } else if (x + halfW >= width) { // Right wall
            x = width - halfW;
            vx *= -1;
            angularVelocity += spinAmount * Math.sign(vy || 1);
            bounced = true;
        }
        if (y - halfH <= 0) { // Top wall
            y = halfH;
            vy *= -1;         // Reverse vertical velocity
            angularVelocity += spinAmount * -Math.sign(vx || 1); // Add spin based on horizontal direction
            bounced = true;
        } else if (y + halfH >= height) { // Bottom wall
            y = height - halfH;
            vy *= -1;
            angularVelocity += spinAmount * -Math.sign(vx || 1);
            bounced = true;
        }

        // --- Bumper Collisions ---
        // checkBumperCollisions(); // Encapsulated logic returns true if a bumper bounce happened
        if (checkBumperCollisions()) { // Call and check return value
             bounced = true;
        }

        // --- Handle Bounce Effects (Sound, Image Swap) ---
        if (bounced) {
            // Play bounce sound (with cooldown)
            if (!isMuted && squeakSound?.isLoaded() && (currentTime > lastBounceTime + bounceCooldown)) {
                squeakSound.play();
                lastBounceTime = currentTime;
            }
            // Swap to hit image (if available)
            if (imgHit) { // Check if hit image is loaded
                currentImage = imgHit;
                isSwapped = true;
                hitSwapStartTime = millis();
            }
        }

        // --- Draw Face ---
        push();
        translate(x, y); // Move to face position
        rotate(angle);   // Apply rotation
        image(currentImage, 0, 0, imgWidth, imgHeight); // Draw the (possibly swapped) image
        pop();

        // --- Particle Trail ---
        // Only add trail particles if moving significantly and periodically
        let speedSq = vx * vx + vy * vy;
        if (speedSq > 1 && frameCount % 4 === 0) {
            let particleColor = color(red(pacManYellow), green(pacManYellow), blue(pacManYellow), 150); // Yellowish trail
            particles.push({
                x: x + random(-imgWidth / 4, imgWidth / 4), // Random offset from center
                y: y + random(-imgHeight / 4, imgHeight / 4),
                vx: random(-0.5, 0.5) - vx * 0.1, // Particle moves slowly, slightly opposite to face velocity
                vy: random(-0.5, 0.5) - vy * 0.1,
                lifespan: random(20, 40), // Short lifespan
                color: particleColor,
                size: random(3, 6)
            });
        }
    } else {
        // Error message if images aren't ready (shouldn't happen often with proper loading)
        textAlign(CENTER, CENTER);
        fill(255, 0, 0);
        textSize(16);
        text("ERROR: Gameplay Images not ready!", width / 2, height / 2);
    }
} // End drawBouncingFace()

// --- Bumper Collision Logic ---
function checkBumperCollisions() {
    let bumperCollisionOccurred = false;
    // Ensure image dimensions are valid before calculating radius
    if (typeof imgWidth !== 'number' || typeof imgHeight !== 'number') {
        return false; // Cannot check collisions without image size
    }
    let approxImgRadius = min(imgWidth / 2, imgHeight / 2); // Approximate radius for collision

    for (let b of bumpers) {
        if (!b.active) continue; // Skip inactive bumpers

        let d = dist(x, y, b.x, b.y); // Distance between face center and bumper center
        let collisionDist = b.r + approxImgRadius; // Collision distance

        if (d < collisionDist) { // Collision detected
             bumperCollisionOccurred = true; // Mark that a collision happened

            // --- Combo Logic ---
            let hitTime = millis();
            if (hitTime - lastBumperHitTime < COMBO_WINDOW) {
                comboCount++; // Increment combo if within time window
            } else {
                comboCount = 1; // Reset combo if too much time passed
            }
            lastBumperHitTime = hitTime; // Update last hit time

            // Calculate score bonus based on combo
            let scoreBonus = 10 * comboCount;
            score += scoreBonus;

            // Display combo text effect if combo count >= 2
            if (comboCount >= 2) {
                let effectText = `${comboCount}x`;
                effects.push({
                    x: b.x, y: b.y - 15, // Position above the bumper
                    text: effectText,
                    lifespan: 60, initialLifespan: 60, // Effect duration (frames)
                    size: 16 + comboCount * 2, // Larger text for higher combos
                    color: color(255, 255, 0, 255) // Bright yellow
                });
            }

            // --- Physics Response ---
            let dx_n = (x - b.x) / d; // Normalized vector from bumper to face
            let dy_n = (y - b.y) / d;

            // Reflect velocity (simple axis-aligned approximation for now)
            let ovx=vx; let ovy=vy;
             if(abs(x - b.x) > abs(y - b.y)){ // More horizontal collision
                 vx *= -1;
                 angularVelocity = spinAmount * Math.sign(ovy || 1);
             } else { // More vertical collision
                 vy *= -1;
                 angularVelocity = spinAmount * -Math.sign(ovx || 1);
             }

            // Move face slightly out of the bumper to prevent sticking
            let overlap = collisionDist - d;
            x += dx_n * (overlap + 1);
            y += dy_n * (overlap + 1);

            // --- Bumper Damage & Destruction ---
            b.hits++;
            if (b.hits >= b.maxHits) {
                b.active = false; // Deactivate bumper
                // Create particle explosion effect
                for (let k = 0; k < 15; k++) {
                    let angle = random(TWO_PI);
                    let speed = random(1, 4);
                    let particleColor = b.baseColor;
                    particles.push({
                        x: b.x, y: b.y,
                        vx: cos(angle) * speed, vy: sin(angle) * speed,
                        lifespan: random(30, 60),
                        color: color(red(particleColor), green(particleColor), blue(particleColor), 200), // Use bumper color
                        size: random(4, 8)
                    });
                }
            }
            // Since we handle one collision per frame for simplicity, break after finding one
            break;
        }
    }
    return bumperCollisionOccurred;
} // End checkBumperCollisions()


// --- Draw HUD (Score/Timer) ---
function drawGameHUD() {
    if (retroFont) textFont(retroFont); else textFont('monospace');

    // --- Score Display ---
    textSize(16);
    fill(pacManYellow);
    textAlign(LEFT, TOP);
    text('SCORE: ' + score, 20, 20);

    // --- Timer Display (Text and Bar) ---
    if (gameState === 'playing') { // Only show timer elements during active play
        let timerColor = (gameTimer <= 10) ? pacManRed : pacManYellow; // Red when time is low
        textSize(20);
        fill(timerColor);
        textAlign(RIGHT, TOP);
        text('TIME: ' + gameTimer, width - 20, 20);

        // --- Visual Timer Bar ---
        let timerBarWidth = 200;
        let timerBarHeight = 15;
        let timerBarX = width - timerBarWidth - 20; // Align with text timer
        let timerBarY = 50; // Position below text timer
        let timerProgress = gameTimer / gameDuration; // Normalize timer 0-1

        // Draw background of the timer bar
        fill(50, 50, 50); // Dark grey background
        noStroke();
        rect(timerBarX, timerBarY, timerBarWidth, timerBarHeight);

        // Draw the progress part of the bar with color transition
        let currentBarWidth = timerBarWidth * timerProgress;
        let barColor;
        if (timerProgress > 0.5) { // Green fading to Yellow
            barColor = lerpColor(pacManYellow, color(0, 255, 0), map(timerProgress, 0.5, 1.0, 0, 1));
        } else { // Yellow fading to Red
            barColor = lerpColor(pacManRed, pacManYellow, map(timerProgress, 0, 0.5, 0, 1));
        }
        fill(barColor);
        rect(timerBarX, timerBarY, currentBarWidth, timerBarHeight);

        // Draw border around the timer bar
        noFill();
        stroke(150); // Light grey border
        strokeWeight(1);
        rect(timerBarX, timerBarY, timerBarWidth, timerBarHeight);
        noStroke(); // Reset stroke
    }
} // End drawGameHUD()

// --- Handle Timer Countdown and Win Condition Check ---
function handleTimerCountdown() {
    // Calculate remaining time based on elapsed time since game start
    let elapsedSeconds = floor((millis() - gameStartTime) / 1000);
    gameTimer = max(0, gameDuration - elapsedSeconds); // Ensure timer doesn't go below 0

    if (gameTimer <= 0) {
        // Time ran out - transition to Game Over (Time) state
        changeStateToGameOverTime();
    } else {
        // Check win condition: All bumpers cleared?
        // (Only check if there are bumpers to begin with)
        if (bumpers.length > 0 && bumpers.every(b => !b.active)) {
            // All bumpers are inactive - Player Wins!
            checkAndSaveHighScore(); // Save score before changing state
            if (musicGameplay?.isPlaying()) {
                musicGameplay.stop();
                gameMusicStarted = false;
            }
            // Start fading out to the win screen
            gameState = 'fadingOut';
            gameOverStartTimeFrame = frameCount; // Record frame when fading starts
        }
    }
} // End handleTimerCountdown()

// --- Handle Fading Out (Transition to Win Screen) ---
function handleFadingOut() {
    let fadeDurationFrames = 60; // Duration of the fade in frames
    // Calculate fade progress (0 to 1)
    let fadeProgress = constrain(frameCount - gameOverStartTimeFrame, 0, fadeDurationFrames) / fadeDurationFrames;

    // Draw a black rectangle with increasing opacity
    fill(0, 0, 0, fadeProgress * 255); // Alpha increases from 0 to 255
    noStroke();
    rect(0, 0, width, height); // Cover the entire screen

    // Once fade is complete, switch to the actual game over (win) state
    if (fadeProgress >= 1.0) {
        gameState = 'gameOver'; // Change state to the win screen
        calculateGameOverImageSizeAndPosition(); // Setup bouncing image for win screen

        // Start game over music if not muted
        if (!isMuted && musicGameOver?.isLoaded() && !musicGameOver.isPlaying()) {
            musicGameOver.loop();
            currentAttributionText = gameOverAttribution;
        } else if (!isMuted) {
             currentAttributionText = gameOverAttribution; // Ensure text shows even if music fails load
        } else {
             currentAttributionText = '';
        }
    }
} // End handleFadingOut()

// ============================
// --- GAME OVER (WIN) STATE ---
// ============================
function drawGameOverWin() {
    background(pacManBlack);

    // --- Confetti Effect ---
    // Add new confetti particles periodically if count is low
    if (frameCount % 3 === 0 && particles.length < 200) {
        let confettiX = random(width); // Spawn across the top
        let confettiColor = random(ghostColors); // Use theme colors
        particles.push({
            x: confettiX,
            y: random(-20, 0), // Start slightly above screen
            vx: random(-0.5, 0.5), // Slight horizontal drift
            vy: random(1.5, 4),    // Fall downwards
            lifespan: 150, // How long confetti lasts (frames)
            color: color(red(confettiColor), green(confettiColor), blue(confettiColor), 200), // Semi-transparent
            size: random(5, 10),   // Size of confetti pieces
            angle: random(TWO_PI), // Initial rotation
            rotationSpeed: random(-0.1, 0.1), // How fast it spins
            isConfetti: true       // Flag for different drawing style
        });
    }
    // Note: updateAndDrawParticles() is called in the main draw loop

    // --- Draw Winning Head Bouncing ---
    if (imgNormal && typeof gameOverY === 'number' && typeof gameOverImgHeight === 'number' && gameOverImgHeight > 0) { // Ensure image and position are valid
        // Update vertical position and velocity for bounce
        gameOverY += gameOverVY;
        let halfGameOverH = gameOverImgHeight / 2;

        // Check bounce boundaries
        if (gameOverY - halfGameOverH <= gameOverBounceTop) { // Hit top boundary
            gameOverY = gameOverBounceTop + halfGameOverH; // Correct position
            gameOverVY *= -1; // Reverse velocity
        } else if (gameOverY + halfGameOverH >= gameOverBounceBottom) { // Hit bottom boundary
            gameOverY = gameOverBounceBottom - halfGameOverH; // Correct position
            gameOverVY *= -1; // Reverse velocity
        }

        // Draw the bouncing image (using the last selected normal head)
        image(imgNormal, width / 2, gameOverY, gameOverImgWidth, gameOverImgHeight);
    } else if (imgNormal && typeof imgWidth === 'number' && typeof imgHeight === 'number') { // Check if base dimensions are valid
        // Fallback if bounce variables aren't ready: draw statically
        image(imgNormal, width / 2, height * 0.3, imgWidth * 1.2, imgHeight * 1.2); // Slightly larger
    }

    // --- Draw Winning Text ---
    if (retroFont) textFont(retroFont); else textFont('monospace');
    fill(pacManYellow);
    textAlign(CENTER, CENTER);

    // Calculate Y position for text block below the bounce area
    let textY = (typeof gameOverBounceBottom === 'number' ? gameOverBounceBottom : height * 0.45) + 60;

    textSize(32);
    text("YOU WIN!", width / 2, textY);

    textSize(20);
    text("FINAL SCORE: " + score, width / 2, textY + 60);

    // Display High Score
    fill(pacManCyan); // Different color for high score
    text('High Score: ' + highScore, width / 2, textY + 90);

    // Restart Prompt
    fill(pacManYellow); // Back to yellow
    textSize(14);
    text("(Press any key to restart)", width / 2, textY + 120);
} // End drawGameOverWin()

// ============================
// --- GAME OVER (TIME OUT) STATE ---
// ============================
function drawGameOverTime() {
    background(pacManBlack);

    // --- Draw the Head Image (Statically) ---
    if (imgNormal && typeof imgWidth === 'number' && imgWidth > 0) {
        // Draw the last used normal head image, slightly larger
        image(imgNormal, width / 2, height * 0.3, imgWidth * 1.2, imgHeight * 1.2);
    }

    // --- Draw Losing Text ---
    if (retroFont) textFont(retroFont); else textFont('monospace');
    fill(pacManRed); // Use red for losing message
    textAlign(CENTER, CENTER);

    let textY = height * 0.55; // Position text block lower middle

    textSize(32);
    text("TIME UP!", width / 2, textY); // Changed from "Oh no, you lost!"

    // Display Final Score
    fill(pacManYellow); // Yellow for score
    textSize(20);
    text("FINAL SCORE: " + score, width / 2, textY + 50);

    // Display High Score
    fill(pacManCyan); // Cyan for high score
    text('High Score: ' + highScore, width / 2, textY + 80);

    // Restart Prompt
    fill(pacManYellow); // Yellow for prompt
    textSize(14);
    text("(Press any key to restart)", width / 2, textY + 110);
} // End drawGameOverTime()


// ============================
// --- HELPER & UTILITY FUNCTIONS ---
// ============================

// --- Create Scanlines Effect Graphic ---
// Creates an offscreen graphics buffer with horizontal lines
function createScanlinesGraphic() {
    scanlines = createGraphics(windowWidth, windowHeight); // Match canvas size
    scanlines.pixelDensity(1); // Keep it simple
    scanlines.stroke(0, 35); // Black lines, semi-transparent
    scanlines.strokeWeight(1); // Thin lines

    // Draw horizontal lines every 3 pixels
    for (let i = 0; i < windowHeight; i += 3) {
        scanlines.line(0, i, windowWidth, i);
    }
    print("Scanlines graphic created/updated.");
} // End createScanlinesGraphic()

// --- Reset Common State Variables ---
// Used when starting a new game or restarting the sketch
function resetOtherStates() {
    isSwapped = false; // Reset hit image swap state
    // Reset music flags (they will be set again when states are entered)
    titleMusicStarted = false;
    selectMusicStarted = false;
    gameMusicStarted = false;
    // Note: isMuted is preserved across resets
    isHammerStriking = false;
    score = 0;
    addBumperAfterSwing = false; // Reset intention to add bumper
    hammerLandedHit = false;    // Reset hit flag
    selectHue = random(360);    // Randomize starting hue for select screen
    particles = [];             // Clear all particles
    effects = [];               // Clear floating text effects
    shakeAmount = 0;            // Reset screen shake
    lastBumperHitTime = 0;      // Reset combo timer
    comboCount = 0;             // Reset combo counter
    resetImageState();          // Reset bouncing face position/velocity
    console.log("Common game states reset.");
} // End resetOtherStates()

// --- Initialize Title Screen Specific Values ---
function initializeTitleScreenState() {
    // Ensure image dimensions are available for calculations
    if (typeof imgWidth !== 'number' || !imgWidth || imgWidth <= 0) { // Check for valid width
        calculateImageSize(); // Calculate size if needed
    }
    // Define boundaries for the sweeping animation
    titleSweepStartX = -(imgWidth || 100) - 50; // Start off-screen left
    titleSweepEndX = width + (imgWidth || 100) + 50; // End off-screen right

    // Initial positions for face and hammer (start off-screen left)
    titleFaceX = titleSweepStartX;
    titleFaceY = height * 0.55; // Initial Y position
    titleHammerX = titleSweepStartX - 150; // Hammer starts behind face
    titleHammerY = height * 0.6;

    // Title text animation setup
    titleHue = random(360);         // Random starting hue for title text
    smashHeadTargetY = height * 0.20; // Target Y position for "SMASH HEAD"
    smashHeadY = -150;              // Start title text above the screen
    smashHeadAnimDone = false;      // Flag for title text animation completion

    // Title hammer animation setup
    titleHammerAngle = hammerRestAngle; // Start hammer at rest
    isTitleHammerStriking = false;      // Not initially striking

    currentAttributionText = titleAttribution; // Set correct music credit
    console.log("Title Screen State Initialized.");
} // End initializeTitleScreenState()

// --- Create Initial Set of Bumpers for Gameplay ---
function createInitialBumpers() {
    bumpers = []; // Clear any existing bumpers
    let margin = 50; // Minimum distance from edges
    let R = bumperRadius;

    // Attempt to place bumpers without overlapping (simple approach)
    let attempts = 0;
    let maxAttempts = numInitialBumpers * 10; // Prevent infinite loop

    while (bumpers.length < numInitialBumpers && attempts < maxAttempts) {
        attempts++;
        let safeX = random(margin + R, width - margin - R);
        let safeY = random(margin + R, height - margin - R);
        let overlapping = false;

        // Check for overlap with existing bumpers
        for(let existingBumper of bumpers) {
            if (dist(safeX, safeY, existingBumper.x, existingBumper.y) < R * 2 + 10) { // Check distance + small buffer
                overlapping = true;
                break;
            }
        }

        // Add bumper if no overlap found
        if (!overlapping) {
             bumpers.push({
                x: safeX, y: safeY,
                r: bumperRadius, baseColor: random(ghostColors),
                hits: 0, maxHits: bumperMaxHits, active: true
             });
        }
    }

    if (bumpers.length < numInitialBumpers) {
        console.warn(`Could only place ${bumpers.length}/${numInitialBumpers} bumpers without overlap.`);
    }
    console.log(`Created ${bumpers.length} gameplay bumpers.`);
} // End createInitialBumpers()


// --- Calculate Image/Hammer Sizes Based on Window Size ---
function calculateImageSize() {
    // Use the currently selected normal image for calculation, or default if needed
    let baseImg = imgNormal || normalHeadImages[0]; // Fallback to preloaded default

    if (baseImg && baseImg.width > 0) {
        // Calculate desired width based on window width, capped by maxImageWidth
        let desiredWidth = width * 0.15; // 15% of window width
        let targetWidth = min(desiredWidth, maxImageWidth); // Apply max width cap

        // Calculate scale factor based on target width
        let scaleFactor = targetWidth / baseImg.width;

        // Apply scale factor to get final dimensions
        imgWidth = baseImg.width * scaleFactor;
        imgHeight = baseImg.height * scaleFactor;

        // Ensure image doesn't become excessively tall
        if (imgHeight > height * 0.8) {
            scaleFactor = (height * 0.8) / baseImg.height; // Recalculate scale based on height
            imgWidth = baseImg.width * scaleFactor;
            imgHeight = baseImg.height * scaleFactor;
        }
    } else {
        // Fallback if no valid image is available
        if (!imgWidth || imgWidth <= 0) { // Only set default if not already set or invalid
             imgWidth = 100;
             imgHeight = 100;
             console.warn("No valid base image for size calculation, using default 100x100.");
        }
    }

    // Calculate Hammer display size based on the calculated image width
    hammerDisplayWidth = imgWidth; // Match hammer width to face width
    if (hammerImg && hammerImg.width > 0) {
        // Maintain aspect ratio for hammer
        hammerDisplayHeight = hammerImg.height * (hammerDisplayWidth / hammerImg.width);
    } else {
        // Fallback hammer height if image not loaded or invalid
        hammerDisplayHeight = hammerDisplayWidth * 1.5; // Default aspect ratio
    }

    // Calculate head size for the character select screen (slightly smaller)
    selectHeadSize = imgWidth * 0.9;

    // Added check to prevent NaN or zero values which cause issues later
    if (!hammerDisplayWidth || hammerDisplayWidth <= 0) hammerDisplayWidth = 100;
    if (!hammerDisplayHeight || hammerDisplayHeight <= 0) hammerDisplayHeight = 150;
    if (!selectHeadSize || selectHeadSize <= 0) selectHeadSize = 90;


    console.log(`Calculated image size: ${imgWidth?.toFixed(1)}x${imgHeight?.toFixed(1)}, Hammer: ${hammerDisplayWidth?.toFixed(1)}x${hammerDisplayHeight?.toFixed(1)}, Select: ${selectHeadSize?.toFixed(1)}`);
} // End calculateImageSize()


// --- Reset Bouncing Image Position and Velocity ---
function resetImageState() {
    let margin = 30; // Distance from top-left corner
    // Use calculated size or default if calculation failed
    let startX = (imgWidth / 2 || 50) + margin;
    let startY = (imgHeight / 2 || 50) + margin;

    x = startX;
    y = startY;
    angle = 0;              // Reset rotation
    angularVelocity = 0;    // Reset spin speed

    // Give initial random velocity
    let speed = 5;
    vx = random(2, speed); // Random horizontal speed
    vy = random(2, speed); // Random vertical speed
    // Randomize initial direction
    if (random() > 0.5) vx *= -1;
    if (random() > 0.5) vy *= -1;
} // End resetImageState()

// --- Trigger Screen Shake Effect ---
function triggerShake(amount, durationMs) {
    shakeAmount = amount;
    shakeDuration = durationMs;
    shakeStartTime = millis(); // Record start time
} // End triggerShake()

// --- Check and Save High Score to Local Storage ---
function checkAndSaveHighScore() {
    if (score > highScore) {
        highScore = score;
        try {
            storeItem('smashHeadHighScore', highScore); // Store the new high score
            print(`New High Score Saved: ${highScore}`);
        } catch (e) {
            console.error("Failed to save high score to localStorage:", e);
        }
    }
} // End checkAndSaveHighScore()

// --- Draw Attribution Text (Music Credit, Mute Status) ---
function drawAttributionText() {
    push(); // Isolate text styling
    textFont('sans-serif'); // Use a standard readable font
    textSize(10);
    textAlign(RIGHT, BOTTOM); // Position at bottom-right corner
    let muteText = isMuted ? "[M] Muted / " : "[M] Music ON / ";
    fill(180); // Light grey color
    text(muteText + currentAttributionText, width - 10, height - 10); // Draw text
    pop(); // Restore previous text settings
} // End drawAttributionText()

// --- Draw and Update Particles (Trails, Impacts, Confetti) ---
function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) { // Iterate backwards for safe removal
        let p = particles[i];

        // Update particle state
        p.x += p.vx;
        p.y += p.vy;
        p.lifespan -= 1;     // Decrease lifespan
        p.size *= 0.98;     // Shrink particle over time (can be adjusted)
         if (p.isConfetti) { // Apply rotation and gravity to confetti
             p.angle = (p.angle || 0) + (p.rotationSpeed || 0);
             p.vy += 0.05; // Simple gravity for confetti
         }


        // Remove particle if lifespan ended or too small
        if (p.lifespan <= 0 || p.size < 0.5) {
            particles.splice(i, 1); // Remove from array
        } else {
            // Draw particle
            noStroke();
            // Fade out particle based on remaining lifespan
            let currentAlpha = map(p.lifespan, 0, 40, 0, alpha(p.color || color(255))); // Fade out faster near end
            let particleColor = p.color || color(255);
            fill(red(particleColor), green(particleColor), blue(particleColor), currentAlpha);

            if (p.isConfetti) { // Draw confetti as rotating rectangles
                push();
                translate(p.x, p.y);
                rotate(p.angle);
                rectMode(CENTER); // Draw rectangle centered at particle position
                rect(0, 0, p.size, p.size / 2); // Wider than tall
                pop();
                rectMode(CORNER); // Reset rect mode
            } else { // Draw regular particles as ellipses
                ellipse(p.x, p.y, p.size, p.size);
            }
        }
    }
} // End updateAndDrawParticles()


// --- Draw and Update Floating Text Effects (Combos) ---
function updateAndDrawEffects() {
    for (let i = effects.length - 1; i >= 0; i--) { // Iterate backwards for safe removal
        let fx = effects[i];

        // Update effect state
        fx.lifespan -= 1; // Decrease lifespan
        fx.y -= 0.5;      // Slowly rise upwards
        fx.size *= 0.99;  // Slightly shrink

        // Remove effect if lifespan ended
        if (fx.lifespan <= 0) {
            effects.splice(i, 1); // Remove from array
        } else {
            // Draw effect text
            push();
            // Fade out effect based on remaining lifespan
            let currentAlpha = map(fx.lifespan, 0, fx.initialLifespan, 0, 255);
            textSize(fx.size);
            textAlign(CENTER, CENTER);
            if (retroFont) textFont(retroFont); else textFont('monospace'); // Use retro font if loaded

            let effectColor = fx.color || color(255);
            fill(red(effectColor), green(effectColor), blue(effectColor), currentAlpha);
            text(fx.text, fx.x, fx.y); // Draw the text (e.g., "2x")
            pop();
        }
    }
} // End updateAndDrawEffects()

// --- Hammer Hit Detection Logic ---
// Checks collision between hammer head and bouncing face
function checkHammerHit() {
    // Ensure required variables are valid numbers/objects
    if (!imgNormal || !currentImage || typeof x !== 'number' || typeof y !== 'number' ||
        typeof hammerStrikeAngle !== 'number' || typeof hammerDisplayWidth !== 'number' || !hammerImg || hammerDisplayWidth <= 0) { // Added check for hammerDisplayWidth > 0
        console.warn("checkHammerHit called with invalid data.");
        return;
    }

    // Calculate hammer head's position when at the strike angle
    let strikeAngle = hammerStrikeAngle; // Angle during the hit check window
    // Pivot point offset within the hammer image
    let pivotOffsetX = hammerDisplayWidth * hammerPivotRatioX;
    let pivotOffsetY = hammerDisplayHeight * hammerPivotRatioY;
    // Hammer head center offset relative to pivot point
    let headCenterOffsetX_RelPivot = (hammerDisplayWidth * hammerHeadCenterRatioX) - pivotOffsetX;
    let headCenterOffsetY_RelPivot = (hammerDisplayHeight * hammerHeadCenterRatioY) - pivotOffsetY;
    // Hammer head radius for collision detection
    let headRadius = hammerDisplayWidth * hammerHeadRadiusRatio;

    // Rotate the head center offset by the strike angle
    let rotatedHeadOffsetX = headCenterOffsetX_RelPivot * cos(strikeAngle) - headCenterOffsetY_RelPivot * sin(strikeAngle);
    let rotatedHeadOffsetY = headCenterOffsetX_RelPivot * sin(strikeAngle) + headCenterOffsetY_RelPivot * cos(strikeAngle);

    // Absolute world position of the hammer head center during strike
    let hammerHeadWorldX = mouseX + rotatedHeadOffsetX;
    let hammerHeadWorldY = mouseY + rotatedHeadOffsetY;

    // Bouncing face position and approximate radius
    let faceX = x;
    let faceY = y;
    let faceRadius = min(imgWidth || 100, imgHeight || 100) / 2; // Use calculated or default size

    // Calculate distance between hammer head center and face center
    let distance = dist(hammerHeadWorldX, hammerHeadWorldY, faceX, faceY);
    let collisionThreshold = headRadius + faceRadius; // Sum of radii

    // --- Collision Detected ---
    if (distance < collisionThreshold) {
        console.log("Hammer HIT Face!");
        hammerLandedHit = true; // Flag that the face was hit

        // Play "ow" sound if loaded and not muted
        if (!isMuted && owSound?.isLoaded()) owSound.play();

        // Apply physics impulse to the face
        let hitSpeed = 6; // Base speed imparted by hit
        // Calculate direction from hammer head to face center
        let hitAngle = atan2(faceY - hammerHeadWorldY, faceX - hammerHeadWorldX);
        vx = cos(hitAngle) * hitSpeed * random(0.8, 1.2); // Apply speed in hit direction with slight variation
        vy = sin(hitAngle) * hitSpeed * random(0.8, 1.2);
        // Add random spin on hit
        angularVelocity += random(-hammerHitSpinAmount, hammerHitSpinAmount);

        // Swap to hit image if available
        let hitImageObject = hitHeadImages[chosenHeadIndex] || imgHit; // Use specific or default hit img
        if (hitImageObject) {
            currentImage = hitImageObject;
        } else {
            console.warn("Hit occurred but no hit image loaded for index " + chosenHeadIndex);
        }
        isSwapped = true;
        hitSwapStartTime = millis();

        // Trigger screen shake
        triggerShake(5, 150); // Amount: 5 pixels, Duration: 150ms

        // Create impact particle effect at hit location
        let impactX = faceX;
        let impactY = faceY;
        for (let k = 0; k < 10; k++) {
            let angle = random(TWO_PI);
            let speed = random(2, 5);
            particles.push({
                x: impactX, y: impactY,
                vx: cos(angle) * speed * 0.5, // Particles move slower than face bounce
                vy: sin(angle) * speed * 0.5,
                lifespan: random(15, 30), // Short lifespan for impact sparks
                color: color(255, 255, 255, 200), // White sparks
                size: random(3, 6)
            });
        }
        // If adding bumpers on miss, cancel it because we hit the face
        addBumperAfterSwing = false;
        potentialBumperX = -1;
        potentialBumperY = -1;

    } else {
        // --- Missed ---
        console.log("Hammer MISS");
        hammerLandedHit = false; // Flag that face was missed
        // Play "fart" sound on miss if loaded and not muted
        if (!isMuted && fartSound?.isLoaded()) fartSound.play();
        // Note: The logic to potentially add a bumper on miss is handled
        // at the end of the hammer swing animation in updateHammer()
    }
} // End checkHammerHit()

// --- Toggle Mute State ---
function toggleMute() {
    isMuted = !isMuted;
    if (muteButton) { // Update button text
        muteButton.html(isMuted ? 'Unmute' : 'Mute');
    }

    if (isMuted) {
        // Stop all currently playing music tracks
        if (musicPlaying?.isPlaying()) musicPlaying.stop();
        if (musicSelect?.isPlaying()) musicSelect.stop();
        if (musicGameplay?.isPlaying()) musicGameplay.stop();
        if (musicGameOver?.isPlaying()) musicGameOver.stop();
        // Reset flags so music can restart if unmuted in the correct state
        titleMusicStarted = false;
        selectMusicStarted = false;
        gameMusicStarted = false;
        currentAttributionText = ''; // Clear attribution when muted
        console.log("--- Music MUTED ---");
    } else {
        console.log("--- Music UNMUTED ---");
        // If unmuting, try to restart music for the *current* game state
        if (gameState === 'titleScreen' && musicPlaying?.isLoaded()) {
            musicPlaying.loop();
            titleMusicStarted = true;
            currentAttributionText = titleAttribution;
        } else if (gameState === 'characterSelect' && musicSelect?.isLoaded()) {
            musicSelect.loop();
            selectMusicStarted = true;
            currentAttributionText = selectAttribution;
        } else if ((gameState === 'playing' || gameState === 'fadingOut') && musicGameplay?.isLoaded()) {
            musicGameplay.loop();
            gameMusicStarted = true;
            currentAttributionText = gameplayAttribution;
        } else if ((gameState === 'gameOver' || gameState === 'gameOverTime') && musicGameOver?.isLoaded()) {
            musicGameOver.loop();
            currentAttributionText = gameOverAttribution;
        }
         else { // If music for current state isn't loaded, just set text
             if(gameState === 'titleScreen') currentAttributionText = titleAttribution;
             else if(gameState === 'characterSelect') currentAttributionText = selectAttribution;
             else if(gameState === 'playing' || gameState === 'fadingOut') currentAttributionText = gameplayAttribution;
             else if(gameState === 'gameOver' || gameState === 'gameOverTime') currentAttributionText = gameOverAttribution;
         }
    }
} // End toggleMute()

// --- Transition from Title to Character Select ---
function goToCharacterSelect() {
    console.log("Transitioning to Character Select...");
    // Stop title/game over/gameplay music if playing
    if (musicPlaying?.isPlaying()) { musicPlaying.stop(); titleMusicStarted = false; }
    if (musicGameOver?.isPlaying()) { musicGameOver.stop(); }
    if (musicGameplay?.isPlaying()) { musicGameplay.stop(); gameMusicStarted = false; }

    // Start select music if not muted and loaded
    if (!isMuted && musicSelect?.isLoaded() && !selectMusicStarted) {
        musicSelect.loop();
        selectMusicStarted = true;
        currentAttributionText = selectAttribution;
    } else if (!isMuted) { // Set text even if music not ready/playing
        currentAttributionText = selectAttribution;
    } else {
        currentAttributionText = ''; // Clear if muted
    }
    gameState = 'characterSelect'; // Change state
} // End goToCharacterSelect()

// --- Start the Game (from Character Select) ---
function startGame() {
    console.log(`Starting Game with Head Index ${chosenHeadIndex}...`);
    // Stop title/select/game over music if playing
    if (musicPlaying?.isPlaying()) { musicPlaying.stop(); titleMusicStarted = false; }
    if (musicSelect?.isPlaying()) { musicSelect.stop(); selectMusicStarted = false; }
    if (musicGameOver?.isPlaying()) { musicGameOver.stop(); }

    // Start gameplay music if not muted and loaded
    if (!isMuted && musicGameplay?.isLoaded()) {
        musicGameplay.loop();
        gameMusicStarted = true;
        currentAttributionText = gameplayAttribution;
    } else if (!isMuted) { // Set text even if music not ready/playing
        currentAttributionText = gameplayAttribution;
    } else {
        currentAttributionText = ''; // Clear if muted
    }

    // --- Set Correct Images for Chosen Head ---
    // Ensure both normal and hit images for the selected index are loaded
    if (normalHeadImages[chosenHeadIndex] && hitHeadImages[chosenHeadIndex] && normalHeadImages[chosenHeadIndex].width > 0 && hitHeadImages[chosenHeadIndex].width > 0) {
        imgNormal = normalHeadImages[chosenHeadIndex];
        imgHit = hitHeadImages[chosenHeadIndex];
        currentImage = imgNormal; // Start with the normal image
        console.log(`Set images for head index ${chosenHeadIndex}.`);
        calculateImageSize(); // Recalculate sizes based on the chosen head's aspect ratio
    } else {
        // If images aren't loaded, log error and stay on select screen
        console.error(`Cannot start game, images for head index ${chosenHeadIndex} missing or not loaded yet!`);
        alert(`Images for selected head (${chosenHeadIndex+1}) still loading. Please wait a moment and try again.`);
        // Revert to character select state to prevent errors
        gameState = 'characterSelect';
        // Attempt to restart select music if it was stopped
         if (!isMuted && musicSelect?.isLoaded() && !selectMusicStarted) {
             musicSelect.loop();
             selectMusicStarted = true;
             currentAttributionText = selectAttribution;
         }
        return; // Exit startGame function
    }

    // --- Reset Game State Variables ---
    resetOtherStates(); // Reset score, positions, effects, etc.
    score = 0;          // Explicitly reset score again (belt and suspenders)
    gameTimer = gameDuration; // Reset timer
    gameStartTime = millis();   // Record game start time
    createInitialBumpers();   // Create new set of bumpers
    hammerAngle = hammerRestAngle; // Reset hammer position
    isHammerStriking = false;    // Ensure hammer isn't stuck mid-swing
    addBumperAfterSwing = false; // Reset bumper placement intent
    hammerLandedHit = false;     // Reset hit flag

    // Change game state to playing
    gameState = 'playing';
    console.log("Game Started.");
} // End startGame()


// --- Change State to Game Over (Time Out) ---
function changeStateToGameOverTime() {
    console.log("Time's up! Game Over.");
    checkAndSaveHighScore(); // Save score before changing state

    // Stop gameplay music if playing
    if (musicGameplay?.isPlaying()) {
        musicGameplay.stop();
        gameMusicStarted = false;
    }

    gameState = 'gameOverTime'; // Change state

    // Start game over music if not muted and loaded
    if (!isMuted && musicGameOver?.isLoaded() && !musicGameOver.isPlaying()) {
        musicGameOver.loop();
        currentAttributionText = gameOverAttribution;
        console.log("Game Over music started (Time Loss).");
    } else if (!isMuted) { // Set text even if music not ready/playing
        currentAttributionText = gameOverAttribution;
    } else {
        currentAttributionText = ''; // Clear if muted
    }
} // End changeStateToGameOverTime()

// --- Restart the Entire Sketch (Back to Title Screen) ---
function restartSketch() {
    console.log("Resetting to Title Screen...");
    // Stop all music
    if (musicGameOver?.isPlaying()) { musicGameOver.stop(); }
    if (musicPlaying?.isPlaying()) { musicPlaying.stop(); titleMusicStarted = false;}
    if (musicSelect?.isPlaying()) { musicSelect.stop(); selectMusicStarted = false;}
    if (musicGameplay?.isPlaying()) { musicGameplay.stop(); gameMusicStarted = false;}

    // Reset game variables
    resetOtherStates();

    // Reset to default head (index 0)
    chosenHeadIndex = 0;
    if (normalHeadImages[chosenHeadIndex]) { // Check if default head loaded
        imgNormal = normalHeadImages[chosenHeadIndex];
        if (hitHeadImages[chosenHeadIndex]) { // Check if default hit head loaded
             imgHit = hitHeadImages[chosenHeadIndex];
        } else {
             imgHit = null; // Default hit image might still be loading
             console.warn("Default hit image not available on restart.");
        }
        currentImage = imgNormal; // Set current image to default normal
        calculateImageSize();      // Recalculate sizes for default head
    } else {
        // Critical error if default head didn't load
        imgNormal = null;
        imgHit = null;
        currentImage = null;
        console.error("FATAL: Default head image (index 0) not loaded. Cannot properly restart.");
        // Consider drawing an error message here if possible
    }

    // Reset title screen specific state
    initializeTitleScreenState();

    // Set game state back to title screen
    gameState = 'titleScreen';
    // Music will restart automatically when drawTitleScreen runs (if not muted)
    console.log("Sketch reset to Title Screen.");
} // End restartSketch()

// --- Calculate Size and Position for Bouncing Image on Win Screen ---
function calculateGameOverImageSizeAndPosition() {
    // Ensure base dimensions are available
     if (typeof imgWidth !== 'number' || imgWidth <= 0 || typeof imgHeight !== 'number' || imgHeight <= 0) {
         if (imgNormal) calculateImageSize(); // Try recalculating if needed
         // Use defaults if recalculation also fails
         if (typeof imgWidth !== 'number' || imgWidth <= 0 || typeof imgHeight !== 'number' || imgHeight <= 0) {
             imgWidth = 100; imgHeight = 100;
             console.warn("Using default size for Game Over image calculation.");
         }
     }

    // Make the game over image slightly larger than gameplay, capped
    let maxWidthGameOver = maxImageWidth * 1.2; // Cap size increase
    gameOverImgWidth = min(imgWidth * 1.2, maxWidthGameOver);
    // Maintain aspect ratio based on the new width
    let scaleRatio = 1.0; // Default scale ratio
    if (imgWidth && imgWidth > 0) { // Avoid division by zero if imgWidth is invalid
        scaleRatio = gameOverImgWidth / (imgWidth * 1.2);
    }
    gameOverImgHeight = imgHeight * 1.2 * scaleRatio;


    // Define bounce boundaries dynamically based on height
    gameOverBounceTop = height * 0.15;
    gameOverBounceBottom = height * 0.45;

    // Ensure calculated height is valid
    if (typeof gameOverImgHeight !== 'number' || gameOverImgHeight <= 0) gameOverImgHeight = 120; // Fallback height

    // Set initial position slightly above the bottom boundary
    gameOverY = gameOverBounceBottom - gameOverImgHeight / 2 - 5;
    gameOverVY = -gameOverBounceSpeed; // Start moving upwards

    console.log("Initialized Game Over image bounce (Win).");
} // End calculateGameOverImageSizeAndPosition()

// --- Input Handlers ---

function mousePressed() {
    userStartAudio(); // Ensure audio context is running on user interaction

    if (gameState === 'playing') {
        // --- Trigger Hammer Swing in Gameplay ---
        if (!isHammerStriking) { // Only swing if not already swinging
            isHammerStriking = true;
            hammerTargetAngle = hammerStrikeAngle; // Target the down position
            hammerAnimStartTime = millis();       // Record swing start time
            hammerHitCheckDone = false;         // Reset hit check flag for this swing
            hammerLandedHit = false;            // Reset hit status for this swing

            // --- Check if click is intended to place a bumper (missed click) ---
            let UIMargin = 50; // Avoid placing bumpers near edges or HUD
            if (mouseX > UIMargin && mouseX < width - UIMargin &&
                mouseY > UIMargin && mouseY < height - UIMargin) {
                 // Store potential location, but only add if swing MISSES the face
                 potentialBumperX = mouseX;
                 potentialBumperY = mouseY;
                 addBumperAfterSwing = true; // Flag intention to add bumper
            } else {
                 addBumperAfterSwing = false; // Click was in UI area, don't add bumper
            }
        }
    } else if (gameState === 'characterSelect') {
        // --- Handle Head Selection Click ---
        // Use layout variables from drawHeadSelect for consistency
        // Estimate bottom of how-to-play (needs refinement if layout changes drastically)
         let howToPlayBottomApprox = 160 + max( (hammerDisplayHeight || 150) * 0.8 + (160 + (hammerDisplayHeight || 150)*0.8 * 0.6 - 160) + 20, (8 * 25 + 30)) + 20 * 2;
         let selectY = howToPlayBottomApprox + 80; // Y position for the row of heads
         let spacing = width / 4;
         let currentSelectHeadSize = typeof selectHeadSize === 'number' ? selectHeadSize : 90;

        for (let i = 0; i < 3; i++) { // Loop through the 3 heads
            let imgXPos = spacing * (i + 1);
            let displayImg = normalHeadImages[i];
            let headWidth = currentSelectHeadSize;
            let headHeight = currentSelectHeadSize; // Assume square initially

            // Calculate actual height based on aspect ratio if image is loaded
            if (displayImg && displayImg.width > 0) {
                 let aspect = displayImg.height / displayImg.width || 1;
                 headHeight = currentSelectHeadSize * aspect;
            }

            // Calculate clickable bounds (centered around imgXPos, selectY)
            let headLeft = imgXPos - headWidth / 2;
            let headRight = imgXPos + headWidth / 2;
            let headTop = selectY - headHeight / 2;
            let headBottom = selectY + headHeight / 2;

            // Check if mouse click is within these bounds
            if (mouseX > headLeft && mouseX < headRight && mouseY > headTop && mouseY < headBottom) {
                 selectHead(i); // Call selectHead with the index (0, 1, or 2)
                 break;         // Stop checking once a head is clicked
            }
        }
    }
     // Clicks in other states (title, game over) are handled by keyPressed
} // End mousePressed()

function keyPressed() {
    userStartAudio(); // Ensure audio context is running

    // --- Mute Toggle ---
    if (key === 'm' || key === 'M') {
        toggleMute();
    }
    // --- Restart from Game Over Screens ---
    else if (gameState === 'gameOver' || gameState === 'gameOverTime') {
        restartSketch();
    }
    // --- Proceed from Title Screen ---
    else if (gameState === 'titleScreen') {
        goToCharacterSelect();
    }
     // No specific key actions needed for 'playing' or 'characterSelect' here
     // (handled by mouse or state transitions)
} // End keyPressed()

function mouseMoved() {
    // --- Handle Hover Effect on Character Select Screen ---
    if (gameState === 'characterSelect') {
        let currentHover = -1; // Assume no hover initially
         // Use same layout calculations as drawHeadSelect and mousePressed
         // Estimate bottom of how-to-play (needs refinement if layout changes drastically)
         let howToPlayBottomApprox = 160 + max( (hammerDisplayHeight || 150) * 0.8 + (160 + (hammerDisplayHeight || 150)*0.8 * 0.6 - 160) + 20, (8 * 25 + 30)) + 20 * 2;
         let selectY = howToPlayBottomApprox + 80; // Y position for the row of heads
         let spacing = width / 4;
         let currentSelectHeadSize = typeof selectHeadSize === 'number' ? selectHeadSize : 90;

        for (let i = 0; i < 3; i++) {
            let imgXPos = spacing * (i + 1);
            let displayImg = normalHeadImages[i];
            let headWidth = currentSelectHeadSize;
            let headHeight = currentSelectHeadSize;

            if (displayImg && displayImg.width > 0) {
                 let aspect = displayImg.height / displayImg.width || 1;
                 headHeight = currentSelectHeadSize * aspect;
            }

            let headLeft = imgXPos - headWidth / 2;
            let headRight = imgXPos + headWidth / 2;
            let headTop = selectY - headHeight / 2;
            let headBottom = selectY + headHeight / 2;

            // Check if mouse is within bounds
            if (mouseX > headLeft && mouseX < headRight && mouseY > headTop && mouseY < headBottom) {
                 currentHover = i; // Set hovered index
                 break;           // Stop checking
            }
        }

        hoveredHeadIndex = currentHover; // Update the global hover index

        // Play blip sound only when the hovered index *changes* to a valid head
        if (hoveredHeadIndex !== previousHoverIndex) {
            if (hoveredHeadIndex !== -1 && selectBlipSound?.isLoaded() && !isMuted) {
                selectBlipSound.play(); // Play sound on new hover
            }
            previousHoverIndex = hoveredHeadIndex; // Update previous index
        }
    } else {
        // If not on character select screen, ensure no hover effect is active
        hoveredHeadIndex = -1;
        previousHoverIndex = -1;
    }
} // End mouseMoved()


// --- Handle Window Resizing ---
function windowResized() {
    resizeCanvas(windowWidth, windowHeight); // Adjust canvas size
    createScanlinesGraphic();                // Regenerate scanlines for new size

    // Recalculate image/UI element sizes and positions based on new window dimensions
    calculateImageSize(); // Recalculate head and hammer sizes

    // Update positions/boundaries that depend on width/height
    if (gameState === 'playing' || gameState === 'fadingOut') {
        // Constrain face position within new bounds if necessary
        // Ensure imgWidth/Height are valid before calculating half values
        if (typeof imgWidth === 'number' && typeof imgHeight === 'number') {
            let halfW = imgWidth / 2;
            let halfH = imgHeight / 2;
            x = constrain(x, halfW, width - halfW);
            y = constrain(y, halfH, height - halfH);
        }
         // Optionally: Could reposition bumpers slightly if they go off-screen,
         // but generally letting them stay might be simpler.
    } else if (gameState === 'gameOver') {
        // Recalculate game over bounce boundaries and potentially reposition image
        gameOverBounceTop = height * 0.15;
        gameOverBounceBottom = height * 0.45;
        calculateGameOverImageSizeAndPosition(); // Recalculate size and reset position/velocity
        // Ensure Y position is still within new bounds
         if (typeof gameOverY === 'number' && typeof gameOverImgHeight === 'number') {
            gameOverY = constrain(gameOverY, gameOverBounceTop + gameOverImgHeight / 2, gameOverBounceBottom - gameOverImgHeight / 2);
         }
    } else if (gameState === 'gameOverTime') {
         // Image size is recalculated by calculateImageSize() above. Static position.
    } else if (gameState === 'titleScreen') {
        // Reinitialize title screen elements for new layout
        initializeTitleScreenState();
    } else if (gameState === 'characterSelect') {
        // Layout is recalculated dynamically in drawCharacterSelect/drawHowToPlay/drawHeadSelect
        // No specific repositioning needed here, but recalculateImageSize() updated selectHeadSize.
    } // <-- This closing brace matches the 'if (gameState...' opening brace

    // Reposition fixed UI elements like the mute button
    if (muteButton) {
        muteButton.position(20, height - 40);
    }
    print(`Window resized to ${windowWidth}x${windowHeight}`);
} // End windowResized()


// --- Select Head Function (Called by mousePressed) ---
function selectHead(index) { // Index is 0, 1, or 2
    // Play selection sound
    if (selectBlipSound?.isLoaded() && !isMuted) {
        selectBlipSound.play();
    }
    chosenHeadIndex = index; // Update the chosen head index
    console.log(`Head index ${chosenHeadIndex} selected`);

    // --- Check if Images Are Loaded Before Starting ---
    // Critical check: Ensure both normal and hit images exist in the arrays
    // and ideally have finished loading (p5.js loadImage is async)
    let normalImgReady = normalHeadImages[chosenHeadIndex] && normalHeadImages[chosenHeadIndex].width > 0;
    let hitImgReady = hitHeadImages[chosenHeadIndex] && hitHeadImages[chosenHeadIndex].width > 0;

    if (normalImgReady && hitImgReady) {
        // Images are ready, proceed to start the game
        startGame();
    } else {
        // Images not ready, stay on character select screen and inform user
        console.error(`Images for head ${chosenHeadIndex + 1} (index ${chosenHeadIndex}) not fully loaded yet! Normal Ready: ${normalImgReady}, Hit Ready: ${hitImgReady}`);
        // Optional: Visual feedback (e.g., make selection box red briefly?)
        alert(`Head ${chosenHeadIndex + 1} images still loading... Please wait a moment and click again.`);
        // Ensure state remains characterSelect
        gameState = 'characterSelect';
        // Keep select music playing if it was
         if (!isMuted && musicSelect?.isLoaded() && !selectMusicStarted) {
             musicSelect.loop();
             selectMusicStarted = true;
             currentAttributionText = selectAttribution;
         }
    }
} // End selectHead()

// --- Ensure Audio Context is Running ---
// Call this on first user interaction (mousePressed/keyPressed)
function userStartAudio() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume().then(() => {
            console.log("AudioContext resumed successfully.");
        }).catch(e => {
            console.error("AudioContext resume failed:", e);
        });
    }
} // End userStartAudio()
