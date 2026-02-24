import { net } from "electron";
import type { WindowContext } from "./windowContext";

const WEB_URL = process.env.VITE_WEB_URL || "http://localhost:3000";

export async function uploadCapture(
  pngBuffer: Buffer,
  authToken: string,
  context: WindowContext
): Promise<{ id: string; imageUrl: string } | null> {
  try {
    // Build multipart form data manually for Electron's net module
    const boundary = `----CurateBoundary${Date.now()}`;
    const filename = `capture-${Date.now()}.png`;

    const parts: Buffer[] = [];

    // Image part
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`,
      "utf-8"
    ));
    parts.push(pngBuffer);
    parts.push(Buffer.from("\r\n", "utf-8"));

    // sourceApp part (conditional)
    if (context.sourceApp) {
      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="sourceApp"\r\n\r\n${context.sourceApp}\r\n`,
        "utf-8"
      ));
    }

    // sourceUrl part (conditional)
    if (context.sourceUrl) {
      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="sourceUrl"\r\n\r\n${context.sourceUrl}\r\n`,
        "utf-8"
      ));
    }

    // Closing boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`, "utf-8"));

    const body = Buffer.concat(parts);

    const response = await net.fetch(`${WEB_URL}/api/captures/upload`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${authToken}`,
      },
      body,
    });

    if (!response.ok) {
      console.error("[upload] Server returned", response.status);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error("[upload] Failed:", err);
    return null;
  }
}
