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

    /* using the fixed grid boundaries to identify which zone the star occupies */
    if (x < cachedUIRect.left) {
      /* star is visibly located within the left anchor zone */
      leftCount++;
    } else if (x > cachedUIRect.right) {
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
  let newX;

  /* enforcing spawn strictly within the boundaries of the calculated side-zone anchors */
  if (side === 'left') {
    /* calculating a random X position within the width of the left anchor */
    /* includes a safety offset to prevent the star from clipping the UI edge */
    newX = Math.random() * (leftAnchorRect.width - actualSize - 20);
  } else {
    /* calculating a random X position within the right anchor zone */
    /* starts at the right anchor's left boundary with a slight interior offset */
    const range = rightAnchorRect.width - actualSize - 20;
    newX = rightAnchorRect.left + 10 + Math.random() * Math.max(0, range);
  }

  /* assigning the new safe coordinates to the element's style properties */
  star.style.left = newX + 'px';
  /* randomizing vertical position within the full screen height minus a safety margin */
  star.style.top = Math.random() * (window.innerHeight - actualSize - 60) + 'px';

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

/* listening for mouse movement to update the global coordinates */
window.addEventListener('mousemove', (e) => {
  /* capturing the horizontal position of the cursor */
  mouseX = e.clientX;
  /* capturing the vertical position of the cursor */
  mouseY = e.clientY;
});

  /* primary generation loop for initializing each star object */
  blobs.forEach((b, index) => {
  /* adding random variance: size (+/- 15) and speed (+/- 0.2) */
  const randomSize = b.size + (Math.random() * 15 - 5);
  const randomSpeed = b.maxSpeed + (Math.random() * 0.15 - 0.07);

  /* calculating a dynamic star size unit based on the current master scale */
  const starSizeRem = 4.75; // equivalent to our old 76px but in rem units
  /* retrieving the base rem size in pixels to align JS logic with CSS scaling */
  const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
  /* scaling the array size value to current REM base */
  const currentStarSize = (randomSize / 37) * remInPx;

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
  let startX;

  /* enforcing initial spawn strictly within the grid-defined side anchors */
  if (initialSide === 'left') {
    /* calculating a safe horizontal start within the left anchor boundaries */
    /* using the cached width to ensure the star never overlaps the central UI */
    startX = Math.random() * (leftAnchorRect.width - currentStarSize - 20);
  } else {
    /* calculating a safe horizontal start within the right anchor boundaries */
    /* offset starts from the right grid column's left edge */
    const range = rightAnchorRect.width - currentStarSize - 20;
    startX = rightAnchorRect.left + 10 + Math.random() * Math.max(0, range);
  }

  /* assigning the calculated safe horizontal position to the star element */
  div.style.left = startX + 'px';
  /* randomizing the vertical starting point across the full viewport height */
  div.style.top = Math.random() * (window.innerHeight - currentStarSize - 60) + 'px';

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
    if (currentOpacity > 0.3) {
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

    /* overriding static boundaries with full-height percentage zones to fix zoom bugs */
    cachedUIRect = { left: window.innerWidth * 0.35, right: window.innerWidth * 0.65, top: 0, bottom: window.innerHeight };

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
      
      /* applying repulsion forces if objects are too close */
      if (distance < 100) {
        /* calculating the force intensity based on proximity */
        const repulsion = (100 - distance) / 100;
        /* updating velocities based on the repulsion vector */
        div.dx += (dx / distance) * repulsion * 0.5 * gameSpeed;
        div.dy += (dy / distance) * repulsion * 0.5 * gameSpeed;
      }
    });

    /* checking if the star has entered the strictly defined CSS Grid central zone */
    /* using the native cachedUIRect which naturally perfectly matches the new Grid layout */
    const isUnderUI = x + actualSize > cachedUIRect.left && 
                      x < cachedUIRect.right && 
                      y + actualSize > cachedUIRect.top && 
                      y < cachedUIRect.bottom;
    
    /* handling the occlusion and relocation logic for the interface zone */
    if (isUnderUI) {
      /* gradually reducing the object visibility as it enters the danger zone */
      div.occlusionFactor = Math.max(0, div.occlusionFactor - 0.05);
      
/* checking if the object is completely invisible to safely relocate it */
      if (div.occlusionFactor <= 0) {
        /* Portal Logic: Teleporting the pushed star to the opposite side */
        const isCurrentlyOnLeft = x + (actualSize / 2) < (cachedUIRect.left + cachedUIRect.right) / 2;
        const targetSide = isCurrentlyOnLeft ? 'right' : 'left';

        if (targetSide === 'right') {
          /* was on the left, teleporting to the right responsive zone */
          const rightStart = cachedUIRect.right + 40; 
          const rightRange = Math.max(0, window.innerWidth - rightStart - actualSize);
          x = rightStart + Math.random() * rightRange;
        } else {
          /* was on the right, teleporting to the left responsive zone */
          const leftBoundary = Math.max(0, cachedUIRect.left - actualSize - 40); 
          x = Math.random() * leftBoundary;
        }

        /* randomizing vertical position within the full screen height */
        y = Math.random() * (window.innerHeight - actualSize - 60);
    
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
          const isOtherOnRight = ox > cachedUIRect.right;
          const isOtherOnLeft = ox < cachedUIRect.left;

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
          /* pre-calculating the target coordinates for the silent transfer */
          if (targetSide === 'right') {
            const leftBoundary = Math.max(0, cachedUIRect.left - swapSize - 40); 
            swapCandidate.nextX = Math.random() * leftBoundary;
          } else {
            const rightStart = cachedUIRect.right + 40; 
            const rightRange = Math.max(0, window.innerWidth - rightStart - swapSize);
            swapCandidate.nextX = rightStart + Math.random() * rightRange;
          }
          swapCandidate.nextY = Math.random() * (window.innerHeight - swapSize - 60);
        }
      }
    } else {
      /* gradually restoring the object visibility when clear of the interface */
      div.occlusionFactor = Math.min(1, div.occlusionFactor + 0.02);
      
      /* applying steering forces to gently deflect stars approaching the central Grid zone */
      const nearUIX = x + actualSize > (cachedUIRect.left - 100) && x < (cachedUIRect.right + 100);
      const nearUIY = y + actualSize > (cachedUIRect.top - 100) && y < (cachedUIRect.bottom + 100);
      
      if (nearUIX && nearUIY) {
        /* calculating the vector away from the physical center of the interface */
        const dX = x - (cachedUIRect.left + cachedUIRect.right) / 2;
        const dY = y - (cachedUIRect.top + cachedUIRect.bottom) / 2;
        
        const d = Math.sqrt(dX * dX + dY * dY);
        
        /* updating velocities with the steering vector to push the star outward */
        if (d > 0) { 
          div.dx += (dX / d) * 0.02 * gameSpeed; 
          div.dy += (dY / d) * 0.02 * gameSpeed; 
        }
      }
    }

    /* calculating steering forces based on current mouse proximity */
    const distThreshold = 150;
    /* calculating the distance between the star and the cursor */
    const mDX = x - mouseX;
    const mDY = y - mouseY;
    const mDist = Math.sqrt(mDX * mDX + mDY * mDY);

    /* applying avoidance logic if the cursor is within the threshold */
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
    const currentMax = b.maxSpeed * 2.5 * speedFactor;
    /* clamping the horizontal velocity within limits */
    div.dx = Math.max(Math.min(div.dx, currentMax), -currentMax);
    /* clamping the vertical velocity within limits */
    div.dy = Math.max(Math.min(div.dy, currentMax), -currentMax);

    /* Defining the screen edge avoidance logic (Steering) */
    const edgeMargin = 150; // distance from edge where star starts to turn
    const steerIntensity = 0.15 * gameSpeed; // how hard the star steers back

    /* Steering away from the Left and Right edges */
    if (x < edgeMargin) {
      div.dx += (edgeMargin - x) / edgeMargin * steerIntensity;
    } else if (x > window.innerWidth - actualSize - edgeMargin) {
      const dist = window.innerWidth - actualSize - x;
      div.dx -= (edgeMargin - dist) / edgeMargin * steerIntensity;
    }

    /* Steering away from the Top and Bottom edges */
    if (y < edgeMargin) {
      div.dy += (edgeMargin - y) / edgeMargin * steerIntensity;
    } else if (y > window.innerHeight - actualSize - edgeMargin) {
      const dist = window.innerHeight - actualSize - y;
      div.dy -= (edgeMargin - dist) / edgeMargin * steerIntensity;
    }

    /* Safety boundary - synchronized with the dynamic resolution scale */
    x = Math.max(-50, Math.min(x, window.innerWidth - actualSize + 50));
    y = Math.max(-50, Math.min(y, window.innerHeight - actualSize + 50));

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
    /* forcing an accelerated exit if the star is currently scheduled for relocation */
    if (div.isSwapping && !isDark) clockStep *= 2;
    /* performing a silent background relocation if the sides become imbalanced while dark */
    const currentSide = x + (actualSize / 2) < (cachedUIRect.left + cachedUIRect.right) / 2 ? 'left' : 'right';
    const optimalSide = getRespawnSide(div);
    if (isDark && !div.isSwapping && !div.isRespawning && currentSide !== optimalSide) {

    /* executing a silent teleport to the underpopulated side while the star is invisible */
    if (optimalSide === 'left') { x = Math.random() * (cachedUIRect.left - actualSize - 40); }
    else { x = cachedUIRect.right + 40 + Math.random() * (window.innerWidth - cachedUIRect.right - actualSize - 40); }
    y = Math.random() * (window.innerHeight - actualSize - 60);
    div.style.left = x + "px"; div.style.top = y + "px"; }

    /* executing the silent teleport and resetting the phase once the star is fully obscured */
    if (div.isSwapping && isDark) { div.style.left = div.nextX + "px"; div.style.top = div.nextY + "px"; div.isSwapping = false; div.occlusionFactor = 1; div.internalClock = (Math.PI * 1.5); }
    /* rushing the exit if the side is overcrowded */
    if (visibleOnSide >= 3 && isFading) clockStep *= 7;
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