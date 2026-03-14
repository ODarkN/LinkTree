/*
Author: ODarkN
Module: PixelStarPhysics Engine

This standalone physics engine manages a pixelated star field background.
It calculates organic movement, repulsion forces, and occlusion mapping
independent of specific UI logic, communicating via global event signals.
*/

/* establishing the base multiplier for movement velocity */
let gameSpeed = 1.0;
/* tracking whether the interactive session is currently active */
let isGameRunning = false;

/* retrieving the primary container for star generation and rendering */
const container = document.getElementById('blobcontainer');

/* retrieving the layout zones for deterministic physics calculations */
const mainUI = document.querySelector('.container');
const leftAnchor = document.getElementById('left-anchor');
const rightAnchor = document.getElementById('right-anchor');

/* establishing global tracking for window dimensions to handle responsive scaling */
let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;
const initialWidth = 540;

/* creating a registry for all generated star elements to allow global coordinate manipulation */
const allStars = [];

/* 
Calculating the visual equilibrium across the viewport side-zones.
By scanning the current population within the left and right anchors,
the engine determines the optimal spawn location for new or captured stars.
accepting an optional initialization flag to bypass opacity checks during startup 
*/
function getRespawnSide(currentStar, isInit = false) {
  let leftCount = 0;
  let rightCount = 0;

  /* mapping current star positions from the global registry */
  allStars.forEach(star => {
    /* skipping the star currently in transition or marked for respawn */
    if (star === currentStar || star.isRespawning) return;

    /* extracting current opacity to ignore practically invisible stars */
    const opacity = parseFloat(star.style.opacity || 0);
    /* skipping stars that are currently faded out, unless the system is initializing */
    if (!isInit && opacity < 0.2) return;

    /* retrieving the coordinate value, ignoring stars that haven't entered the scene */
    const styleLeft = star.style.left;
    if (!styleLeft) return;

    const x = parseFloat(styleLeft);
    const y = parseFloat(star.style.top || 0); const isMobile = window.innerWidth <= 768; /* adding vertical awareness to the density counter for mobile layouts */

    /* routing the density check to the vertical axis on mobile to treat the top zone as the 'left' balance anchor */
    if (isMobile ? (y < cachedUIRect.top) : (x < cachedUIRect.left)) { 
      /* star is visibly located within the left anchor zone */
      leftCount++;
    } else if (isMobile ? (y > cachedUIRect.bottom) : (x > cachedUIRect.right)) { /* identifying stars in the bottom zone on mobile or right zone on desktop to complete the density map */
      /* star is visibly located within the right anchor zone */
      rightCount++;
    }
  });

  /* prioritizing the zone with lower visible population density */
  return leftCount <= rightCount ? 'left' : 'right';
}

/* 
Executing a precise relocation based on the current field density.
This function uses the layout anchors to place the star in a safe zone,
ensuring it never overlaps with the central interactive interface.
*/
function respawnStar(star, visualElement) {
  /* clearing the transition flag to allow the star to be counted in future balances */
  star.isRespawning = false;

  /* retrieving the side with the lowest star density from the balancing engine */
  const side = getRespawnSide(star);
  const actualSize = star.currentSize || star.baseSize;
  const isMobile = window.innerWidth <= 768; /* checking viewport width to toggle between horizontal and vertical physics balancing */
  let newX, newY; /* preparing coordinate variables for the orientation-aware relocation logic */
  if (isMobile) { /* diverting to a vertical respawn logic to protect the central UI belt on mobile devices */
  newX = Math.random() * (window.innerWidth - actualSize); /* ensuring stars are distributed across the full viewport width in vertical mobile layouts */

  /* enforcing spawn strictly within the boundaries of the calculated side-zone anchors */
  if (side === 'left') {
    newY = Math.random() * (leftAnchorRect.height - actualSize - 20); /* ensuring the vertical coordinate stays within the upper physical boundary */
    } else { /* shifting the spawn focus to the bottom physical zone for vertical density relief */
      newY = rightAnchorRect.top + 10 + Math.random() * (rightAnchorRect.height - actualSize - 20); /* anchoring the star within the bottom physical zone below the central interface */
      
    /* using the globally defined newX for mobile to ensure stars utilize the full viewport width regardless of the vertical zone */
    }
  } else {
    newY = Math.random() * (window.innerHeight - actualSize - 60); /* initializing the vertical coordinate for standard widescreen layout */
    if (side === 'left') {
      newX = Math.random() * (leftAnchorRect.width - actualSize - 20); /* calculating horizontal start within the left desktop anchor */
    } else {
    /* calculating a random X position within the right anchor zone */
    /* starts at the right anchor's left boundary with a slight interior offset */
    const range = rightAnchorRect.width - actualSize - 20;
    newX = rightAnchorRect.left + 10 + Math.random() * Math.max(0, range);
  }

  } /* closing the desktop coordinate logic block to return to the global style application */
  /* assigning the new safe coordinates to the element's style properties */
  star.style.left = newX + 'px';

  /* applying the orientation aware vertical coordinate to ensure the star respects mobile top/bottom safe zones */
  star.style.top = newY + 'px'; 

  /* restoring original visual state and scaling for consistent interactive feedback */
  star.style.filter = 'none';
  if (visualElement) visualElement.style.transform = 'scale(1)';
}

