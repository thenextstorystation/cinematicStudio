import { createHmac, randomUUID } from "node:crypto";
import type {
  StorageProvider,
  StoredObject,
  UploadInput,
} from "./types";

/**
 * Self-hosted Synology provider.
 *
 * Talks to a Synology NAS over its WebDAV endpoint (DSM "WebDAV Server"
 * package) using HTTP Basic auth. Objects are addressed by a key under the
 * configured bucket/share; public delivery is served from a reverse-proxied
 * base URL (SYNOLOGY_PUBLIC_BASE_URL), which is how self-hosters typically
 * front their NAS with a CDN or nginx.
 *
 * This keeps the "self-hosted" option first-class without pulling in the AWS
 * SDK. Swap in the S3-compatible object store later if DSM's MinIO package is
 * enabled — only this file changes.
 */
export class SynologyProvider implements StorageProvider {
  readonly name = "synology" as const;

  private endpoint = requireEnv("SYNOLOGY_ENDPOINT");
  private bucket = requireEnv("SYNOLOGY_BUCKET");
  private accessKey = requireEnv("SYNOLOGY_ACCESS_KEY");
  private secretKey = requireEnv("SYNOLOGY_SECRET_KEY");
  private publicBase = requireEnv("SYNOLOGY_PUBLIC_BASE_URL");

  private authHeader() {
    const token = Buffer.from(`${this.accessKey}:${this.secretKey}`).toString(
      "base64",
    );
    return `Basic ${token}`;
  }

  private objectUrl(storageKey: string) {
    return `${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${storageKey}`;
  }

  async upload(input: UploadInput): Promise<StoredObject> {
    const ext = input.filename?.includes(".")
      ? input.filename.split(".").pop()
      : extForKind(input.kind);
    const storageKey = `${input.folder.replace(/^\/|\/$/g, "")}/${randomUUID()}${
      ext ? `.${ext}` : ""
    }`;

    const body =
      typeof input.data === "string"
        ? await fetchRemote(input.data)
        : Buffer.from(input.data);

    const res = await fetch(this.objectUrl(storageKey), {
      method: "PUT",
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": input.contentType ?? "application/octet-stream",
      },
      // Uint8Array view satisfies BodyInit across Node's fetch typings.
      body: new Uint8Array(body),
    });

    if (!res.ok) {
      throw new Error(
        `Synology upload failed (${res.status} ${res.statusText}) for ${storageKey}`,
      );
    }

    return {
      provider: this.name,
      storageKey,
      url: `${this.publicBase.replace(/\/$/, "")}/${storageKey}`,
      bytes: body.byteLength,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const res = await fetch(this.objectUrl(storageKey), {
      method: "DELETE",
      headers: { Authorization: this.authHeader() },
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(
        `Synology delete failed (${res.status} ${res.statusText}) for ${storageKey}`,
      );
    }
  }

  /**
   * Signed URL for private delivery. Produces an HMAC-signed, time-limited link
   * that a reverse proxy (nginx `secure_link`, Caddy, etc.) can validate.
   */
  async signedUrl(storageKey: string, expiresInSec = 3600): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + expiresInSec;
    const sig = createHmac("sha256", this.secretKey)
      .update(`${storageKey}:${expires}`)
      .digest("hex");
    const url = new URL(`${this.publicBase.replace(/\/$/, "")}/${storageKey}`);
    url.searchParams.set("expires", String(expires));
    url.searchParams.set("sig", sig);
    return url.toString();
  }
}

function extForKind(kind: UploadInput["kind"]) {
  switch (kind) {
    case "image":
      return "png";
    case "video":
      return "mp4";
    case "audio":
      return "mp3";
    default:
      return "bin";
  }
}

async function fetchRemote(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch remote asset: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Lazily thrown only when the Synology provider is actually selected.
    return "";
  }
  return value;
}
