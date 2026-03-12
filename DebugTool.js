/* 
Author: ODarkN

Module Debug Tool
Instruction:
To enable this tool, you must temporarily expose the physics engine 
variables to the global window object. Add the following lines 
inside the 'resize' event listener in blobs.js:

window.allStars = allStars;
window.cachedUIRect = cachedUIRect;

Include this script in your index.html before the closing </body> tag:
<script src="DebugTool.js"></script>
*/

/* initializing the primary overlay element for the diagnostic HUD */
const debugOverlay = document.createElement('div');
/* assigning a unique identifier for potential external CSS overrides */
debugOverlay.id = 'physics-debug-overlay';
/* applying a high visibility technical aesthetic via inline styling */
debugOverlay.style.cssText = "position: fixed; top: 10px; right: 10px; background: rgba(0, 0, 0, 0.85); color: #00ffcc; font-family: 'Courier New', monospace; padding: 8px 15px; border-radius: 4px; z-index: 10000; pointer-events: none; border: 2px solid #00ffcc; font-size: 14px; display: flex; gap: 20px; box-shadow: 0 0 15px rgba(0, 255, 204, 0.4);";
/* injecting the diagnostic overlay into the root document body */
document.body.appendChild(debugOverlay);

/* primary execution loop for calculating and rendering real time physics data */
function updateDebugDisplay() {
  /* validating the presence of the global registry before proceeding with calculations */
  if (!window.allStars) {
    /* indicating a link delay while the core engine is being initialized */
    debugOverlay.innerHTML = "WAITING FOR ENGINE...";
    /* scheduling the next check to maintain the diagnostic lifecycle */
    requestAnimationFrame(updateDebugDisplay);
    return;
  }

/* determining the horizontal midpoint for spatial classification */
  const centerX = window.innerWidth / 2;
  let left = 0;
  let right = 0;

  /* aggregating counts for all active star instances across side zones */
  window.allStars.forEach(star => {
    /* ignoring stars currently in the respawn phase to maintain data accuracy */
    if (star.isRespawning) return;
    const x = parseFloat(star.style.left);
    /* verifying valid coordinates before performing side-zone increment */
    if (!isNaN(x)) {
      /* assigning the star to the corresponding bucket based on midpoint threshold */
      x < centerX ? left++ : right++;
    }
  });

  /* injecting the updated statistics into the diagnostic interface */
  debugOverlay.innerHTML = `<span>LEFT: ${left}</span> <span>|</span> <span>RIGHT: ${right}</span>`;
  /* looping the execution to match the display's refresh rate */
  requestAnimationFrame(updateDebugDisplay);
}

/* initiating the diagnostic HUD heartbeat */
updateDebugDisplay();