const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
};

function getCloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary ENV Variablen fehlen");
  }

  return {
    cloudName,
    uploadPreset,
  };
}

function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Nur JPG, PNG, WEBP und GIF Dateien sind erlaubt."
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `Die Datei ist zu groß. Maximal erlaubt sind ${MAX_IMAGE_SIZE_MB} MB.`
    );
  }
}

function normalizeFolder(folder: string) {
  const cleanedFolder = folder
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (!cleanedFolder.startsWith("chapterflow/")) {
    throw new Error("Ungültiger Cloudinary Upload-Ordner.");
  }

  return cleanedFolder;
}

export async function uploadMediaToCloudinary(
  file: File,
  folder = "chapterflow/comment-media"
): Promise<CloudinaryUploadResult> {
  validateImageFile(file);

  const { cloudName, uploadPreset } = getCloudinaryConfig();
  const safeFolder = normalizeFolder(folder);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", safeFolder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Datei konnte nicht hochgeladen werden"
    );
  }

  return data as CloudinaryUploadResult;
}

export async function uploadCoverToCloudinary(file: File): Promise<string> {
  const uploadedMedia = await uploadMediaToCloudinary(
    file,
    "chapterflow/covers"
  );

  return uploadedMedia.secure_url;
}
