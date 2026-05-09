export interface TextOverlayOptions {
  text: string;
  position: "top" | "center" | "bottom";
  alignment: "left" | "center" | "right";
  fontSize: number;
  fontFamily: string;
  color: string;
  shadowColor: string;
  shadowBlur: number;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor?: string;
  backgroundOpacity: number;
  padding: number;
  yOffset: number;
}

export const DEFAULT_OVERLAY_OPTIONS: TextOverlayOptions = {
  text: "",
  position: "center",
  alignment: "center",
  fontSize: 72,
  fontFamily: "Impact, Arial Black, sans-serif",
  color: "#FFFFFF",
  shadowColor: "rgba(0, 0, 0, 0.8)",
  shadowBlur: 8,
  strokeColor: "#000000",
  strokeWidth: 4,
  backgroundOpacity: 0,
  padding: 16,
  yOffset: 0,
};

/**
 * Applies text overlay to an image using Canvas API.
 * Returns a Promise that resolves to a data URL of the resulting image.
 */
export async function applyTextOverlay(
  imageUrl: string,
  options: Partial<TextOverlayOptions>
): Promise<string> {
  const opts = { ...DEFAULT_OVERLAY_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Draw base image
        ctx.drawImage(img, 0, 0);

        // Skip if no text
        if (!opts.text.trim()) {
          resolve(canvas.toDataURL("image/png"));
          return;
        }

        // Configure text style
        ctx.font = `bold ${opts.fontSize}px ${opts.fontFamily}`;
        ctx.textAlign = opts.alignment;
        ctx.textBaseline = "middle";

        // Calculate position
        let x: number;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        switch (opts.alignment) {
          case "left":
            x = opts.padding;
            break;
          case "right":
            x = canvasWidth - opts.padding;
            break;
          case "center":
          default:
            x = canvasWidth / 2;
            break;
        }

        let y: number;
        switch (opts.position) {
          case "top":
            y = canvasHeight * 0.15;
            break;
          case "bottom":
            y = canvasHeight * 0.85;
            break;
          case "center":
          default:
            y = canvasHeight * 0.5;
            break;
        }
        y += opts.yOffset;

        // Word wrap text to fit canvas
        const maxWidth = canvasWidth - opts.padding * 2;
        const lines = wrapText(ctx, opts.text, maxWidth);
        const lineHeight = opts.fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;

        // Adjust y for multi-line text
        const startY = y - (totalHeight - lineHeight) / 2;

        // Draw each line
        lines.forEach((line, i) => {
          const lineY = startY + i * lineHeight;

          // Draw background if set
          if (opts.backgroundOpacity > 0 && opts.backgroundColor) {
            const metrics = ctx.measureText(line);
            const textWidth = metrics.width;
            const bgHeight = lineHeight;
            const bgY = lineY - bgHeight / 2;
            let bgX: number;

            switch (opts.alignment) {
              case "left":
                bgX = 0;
                break;
              case "right":
                bgX = canvasWidth - textWidth - opts.padding * 2;
                break;
              case "center":
              default:
                bgX = (canvasWidth - textWidth) / 2 - opts.padding;
                break;
            }

            ctx.save();
            ctx.globalAlpha = opts.backgroundOpacity;
            ctx.fillStyle = opts.backgroundColor;
            ctx.fillRect(bgX, bgY, textWidth + opts.padding * 2, bgHeight);
            ctx.restore();
          }

          // Draw shadow
          if (opts.shadowBlur > 0) {
            ctx.save();
            ctx.shadowColor = opts.shadowColor;
            ctx.shadowBlur = opts.shadowBlur;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillStyle = opts.color;
            ctx.fillText(line, x, lineY);
            ctx.restore();
          }

          // Draw stroke
          if (opts.strokeWidth > 0) {
            ctx.save();
            ctx.strokeStyle = opts.strokeColor;
            ctx.lineWidth = opts.strokeWidth;
            ctx.lineJoin = "round";
            ctx.strokeText(line, x, lineY);
            ctx.restore();
          }

          // Draw fill
          ctx.fillStyle = opts.color;
          ctx.fillText(line, x, lineY);
        });

        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image for text overlay"));
    img.src = imageUrl;
  });
}

/**
 * Wraps text into lines that fit within maxWidth.
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
}

/**
 * Downloads a data URL as a file.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Creates a preview thumbnail with text overlay for the editor.
 */
export async function createOverlayPreview(
  imageUrl: string,
  options: Partial<TextOverlayOptions>
): Promise<string> {
  return applyTextOverlay(imageUrl, options);
}