/* establishing a global interface cache for layout dimension optimization */
let cachedUIRect = mainUI ? mainUI.getBoundingClientRect() : { left: 0, right: 0, top: 0, bottom: 0 };
/* defining anchor rectangles for side-zone physics boundaries */
let leftAnchorRect, rightAnchorRect;

/* logic to refresh interface boundaries and side-zone anchors for precise balancing */
function updateUICache(isResize = false) {
  if (mainUI && leftAnchor && rightAnchor) {
    const update = () => {
      /* caching boundaries for the central death zone and side spawn zones */
      cachedUIRect = mainUI.getBoundingClientRect();
      leftAnchorRect = leftAnchor.getBoundingClientRect();
      rightAnchorRect = rightAnchor.getBoundingClientRect();
    };

    if (isResize) update();
    else setTimeout(update, 150);
  }
}

/* executing an immediate synchronous update to ensure anchors are ready for the init loop */
updateUICache(true);

/* handling the global viewport resize event strictly for visual scaling and boundary updates */
window.addEventListener('resize', () => {
  /* instantly pulling the new CSS Grid boundaries for the collision engine */
  updateUICache(true);

  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;

  /* calculating the relative position ratios to prevent stars from scattering */
  const ratioX = currentWidth / lastWidth;
  const ratioY = currentHeight / lastHeight;

  /* calculating a global scale factor to proportionally resize the star elements */
  const globalScale = currentWidth / initialWidth;

  /* updating the visual size, position, and bounding box of every active star */
  allStars.forEach(star => {
    const x = parseFloat(star.style.left);
    const y = parseFloat(star.style.top);

    /* shifting coordinates so stars stick to their relative screen positions */
    star.style.left = (x * ratioX) + 'px';
    star.style.top = (y * ratioY) + 'px';

    /* applying the global scale to the star's transform to resize it natively */
    star.style.transform = `scale(${globalScale})`;
    
    /* updating the currentSize property used by the physics engine for precise boundary checks */
    star.currentSize = star.baseSize * globalScale;
  });
  
  /* updating the global tracking variables for the next resize event */
  lastWidth = currentWidth;
  lastHeight = currentHeight;
});

/* disabling pointer events on the container to allow access to objects */
if (container) {
  /* setting the style property to ignore mouse interactions on the wrapper */
  container.style.pointerEvents = 'none';
}

/* defining the aesthetic and physical properties for each individual star */
const blobs = [
  /* light blue star with standard size and moderate speed */
  { color: 'rgba(151, 217, 239, 0.75)', size: 40, maxSpeed: 0.6 },
  /* sky blue star with larger size and slower movement */
  { color: 'rgba(135, 206, 250, 0.73)', size: 60, maxSpeed: 0.5 },
  /* purple star with medium size and high velocity */
  { color: 'rgba(150, 137, 236, 0.76)', size: 40, maxSpeed: 0.8 },
  /* yellow star with medium size and balanced speed */
  { color: 'rgba(228, 209, 101, 0.74)', size: 40, maxSpeed: 0.5 },
  /* pale yellow star with large size and very slow movement */
  { color: 'rgba(238, 232, 170, 0.73)', size: 50, maxSpeed: 0.5 },
  /* green star with medium size and low speed */
  { color: 'rgba(116, 179, 150, 0.78)', size: 40, maxSpeed: 0.6 },
  /* pink star with medium size and standard speed */
  { color: 'rgba(247, 197, 234, 0.64)', size: 40, maxSpeed: 0.7 },
  /* secondary yellow star with standard size and high speed */
  { color: 'rgba(68, 223, 140, 0.61)', size: 30, maxSpeed: 0.5 },
  /* magenta star with large size and maximum velocity */
  { color: 'rgba(211, 143, 194, 0.74)', size: 50, maxSpeed: 0.9 }
];

