/**
 * Storage provider abstraction.
 *
 * The PRD lists storage as a swappable concern (self-hosted Synology or a
 * managed CDN like Cloudinary). Every provider implements this interface so
 * the rest of the app never hard-codes one vendor. Media rows in the DB store
 * `provider` + `storageKey`, which is enough to delete or re-sign later.
 */
export type UploadInput = {
  /** Raw bytes or a remote URL the provider should fetch. */
  data: Buffer | Uint8Array | string;
  /** Logical folder, e.g. `projects/<id>/takes`. */
  folder: string;
  filename?: string;
  contentType?: string;
  kind: "image" | "video" | "audio" | "document";
};

export type StoredObject = {
  provider: StorageProviderName;
  storageKey: string;
  url: string;
  width?: number;
  height?: number;
  durationSec?: number;
  bytes?: number;
};

export type StorageProviderName = "cloudinary" | "synology";

export interface StorageProvider {
  readonly name: StorageProviderName;
  upload(input: UploadInput): Promise<StoredObject>;
  delete(storageKey: string): Promise<void>;
  /** Time-limited signed URL for private assets (PRD §6.10 signed URLs). */
  signedUrl(storageKey: string, expiresInSec?: number): Promise<string>;
}
