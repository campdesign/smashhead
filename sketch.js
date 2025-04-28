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

  // Instructions Array
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

  // Draw Frame
  noFill();
  stroke(pacManCyan);
  strokeWeight(4);
  rect(frameX, frameY, frameWidth, frameHeight);
  noStroke();

  // Subtle Background
  fill(0, 0, 100, 80);
  rect(frameX + 5, frameY + 5, frameWidth - 10, frameHeight - 10);

  // Instructions Text
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

  // Hammer Image
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
  let centerX = width / 2;
  let selectY = frameY + frameHeight + 170; // Lower heads
  let spacing = 150; // tighter heads
  let headNames = ["Ol' Greenie", "Blurg", "Frank"];

  selectHue = (selectHue + 1.5) % 360;
  textAlign(CENTER, CENTER);
  textSize(26);
  push();
  colorMode(HSB, 360, 100, 100, 100);
  fill(selectHue, 90, 100);
  text("Pick your head to SMASH!", centerX, selectY - 80); // headline above
  pop();
  colorMode(RGB, 255, 255, 255, 255);

  // Draw Heads
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

    // Draw names
    fill(pacManYellow);
    textAlign(CENTER, TOP);
    text(headNames[i], imgXPos, selectY + currentHeadHeight * 0.5 + 20);
  }
}
