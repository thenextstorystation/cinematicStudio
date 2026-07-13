import { v2 as cloudinary } from "cloudinary";
import type {
  StorageProvider,
  StoredObject,
  UploadInput,
} from "./types";

/**
 * Cloudinary-backed storage provider. Handles image/video/audio uploads and
 * exposes signed delivery URLs. Configured lazily so the module can be imported
 * even when credentials are absent (e.g. during typecheck / build).
 */
function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function resourceType(kind: UploadInput["kind"]) {
  if (kind === "image") return "image" as const;
  if (kind === "video" || kind === "audio") return "video" as const; // Cloudinary treats audio under "video"
  return "raw" as const;
}

export class CloudinaryProvider implements StorageProvider {
  readonly name = "cloudinary" as const;

  async upload(input: UploadInput): Promise<StoredObject> {
    configure();
    const payload =
      typeof input.data === "string"
        ? input.data
        : `data:${input.contentType ?? "application/octet-stream"};base64,${Buffer.from(
            input.data,
          ).toString("base64")}`;

    const res = await cloudinary.uploader.upload(payload, {
      folder: input.folder,
      resource_type: resourceType(input.kind),
      filename_override: input.filename,
      use_filename: Boolean(input.filename),
      unique_filename: true,
    });

    return {
      provider: this.name,
      storageKey: res.public_id,
      url: res.secure_url,
      width: res.width,
      height: res.height,
      durationSec: res.duration ? Math.round(res.duration) : undefined,
      bytes: res.bytes,
    };
  }

  async delete(storageKey: string): Promise<void> {
    configure();
    await cloudinary.uploader.destroy(storageKey);
  }

  async signedUrl(storageKey: string, expiresInSec = 3600): Promise<string> {
    configure();
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec;
    return cloudinary.utils.private_download_url(storageKey, "", {
      expires_at: expiresAt,
    });
  }
}
