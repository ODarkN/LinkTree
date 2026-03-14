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