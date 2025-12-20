// Get container for blobs
const container = document.getElementById('blobcontainer');

// Define blobs: color, size, and max speed
const blobs = [
  { color: 'rgba(173,216,230,0.6)', size: 100, maxSpeed: 4 }, // Light blue
  { color: 'rgba(135,206,250,0.5)', size: 150, maxSpeed: 5 }, // Sky blue
  { color: 'rgba(72,61,139,0.55)', size: 140, maxSpeed: 4 }, // Dark bluepurple
  { color: 'rgba(229, 208, 90, 0.6)', size: 140, maxSpeed: 2 }, // Gold
  { color: 'rgba(238,232,170,0.5)', size: 190, maxSpeed: 3 }, // Light gold
  { color: 'rgba(116, 179, 150, 0.83)', size: 160, maxSpeed: 5 }, // Dark blue purple
  { color: 'rgba(235, 173, 219, 1)', size: 140, maxSpeed: 3 }, // baby pink
  { color: 'rgba(238,232,170,0.5)', size: 120, maxSpeed: 2 }, // Light gold
  { color: 'rgba(217, 84, 184, 1)', size: 190, maxSpeed: 4 } // pink

];

// Create and animate each blob
blobs.forEach((b) => {
  const div = document.createElement('div'); // Create div for blob
  div.classList.add('blob');

  // Set visual styles
  div.style.width = b.size + 'px'; // Blob width
  div.style.height = b.size + 'px'; // Blob height
  div.style.background = `radial-gradient(circle, ${b.color}, transparent 60%)`; // Gradient
  div.style.position = 'absolute'; // Absolute positioning
  div.style.borderRadius = '60%'; // Circular shape
  div.style.pointerEvents = 'none'; // Ignore clicks
  div.style.filter = 'blur(5px)'; // Soft blur
  div.style.opacity = 0.8; // Semi-transparent

  // Set random initial position
  div.style.left = Math.random() * window.innerWidth + 'px';
  div.style.top = Math.random() * window.innerHeight + 'px';

  // Set random direction and speed
  div.dx = (Math.random() - 0.5) * b.maxSpeed;
  div.dy = (Math.random() - 0.5) * b.maxSpeed;

  // Append blob to container
  container.appendChild(div);

  // Function to animate the blob
  function animate() {
    let x = parseFloat(div.style.left);
    let y = parseFloat(div.style.top);

    x += div.dx;
    y += div.dy;

    // Bounce off screen edges inside viewport
if (x < 0) { // Left edge
  x = 0;
  div.dx = Math.abs(div.dx); // Move right
}
if (x > window.innerWidth - b.size) { // Right edge
  x = window.innerWidth - b.size;
  div.dx = -Math.abs(div.dx); // Move left
}
if (y < 0) { // Top edge
  y = 0;
  div.dy = Math.abs(div.dy); // Move down
}
if (y > window.innerHeight - b.size) { // Bottom edge
  y = window.innerHeight - b.size;
  div.dy = -Math.abs(div.dy); // Move up
}

    // Add slight random jitter for organic movement
    div.dx += (Math.random() - 0.5) * 0.05;
    div.dy += (Math.random() - 0.5) * 0.05;

    // Limit maximum speed
    div.dx = Math.max(Math.min(div.dx, b.maxSpeed), -b.maxSpeed);
    div.dy = Math.max(Math.min(div.dy, b.maxSpeed), -b.maxSpeed);

    // Update position
    div.style.left = x + 'px';
    div.style.top = y + 'px';

    requestAnimationFrame(animate); // Next animation frame
  }

  animate(); // Start animation for this blob
});

// Store original window size
let originalWidth = window.innerWidth;
let originalHeight = window.innerHeight;

window.addEventListener('resize', () => {
  const scaleX = window.innerWidth / originalWidth;
  const scaleY = window.innerHeight / originalHeight;

  Array.from(container.children).forEach((div) => {
    let x = parseFloat(div.style.left);
    let y = parseFloat(div.style.top);

    // Scale position proportionally
    div.style.left = x * scaleX + 'px';
    div.style.top = y * scaleY + 'px';
  });

  // Update original size for future resizes
  originalWidth = window.innerWidth;
  originalHeight = window.innerHeight;
});