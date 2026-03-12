/*
Author: ODarkN

This javascript file handles the interface logic for the Hub (Linktree),
including tab navigation, dynamic username extraction, and guidance cues.
It operates as a controller that responds to events from the physics engine.
*/

/* executing the initial username extraction for all social links in the hub */
document.querySelectorAll('.slink').forEach(link => {
  /* retrieving the full destination url from the anchor element */
  const url = link.href;
  /* skipping internal game links to focus only on social profiles */
  if (url && !url.includes('game.html')) {
    /* removing trailing slash to prevent empty segment extraction */
    const sanitizedUrl = url.replace(/\/$/, '');
    /* extracting the final path segment which represents the user handle */
    let nick = sanitizedUrl.split('/').pop();
    /* inserting the formatted nickname into the designated span element */
    const nameSpan = link.querySelector('.sname');
    if (nameSpan) nameSpan.textContent = nick;
  }
});

/* global function to handle switching between Socials and Arcade tabs */
function showTab(tabId, btn) {
  /* hiding all elements with the tab-content class to reset the view */
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = 'none';
  });

  /* activating the specific content container requested by the user */
  const targetTab = document.getElementById(tabId + '-tab');
  if (targetTab) {
    targetTab.style.display = 'flex';
  }

  /* clearing the active styling from all navigation buttons */
  document.querySelectorAll('.tab-btn').forEach(tabBtn => {
    tabBtn.classList.remove('active');
  });

  /* applying the active state highlight to the button that was clicked */
  if (btn) {
    btn.classList.add('active');
  }
}

/* listening for the star capture signal to provide hub-specific guidance */
window.addEventListener('starCaptured', () => {
  /* only providing guidance if the interactive session is currently idle (Hub mode) */
  if (!isGameRunning) {
    /* deferring execution by 10ms to ensure the tab transition is processed first */
    setTimeout(() => {
      /* automatically switching to the arcade tab to show the game entry point */
      if (typeof showTab === 'function') {
        const arcadeTabBtn = document.querySelectorAll('.tab-btn')[1];
        if (arcadeTabBtn) showTab('arcade', arcadeTabBtn);
      }

      /* retrieving the arcade launcher element to trigger the guidance animation */
      const launcher = document.getElementById('arcade-launcher');
      if (launcher) {
        /* resetting and restarting the golden flash animation sequence */
        launcher.classList.remove('launcher-highlight');
        void launcher.offsetWidth; // forcing layout reflow to restart animation
        launcher.classList.add('launcher-highlight');
        /* automatic cleanup of the highlight class after the visual cycle */
        setTimeout(() => launcher.classList.remove('launcher-highlight'), 1500);
      }
    }, 10);
  }
});

/* global boundary variables for the physics engine (the Death Zone) */
/* these must be completely outside any function so other scripts can read them */
let uiLeft = 0;
let uiRight = 0;
let uiTop = 0;
let uiBottom = 0;

/* function to synchronize the JS physics collider with the CSS Grid visuals */
function updateUICache() {
  const mainUI = document.querySelector('.container');
  
  if (mainUI) {
    /* extracting the exact, real-time screen coordinates of the central column */
    const rect = mainUI.getBoundingClientRect();
    
    /* updating the Death Zone to perfectly match the 600px (or mobile) center zone */
    uiLeft = rect.left;
    uiRight = rect.right;
    uiTop = rect.top;
    uiBottom = rect.bottom;
  }
}

/* handling the global viewport resize event strictly for physics boundary updates */
window.addEventListener('resize', () => {
  /* executing the cache update every time the screen changes size */
  updateUICache();
});

/* triggering the initial calculation to establish boundaries immediately on load */
window.dispatchEvent(new Event('resize'));