/* setting the initial horizontal mouse coordinate outside the screen */
let mouseX = -1000;
/* setting the initial vertical mouse coordinate outside the screen */
let mouseY = -1000;

/* tracking continuous mouse movement for the desktop hover repulsion effect */
window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
/* initiating mobile repulsion by capturing the initial touch coordinate point */
window.addEventListener('touchstart', (e) => { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; }, { passive: true });
/* updating the repulsion focus in real-time as the user slides their finger across the screen */
window.addEventListener('touchmove', (e) => { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; }, { passive: true });
/* disabling the repulsion force field by resetting coordinates when the finger is lifted */
window.addEventListener('touchend', () => { mouseX = -1000; mouseY = -1000; });

  /* primary generation loop for initializing each star object */
  blobs.forEach((b, index) => {
  /* adding random variance: size (+/- 15) and speed (+/- 0.2) */
  /* detecting mobile layout during initialization to adjust starting parameters */
  const isMobileInit = window.innerWidth <= 768;
  /* applying a narrower size variance for mobile to prevent stars from generating too small */
  const sizeVariance = isMobileInit ? (Math.random() * 10) : (Math.random() * 15 - 5);
  const randomSize = b.size + sizeVariance;
  /* drastically reducing initial velocity for mobile displays to ensure a calm background in confined spaces */
  const randomSpeed = (b.maxSpeed + (Math.random() * 0.15 - 0.07)) * (isMobileInit ? 0.25 : 1.0);

  /* calculating a dynamic star size unit based on the current master scale */
  const starSizeRem = 4.75; // equivalent to our old 76px but in rem units
  /* retrieving the base rem size in pixels to align JS logic with CSS scaling */
  const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
  /* scaling the array size value to current REM base and enlarging stars by 50% on mobile */
  const currentStarSize = (randomSize / 37) * remInPx * (isMobileInit ? 1.8 : 1.0);

  /* calculating the width of a single star pixel so the 5x5 grid fits the container exactly */
  const p = currentStarSize / 5;
  /* defining the shadow unit in rem now to prevent ReferenceError in subsequent visual styling */
  const shadowUnit = p / remInPx;
  /* Calculating glow intensity... Tie the glow spread to the star's base size */
  const glowSpread = shadowUnit * (3 + (b.size / 60));
  /* creating the inner glow color using a mix with white */
  let innerColor = `color-mix(in srgb, ${b.color}, white 60%)`;
  /* assigning the primary color to the outer glow variable */
  let outerColor = b.color;

  /* creating the main element for the star object */
  const div = document.createElement('div');

  /* storing the original calculated pixel size for responsive scaling logic */
  div.baseSize = currentStarSize;
  /* ensuring currentSize is set before the first animation frame */
  div.currentSize = currentStarSize;

  /* assigning the base class for styling and identification */
  div.classList.add('blob');
  /* tracking the current visibility for the occlusion system */
  div.occlusionFactor = 1;
  /* using dynamic calculated pixels to maintain the 4.75rem size across resolutions */
  div.style.cssText = `width:${currentStarSize}px;height:${currentStarSize}px;display:flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto;position:absolute;z-index:5;opacity:0.9;`;

  /* creating the visual core element for the star */
  const visual = document.createElement('div');
  /* tying the central core dimensions to the global rem scale for unit consistency */
  visual.style.cssText = `width:${shadowUnit}rem;height:${shadowUnit}rem;background-color:#ffffff;transition:transform 0.2s ease-out, filter 0.2s ease-out;`;

  /* applying an overdraw spread to eliminate sub-pixel gaps during scaling */
  const overdraw = 0.07; 

  /* applying the layered box-shadow to create the pixelated glow effect */
  visual.style.boxShadow = `
    0 0 0 ${overdraw}rem #ffffff,
    0 -${shadowUnit}rem 0 ${overdraw}rem ${innerColor},
    0 ${shadowUnit}rem 0 ${overdraw}rem ${innerColor},
    -${shadowUnit}rem 0 0 ${overdraw}rem ${innerColor},
    ${shadowUnit}rem 0 0 ${overdraw}rem ${innerColor},
    0 -${shadowUnit * 2}rem 0 ${overdraw}rem ${outerColor},
    0 ${shadowUnit * 2}rem 0 ${overdraw}rem ${outerColor},
    -${shadowUnit * 2}rem 0 0 ${overdraw}rem ${outerColor},
    ${shadowUnit * 2}rem 0 0 ${overdraw}rem ${outerColor},
    -${shadowUnit}rem -${shadowUnit}rem 0 ${overdraw}rem ${outerColor},
    ${shadowUnit}rem -${shadowUnit}rem 0 ${overdraw}rem ${outerColor},
    -${shadowUnit}rem ${shadowUnit}rem 0 ${overdraw}rem ${outerColor},
    ${shadowUnit}rem ${shadowUnit}rem 0 ${overdraw}rem ${outerColor},
    0 0 ${shadowUnit * 12}rem ${glowSpread}rem ${outerColor}
  `;

  /* attaching the visual core to the main star element */
  div.appendChild(visual);
  /* adding the completed star object to the background container */
  container.appendChild(div);

/* determining the optimal starting side using the balancing engine in init mode */
  const initialSide = getRespawnSide(div, true);
  let startX, startY;

  if (isMobileInit) {
    /* calculating vertical-first spawn for mobile to avoid the central death zone belt */
    startX = Math.random() * (window.innerWidth - currentStarSize);
    if (initialSide === 'left') {
      /* anchoring to the top zone with a safety margin from the edge */
      startY = 20 + Math.random() * (leftAnchorRect.height - currentStarSize - 40);
    } else {
      /* anchoring to the bottom zone with a safety margin from the edge */
      startY = rightAnchorRect.top + 20 + Math.random() * (rightAnchorRect.height - currentStarSize - 40);
    }
  } else {
    /* maintaining horizontal-first spawn for desktop layouts with a vertical belt UI */
    if (initialSide === 'left') {
      startX = Math.random() * (leftAnchorRect.width - currentStarSize - 20);
    } else {
      const range = rightAnchorRect.width - currentStarSize - 20;
      startX = rightAnchorRect.left + 10 + Math.random() * Math.max(0, range);
    }
    /* full height randomization for desktop since the UI is a vertical column */
    startY = Math.random() * (window.innerHeight - currentStarSize - 60);
  }

  /* applying the pre-calculated safe coordinates to eliminate the startup flash in the UI zone */
  div.style.left = startX + 'px';
  div.style.top = startY + 'px';

  /* calculating the initial horizontal velocity with random direction */
  div.dx = (Math.random() - 0.5) * randomSpeed;
  /* calculating the initial vertical velocity with random direction */
  div.dy = (Math.random() - 0.5) * randomSpeed;
  /* assigning an independent internal clock for the director system to manipulate */
  div.internalClock = (index / blobs.length) * (Math.PI * 2);
  /* setting a much slower base frequency for the organic blinking effect */
  /* tracking whether the star is currently scheduled for a balance-related relocation */
  div.isSwapping = false;
  div.blinkSpeed = 0.00003;

  /* handling the mouse down event for interaction logic */
  div.addEventListener('mousedown', (e) => {
    /* preventing default browser behavior for the event */
    e.preventDefault(); 
    /* stopping the event from reaching parent elements */
    e.stopPropagation(); 

    /* capturing the current opacity level for interaction validity */
    const currentOpacity = parseFloat(div.style.opacity);
    
    /* verifying if the star is visible and the physics system allows interaction */
    if (currentOpacity > 0.05) {
      /* broadcasting a global signal that a star capture has occurred */
      /* the engine doesn't care if hub.js or game.js is listening */
      window.dispatchEvent(new CustomEvent('starCaptured'));

      /* branching the visual response based on the active session state */
      if (isGameRunning) {
        /* applying the hit visual state for game mode (teleportation) */
        div.style.filter = 'brightness(2) blur(2px)';
        visual.style.transform = 'scale(0)';

        /* Flagging the star as 'in-transition' so the balancer ignores its old position */
        div.isRespawning = true;

        /* handling the respawn logic using the balancing engine */
        setTimeout(() => {
          /* ZAMIAST Math.random, wywołujemy naszą nową funkcję balansu */
          respawnStar(div, visual);
        }, 3000);
      } else {
        /* providing a simple bloom feedback for hub interactions */
        visual.classList.add('bloom-effect');
        /* automatic cleanup of the bloom effect class */
        setTimeout(() => visual.classList.remove('bloom-effect'), 300);
      }
    }
  });

  /* registering the new star instance into the global tracking array */
  allStars.push(div);

  /* defining the continuous animation function for the object */
  function animate() {
    /* calculating dynamic zoom scale to normalize movement speed across different browser scales */
    const zoomScale = window.innerWidth / window.outerWidth;
    /* identifying device type within the frame-by-frame animation loop for adaptive collision math */
    const isMobile = window.innerWidth <= 768; 

    /* defining a static layout fallback for the desktop vertical occlusion belt */
    const desktopShield = { left: window.innerWidth * 0.35, right: window.innerWidth * 0.65, top: 0, bottom: window.innerHeight };
    /* selecting the active collision bounds: the live cached UI for mobile or the fixed belt for desktop */
    const activeRect = isMobile ? cachedUIRect : desktopShield; 
    /* capturing the current horizontal coordinate of the star */
    let x = parseFloat(div.style.left);
    /* capturing the current vertical coordinate of the star */
    let y = parseFloat(div.style.top);

    /* using the currentSize updated by the resize listener for accurate physics boundaries */
    const actualSize = div.currentSize || div.baseSize;

    /* adding random fluctuations to the horizontal velocity */
    div.dx += (Math.random() - 0.5) * 0.05 * gameSpeed;
    div.dy += (Math.random() - 0.5) * 0.05 * gameSpeed;

    /* processing the repulsion logic between neighboring objects */
    Array.from(container.children).forEach(other => {
      /* skipping the current object during the check */
      if (other === div) return;
      /* capturing the position of the other object */
      const ox = parseFloat(other.style.left);
      const oy = parseFloat(other.style.top);
      /* calculating the relative distance between objects */
      const dx = x - ox;
      const dy = y - oy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      /* defining a much tighter interaction radius for mobile to increase the free-roaming area */
      const repulsionThreshold = isMobile ? 50 : 100;
      /* executing repulsion physics only when stars breach the minimized proximity threshold */
      if (distance < repulsionThreshold) {
        /* normalizing the repulsion magnitude relative to the new, smaller interaction radius */
        const repulsion = (repulsionThreshold - distance) / repulsionThreshold;
        /* applying a subtle multiplier for mobile to allow natural clustering without erratic jumps */
        const repulsionMultiplier = isMobile ? 0.15 : 0.5;
        /* updating velocities based on the repulsion vector */
        div.dx += (dx / distance) * repulsion * repulsionMultiplier * gameSpeed;
        div.dy += (dy / distance) * repulsion * repulsionMultiplier * gameSpeed;
      }
    });

    /* applying an internal offset on mobile to shrink the invisible occlusion zone */
    const innerPad = isMobile ? 15 : 0;
    /* verifying star occlusion against the active layout rectangle (cached UI for mobile or fixed column for desktop) */
    const isUnderUI = x + actualSize > (activeRect.left + innerPad) && x < (activeRect.right - innerPad) && y + actualSize > (activeRect.top + innerPad) && y < (activeRect.bottom - innerPad);
    
    /* handling the occlusion and relocation logic for the interface zone */
    if (isUnderUI) {
      /* gradually reducing the object visibility as it enters the danger zone */
      div.occlusionFactor = Math.max(0, div.occlusionFactor - 0.05);
      
      /* checking if the object is completely invisible to safely relocate it */
      if (div.occlusionFactor <= 0) {

        /* calculating the focal point for the portal transition based on active layout bounds */
        const isTopOrLeft = isMobile ? y + (actualSize/2) < (activeRect.top + activeRect.bottom)/2 : x + (actualSize/2) < (activeRect.left + activeRect.right)/2;
        let targetSide = isTopOrLeft ? 'right' : 'left';
        
        /* scanning target side population */
        let visibleOnTarget = 0;
        
        /* scanning target side population density, accounting for both visible stars and those currently in transition */
        allStars.forEach(s => { 
          /* retrieving the primary coordinate based on current viewport orientation */
          const p = parseFloat(isMobile ? s.style.top : s.style.left) || 0; 
          /* checking if the star is currently perceptible to the user */
          const isVisible = parseFloat(s.style.opacity||0) >= 0.2; 
          /* tracking stars that are physically present but visually hidden during relocation */
          const isInTransition = s.isRespawning || s.isSwapping; 
          /* counting valid population members to determine if the target zone has reached its capacity */
          if (isVisible || isInTransition) { 
            /* checking population density within the active boundaries to prevent zone overcrowding */
            if (targetSide === 'left' && p < (isMobile ? activeRect.top : activeRect.left)) visibleOnTarget++; 
            if (targetSide === 'right' && p > (isMobile ? activeRect.bottom : activeRect.right)) visibleOnTarget++;
          } 
        });

        /* eliminating the star if destination is full */
        if (visibleOnTarget >= (isMobile ? 2 : 3)) { div.occlusionFactor = 1; div.internalClock = Math.PI * 1.5; respawnStar(div, visual); } else {
        /* Portal Logic, Teleporting the pushed star to the opposite safe zone */

        if (isMobile) { /* branching active portal relocation for vertical mobile layouts */
          
          if (targetSide === 'right') { y = rightAnchorRect.top + 10 + Math.random() * (rightAnchorRect.height - actualSize - 20); }
          else { y = Math.random() * (leftAnchorRect.height - actualSize - 20); }
          x = Math.random() * (window.innerWidth - actualSize); /* utilizing full width */
        } else { /* maintaining horizontal portal logic for desktop displays */
          
          /* branching the relocation logic for stars targeted at the right-side safe zone */
          if (targetSide === 'right') {
            /* establishing the spawn entry point just beyond the active right boundary */
            const rightStart = activeRect.right + 40;
            /* defining the available horizontal span for random distribution within the right zone */
            const rightRange = Math.max(0, window.innerWidth - rightStart - actualSize);
            /* assigning a random horizontal position within the calculated right-side spawn range */
            x = rightStart + Math.random() * rightRange;
          /* handling coordinate calculations for stars relocating to the left-side safe zone */
          } else {
            /* establishing the spawn entry point just before the active left boundary */
            const leftBoundary = Math.max(0, activeRect.left - actualSize - 40); 
            /* randomizing the horizontal coordinate within the available left-side area */
            x = Math.random() * leftBoundary;
          }
          /* randomizing the vertical coordinate across the full height of the desktop viewport */
          y = Math.random() * (window.innerHeight - actualSize - 60);
        }
    
        /* applying new safe coordinates for the pushed star */
        div.style.left = x + "px";
        div.style.top = y + "px";

        /* initiating the hostage exchange mechanic to maintain visual symmetry */
        let swapCandidate = null;
        let lowestOpacity = 1;

        /* scanning the global registry to find the least visible star on the target side */
        allStars.forEach(otherStar => {
          /* skipping the current star and any stars already in transition */
          if (otherStar === div || otherStar.isRespawning) return;
          
          const ox = parseFloat(otherStar.style.left || 0);
          const oy = parseFloat(otherStar.style.top || 0);
          /* checking dynamic axis based on current device layout */
          const isOtherOnRight = isMobile ? (oy > cachedUIRect.bottom) : (ox > cachedUIRect.right);
          const isOtherOnLeft = isMobile ? (oy < cachedUIRect.top) : (ox < cachedUIRect.left);

          /* filtering candidates to only include stars residing in the target zone */
          if ((targetSide === 'right' && isOtherOnRight) || (targetSide === 'left' && isOtherOnLeft)) {
            const currentOpacity = parseFloat(otherStar.style.opacity || 1);
            /* identifying the star currently at the lowest point of its blink cycle */
            if (currentOpacity < lowestOpacity) {
              lowestOpacity = currentOpacity;
              swapCandidate = otherStar;
            }
          }
        });

        /* marking the candidate for a graceful fade-out and storing its destination */
        if (swapCandidate) {
          swapCandidate.isSwapping = true;
          const swapSize = swapCandidate.currentSize || swapCandidate.baseSize;
          if (isMobile) { /* branching swap destination to vertical zones for mobile */
            if (targetSide === 'right') { swapCandidate.nextY = rightAnchorRect.top + 10 + Math.random() * (rightAnchorRect.height - swapSize - 20); } /* anchoring to the bottom zone */
            else { swapCandidate.nextY = Math.random() * (leftAnchorRect.height - swapSize - 20); } /* anchoring to the top zone */
            swapCandidate.nextX = Math.random() * (window.innerWidth - swapSize); /* full width distribution */
          } else { /* standard left-right swap logic for widescreen layouts */
            if (targetSide === 'right') { swapCandidate.nextX = Math.random() * Math.max(0, cachedUIRect.left - swapSize - 40); } /* anchoring to the left zone */
            else { swapCandidate.nextX = cachedUIRect.right + 40 + Math.random() * (window.innerWidth - cachedUIRect.right - swapSize - 40); } /* anchoring to the right zone */
            swapCandidate.nextY = Math.random() * (window.innerHeight - swapSize - 60); /* standard vertical randomization */
          }
        }
      } 
    }
    } else {
      /* gradually restoring the object visibility when clear of the interface */
      div.occlusionFactor = Math.min(1, div.occlusionFactor + 0.02);
      
      /* applying a binary hard bounce logic for mobile to avoid vector equilibrium traps */
      const shieldBuffer = isMobile ? 3 : 100;
      /* calculating horizontal intersection with the tightened exclusion zone */
      const nearUIX = x + actualSize > (cachedUIRect.left - shieldBuffer) && x < (cachedUIRect.right + shieldBuffer);
      /* calculating vertical intersection with the tightened exclusion zone */
      const nearUIY = y + actualSize > (cachedUIRect.top - shieldBuffer) && y < (cachedUIRect.bottom + shieldBuffer);
      
      if (nearUIX && nearUIY) {
        /* calculating the horizontal vector relative to the active interface center */
        const dX = x - (activeRect.left + activeRect.right) / 2;
        /* calculating the vertical vector relative to the active interface center */
        const dY = y - (activeRect.top + activeRect.bottom) / 2;
        /* determining the absolute Euclidean distance to the central point */
        const d = Math.sqrt(dX * dX + dY * dY);
        
        if (d > 0) { 
        /* restoring a low-intensity linear repulsion for mobile to eliminate jitter */
        const deflectionForce = isMobile ? 0.05 : 0.02;
        /* applying a consistent horizontal steering vector away from the interface center */
        div.dx += (dX / d) * deflectionForce * gameSpeed; 
        /* applying a consistent vertical steering vector away from the interface center */
        div.dy += (dY / d) * deflectionForce * gameSpeed;
        }
      }
    }

    /* adjusting the interaction radius specifically for mobile touch precision */
    const distThreshold = isMobile ? 120 : 150;
    /* calculating the vector between the star and the current input coordinate */
    const mDX = x - mouseX;
    const mDY = y - mouseY;
    const mDist = Math.sqrt(mDX * mDX + mDY * mDY);
    /* executing continuous repulsion logic as long as the touch or mouse is within range */
    if (mDist < distThreshold && mDist > 0) {
      /* calculating the intensity of the avoidance force */
      const force = (distThreshold - mDist) / distThreshold;
      
      /* Direct position shift (the current "push") */
      x += (mDX / mDist) * force * 0.5 * gameSpeed;
      y += (mDY / mDist) * force * 0.5 * gameSpeed;

      /* Velocity impulse... We override the star's internal momentum */
      /* This ensures the star actually starts flying away, even after you move the mouse */
      div.dx += (mDX / mDist) * force * 0.3 * gameSpeed;
      div.dy += (mDY / mDist) * force * 0.3 * gameSpeed;
    }

    /* integrating current velocities into the final coordinates with zoom normalization */
    x += div.dx * gameSpeed * zoomScale;
    /* integrating vertical velocity into the position with zoom normalization */
    y += div.dy * gameSpeed * zoomScale;

    /* scaling the maximum velocity based on the current master font size to maintain consistent speed across resolutions */
    const speedFactor = remInPx / 16;
    /* clamping the maximum allowed velocity, reducing it significantly for mobile layouts */
    const currentMax = b.maxSpeed * 2.5 * speedFactor * (isMobile ? 0.3 : 1.0);
    /* clamping the horizontal velocity within limits */
    div.dx = Math.max(Math.min(div.dx, currentMax), -currentMax);
    /* clamping the vertical velocity within limits */
    div.dy = Math.max(Math.min(div.dy, currentMax), -currentMax);

    /* implementing binary hard-wall steering for mobile while maintaining desktop legacy feel */
    const edgeMargin = isMobile ? 16 : 150; 
    /* returning a universal linear steering factor based on the current penetration depth */
    const getSteerPower = (dist) => {
      /* calculating a normalized 0.0 to 1.0 ratio to provide smooth, organic deceleration */
      return Math.max(0, (edgeMargin - dist) / edgeMargin);
    };

    /* applying an organic linear bounce for the left viewport boundary */
    if (x < edgeMargin) {
      div.dx += getSteerPower(x) * (isMobile ? 0.35 : 0.15) * gameSpeed;
    } else if (x > window.innerWidth - actualSize - edgeMargin) {
      /* calculating the distance for the right-side steer to ensure symmetrical repulsion */
      const dist = window.innerWidth - actualSize - x;
      div.dx -= getSteerPower(dist) * (isMobile ? 0.35 : 0.15) * gameSpeed;
    }

    /* initiating organic vertical steering for the top viewport boundary */
    if (y < edgeMargin) {
      /* applying a linear bounce impulse to provide smooth deceleration at the top edge */
      div.dy += getSteerPower(y) * (isMobile ? 0.35 : 0.15) * gameSpeed;
    } else if (y > window.innerHeight - actualSize - edgeMargin) {
      /* calculating vertical distance to the bottom limit for symmetrical steering */
      const dist = window.innerHeight - actualSize - y;
      /* applying a negative linear impulse to counteract downward velocity at the bottom edge */
      div.dy -= getSteerPower(dist) * (isMobile ? 0.35 : 0.15) * gameSpeed;
    }

    /* applying a global safety buffer to allow stars a slight overshoot beyond viewport edges */
    const offLimit = 50;
    x = Math.max(-offLimit, Math.min(x, window.innerWidth - actualSize + offLimit));
    y = Math.max(-offLimit, Math.min(y, window.innerHeight - actualSize + offLimit));

    /* applying the updated horizontal coordinate to the element */
    div.style.left = x + 'px';
    /* applying the updated vertical coordinate to the element */
    div.style.top = y + 'px';

    /* scanning the current side to calculate the visible population for the director */
    let visibleOnSide = 0;
    const isLeftHalf = x + (actualSize / 2) < (window.innerWidth / 2);
    allStars.forEach(s => {
      const sX = parseFloat(s.style.left || 0);
      if ((sX < window.innerWidth / 2) === isLeftHalf && parseFloat(s.style.opacity || 0) >= 0.2) visibleOnSide++;
    });

    /* determining the current phase of the star to apply intelligent director logic */
    const currentSin = Math.sin(div.internalClock);
    const isFading = currentSin > 0 && Math.cos(div.internalClock) < 0;
    const isDark = currentSin <= 0;
    let clockStep = div.blinkSpeed * 16.6;
    
    /* shortening the visible phase duration exclusively on mobile devices */
    if (isMobile && !isDark) clockStep *= 1.8;

    /* forcing an accelerated exit if the star is currently scheduled for relocation */
    if (div.isSwapping && !isDark) clockStep *= 2;

    /* determining the current side relative to the active interface bounds */
    const currentSide = x + (actualSize / 2) < (activeRect.left + activeRect.right) / 2 ? 'left' : 'right';
    const optimalSide = getRespawnSide(div);
    if (isDark && !div.isSwapping && !div.isRespawning && currentSide !== optimalSide) {
      if (isMobile) { /* branching silent relocation to vertical zones for mobile devices */
        /* anchoring to the top zone based on the active interface boundary */
        if (optimalSide === 'left') { y = Math.random() * (activeRect.top - actualSize - 20); }
        /* anchoring to the bottom zone below the active interface boundary */
        else { y = activeRect.bottom + 10 + Math.random() * (window.innerHeight - activeRect.bottom - actualSize - 20); }
        x = Math.random() * (window.innerWidth - actualSize); /* spreading across full width on mobile */
      } else { /* maintaining horizontal relocation for desktop displays */
        /* anchoring to the left zone relative to the active interface belt */
        if (optimalSide === 'left') { x = Math.random() * (activeRect.left - actualSize - 40); }
        /* anchoring to the right zone beyond the active interface belt */
        else { x = activeRect.right + 40 + Math.random() * (window.innerWidth - activeRect.right - actualSize - 40); }
        y = Math.random() * (window.innerHeight - actualSize - 60); /* standard vertical randomization */
      }
      div.style.left = x + "px"; div.style.top = y + "px"; /* applying final coordinates to the element */
    }

    /* executing the silent teleport and resetting the phase once the star is fully obscured */
    if (div.isSwapping && isDark) { div.style.left = div.nextX + "px"; div.style.top = div.nextY + "px"; div.isSwapping = false; div.occlusionFactor = 1; div.internalClock = (Math.PI * 1.5); }
    
    /* dynamically adjusting the overcrowding threshold to reduce concurrent visible stars on mobile */
    const maxVisible = isMobile ? 2 : 3;
    
    /* rushing the exit if the side is overcrowded */
    if (visibleOnSide >= maxVisible && isFading) clockStep *= 7;
    /* holding the star on stage if the population is critically low */
    if (visibleOnSide <= 1 && isFading) clockStep = 0;
    /* rushing the entrance of new stars if reinforcements are needed */
    if (visibleOnSide <= 1 && isDark) clockStep *= 7;

    /* advancing the independent clock and calculating opacity via sine wave */
    div.internalClock += clockStep;
    div.style.opacity = Math.max(0, Math.sin(div.internalClock)) * 0.9 * div.occlusionFactor;

    /* scheduling the next animation frame for the physics loop */
    requestAnimationFrame(animate);
  }

  /* initiating the animation cycle for the individual star */
  animate();
});

/* triggering the initial calculation to establish boundaries immediately on load */
window.dispatchEvent(new Event('resize'));