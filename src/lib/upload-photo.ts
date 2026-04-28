"use client";

export async function compressImage(file: File, maxSize = 1200, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
          else { width = Math.round(width * maxSize / height); height = maxSize; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("Compression failed")), "image/jpeg", quality);
      };
      img.onerror = () => reject(new Error("Image decode failed"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

export async function uploadProfilePhoto(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error("Photo too large (max 10MB)");
  const blob = await compressImage(file, 1200, 0.85);

  const sigRes = await fetch("/api/cloudinary-sign", { method: "POST" });
  if (!sigRes.ok) throw new Error("Could not get upload signature");
  const { signature, timestamp, folder, apiKey, cloudName } = await sigRes.json();

  const fd = new FormData();
  fd.append("file", blob, "photo.jpg");
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("folder", folder);
  fd.append("signature", signature);

  const up = await fetch("https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload", { method: "POST", body: fd });
  const data = await up.json();
  if (!data.secure_url) throw new Error(data.error?.message || "Cloudinary rejected upload");
  return data.secure_url as string;
}
