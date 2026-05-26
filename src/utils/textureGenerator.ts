import { StoneMaterial } from '../types';

/**
 * Generates a seamless-looking procedural texture on an HTML Canvas
 * based on the material's color, category, and texture type.
 */
export function generateStoneTexture(material: StoneMaterial): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return canvas;

  const baseColor = material.color;
  const secColor = material.secondaryColor || '#888888';

  // Draw base
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  if (material.textureType === 'granite') {
    // Generate granite speckles
    const seedValue = material.id.charCodeAt(0) + material.id.charCodeAt(1);
    const rng = createRNG(seedValue);
    
    // Low intensity background variations
    for (let i = 0; i < 40; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const r = rng() * 60 + 20;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, hexToRgba(secColor, 0.15));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // High density fine granite dark and light specks
    const speckColors = [
      '#000000',
      '#333333',
      secColor,
      '#ffffff',
      '#555555'
    ];

    for (let i = 0; i < 4000; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const size = rng() * 2.5 + 0.5;
      const colIdx = Math.floor(rng() * speckColors.length);
      const alpha = rng() * 0.4 + 0.3;
      
      ctx.fillStyle = hexToRgba(speckColors[colIdx], alpha);
      ctx.fillRect(x, y, size, size);
    }
    
  } else if (material.textureType === 'marble') {
    // Generate marble veins
    const seedValue = material.id.charCodeAt(0) + material.id.charCodeAt(1);
    const rng = createRNG(seedValue);

    // Warm base noise gradient
    for (let i = 0; i < 15; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const r = rng() * 200 + 100;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, hexToRgba(secColor, 0.08));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw long flowing veins
    ctx.strokeStyle = secColor;
    ctx.lineCap = 'round';
    
    const numVeins = Math.floor(rng() * 6) + 6;
    for (let v = 0; v < numVeins; v++) {
      ctx.beginPath();
      let x = rng() * 512;
      let y = v % 2 === 0 ? 0 : rng() * 512;
      ctx.moveTo(x, y);
      
      const thickness = rng() * 1.8 + 0.3;
      ctx.lineWidth = thickness;
      ctx.strokeStyle = hexToRgba(secColor, rng() * 0.4 + 0.2);

      // Create a waving chaotic line representing natural marble stress fractures
      const steps = 32;
      for (let s = 0; s < steps; s++) {
        const progress = s / steps;
        x += (rng() - 0.48) * 45;
        y += v % 2 === 0 ? (512 / steps) : (rng() - 0.48) * 45;
        
        ctx.lineTo(x, y);

        // Branching veins
        if (rng() < 0.12 && thickness > 0.8) {
          const bx = x;
          const by = y;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineWidth = thickness * 0.5;
          ctx.strokeStyle = hexToRgba(secColor, rng() * 0.3);
          ctx.lineTo(bx + (rng() - 0.5) * 80, by + (rng() - 0.2) * 80);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineWidth = thickness;
          ctx.strokeStyle = hexToRgba(secColor, rng() * 0.4 + 0.2);
        }
      }
      ctx.stroke();
    }

    // Super fine gold/white hairline veins
    const fineColor = material.id.includes('calacatta') ? '#dfab40' : '#ffffff';
    ctx.strokeStyle = hexToRgba(fineColor, 0.4);
    for (let v = 0; v < 4; v++) {
      ctx.beginPath();
      let x = rng() * 512;
      let y = rng() * 512;
      ctx.moveTo(x, y);
      ctx.lineWidth = 0.5;
      for (let s = 0; s < 10; s++) {
        x += (rng() - 0.5) * 60;
        y += (rng() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

  } else if (material.textureType === 'composite') {
    // Generate fine composite quartz specks
    const seedValue = material.id.charCodeAt(0) + material.id.charCodeAt(1);
    const rng = createRNG(seedValue);

    // Subtle texture noise
    for (let i = 0; i < 5000; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const size = rng() * 1.5 + 0.5;
      const light = rng() > 0.4;
      ctx.fillStyle = light ? hexToRgba('#ffffff', 0.12) : hexToRgba('#000000', 0.15);
      ctx.fillRect(x, y, size, size);
    }
  }

  return canvas;
}

// Utility for simple deterministic random number generation
function createRNG(seed: number) {
  let m = 0x80000000; // 2**31
  let a = 1103515245;
  let c = 12345;
  let state = seed ? seed : Math.floor(Math.random() * (m - 1));

  return function() {
    state = (a * state + c) % m;
    return state / (m - 1);
  };
}

// Hex helper
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
