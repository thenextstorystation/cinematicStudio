import { CloudinaryProvider } from "./cloudinary";
import { SynologyProvider } from "./synology";
import type { StorageProvider, StorageProviderName } from "./types";

export * from "./types";

let cached: StorageProvider | null = null;

/**
 * Returns the active storage provider selected by STORAGE_PROVIDER.
 * Defaults to Cloudinary. Instantiated once per runtime.
 */
export function getStorage(): StorageProvider {
  if (cached) return cached;
  const provider = (process.env.STORAGE_PROVIDER ??
    "cloudinary") as StorageProviderName;

  switch (provider) {
    case "synology":
      cached = new SynologyProvider();
      break;
    case "cloudinary":
    default:
      cached = new CloudinaryProvider();
      break;
  }
  return cached;
}
