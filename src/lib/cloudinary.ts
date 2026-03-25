import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dpov63szx",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

export async function uploadImage(base64: string, folder: string = "profiles"): Promise<string | null> {
  try {
    if (!base64 || !base64.startsWith("data:")) return null;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "connecthub/" + folder,
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto:good" },
        { fetch_format: "auto" }
      ],
      resource_type: "auto",
    });

    return result.secure_url;
  } catch (e) {
    console.error("Cloudinary upload error:", e);
    return null;
  }
}

export async function uploadVideo(base64: string, folder: string = "videos"): Promise<string | null> {
  try {
    if (!base64 || !base64.startsWith("data:")) return null;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "connecthub/" + folder,
      resource_type: "video",
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" }
      ],
    });

    return result.secure_url;
  } catch (e) {
    console.error("Cloudinary video upload error:", e);
    return null;
  }
}

export async function deleteImage(url: string): Promise<boolean> {
  try {
    if (!url || !url.includes("cloudinary")) return false;
    const parts = url.split("/");
    const publicId = parts.slice(-2).join("/").split(".")[0];
    await cloudinary.uploader.destroy("connecthub/" + publicId);
    return true;
  } catch {
    return false;
  }
}
