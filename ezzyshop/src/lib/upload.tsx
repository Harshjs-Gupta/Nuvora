/**
 * Upload utility — Cloudinary (server-side via /api/cloudinary/upload)
 * Previously used Firebase Storage.
 * @deprecated For admin use only — use /api/cloudinary/upload route
 */
export default async function upload(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/cloudinary/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Upload failed");
  }

  const data = await res.json();
  return data.url as string;
}
