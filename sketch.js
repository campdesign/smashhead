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
