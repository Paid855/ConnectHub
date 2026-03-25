export function compressBase64Image(base64: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> {
  return new Promise((resolve) => {
    // If not a base64 image or already small, return as-is
    if (!base64.startsWith("data:image")) {
      resolve(base64);
      return;
    }

    // Server-side: can't use canvas, return as-is but validate size
    // This function is meant for client-side compression
    // On server, we just validate and truncate if needed
    if (typeof window === "undefined") {
      // Server: just validate it's a reasonable size (max 2MB base64)
      if (base64.length > 2 * 1024 * 1024) {
        // Truncate extremely large images - they shouldn't be stored
        resolve(base64.substring(0, 2 * 1024 * 1024));
      } else {
        resolve(base64);
      }
      return;
    }

    // Client-side compression using canvas
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(base64); return; }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

// Validate image size (server-side)
export function validateImageSize(base64: string, maxSizeMB: number = 5): boolean {
  if (!base64) return true;
  const sizeInBytes = (base64.length * 3) / 4;
  return sizeInBytes <= maxSizeMB * 1024 * 1024;
}
