// Rasterize an SVG document string to a base64 PNG data URL.
// Used to send drawings to Claude for vision input.

const DEFAULT_SIZE = 1024; // see TODO.md — tunable

export async function svgToPngDataUrl(svgString: string, size = DEFAULT_SIZE): Promise<string> {
  // Encode the SVG as a data URL. We do not embed external resources so this
  // works without taint issues when drawing onto a canvas.
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load SVG into Image'));
    img.src = svgUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');
  // Cream paper background so transparent SVG → readable PNG for Claude
  ctx.fillStyle = '#F7F1E5';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);

  return canvas.toDataURL('image/png');
}

/** Generate a smaller thumbnail (for portfolio gallery). */
export function svgToThumbnail(svgString: string, size = 256): Promise<string> {
  return svgToPngDataUrl(svgString, size);
}
