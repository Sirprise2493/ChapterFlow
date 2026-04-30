export async function uploadMediaToCloudinary(
  file: File,
  folder = "chapterflow/comments"
): Promise<{ secure_url: string; resource_type: string }> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary ENV Variablen fehlen");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
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

  return {
    secure_url: data.secure_url as string,
    resource_type: data.resource_type as string,
  };
}
