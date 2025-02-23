const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const outputDir = path.join(__dirname, 'icons');

// Create canvas and draw icon
function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Draw background circle
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#2196f3';
    ctx.fill();

    // Draw prompt symbol
    ctx.font = `${size * 0.4}px monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('>_', size/2, size/2);

    // Save as PNG
    const out = fs.createWriteStream(path.join(outputDir, `icon${size}.png`));
    const stream = canvas.createPNGStream();
    stream.pipe(out);
}

// Generate all icon sizes
sizes.forEach(createIcon);
