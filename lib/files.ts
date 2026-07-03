/**
 * Shared helpers for uploaded-file field values.
 *
 * A file/audio milestone field stores a JSON-stringified array of
 * { url, name } objects, e.g. `[{"url":"https://…","name":"deck.pdf"}]`.
 *
 * Backward compatible: legacy values that are a single bare "https://…" URL
 * string are parsed as one file.
 */

export interface UploadedFile {
  url: string;
  name: string;
}

/** Derive a human filename from a blob URL (strips the pathname prefix). */
export function fileNameFromUrl(url: string): string {
  const last = url.split("/").pop() ?? "file";
  const decoded = decodeURIComponent(last);
  // Strip the "<timestamp>_" or "<uuid>-" prefix we add on upload, if present.
  return decoded.replace(/^\d{10,}[-_]/, "").replace(/^[0-9a-f-]{16,}[-_]/i, "") || decoded;
}

/** Parse any stored field value into an array of uploaded files. */
export function parseUploadedFiles(val: unknown): UploadedFile[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .filter((f): f is UploadedFile => !!f && typeof f === "object" && typeof (f as UploadedFile).url === "string")
      .map((f) => ({ url: f.url, name: f.name || fileNameFromUrl(f.url) }));
  }
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return [];
    if (s.startsWith("[")) {
      try {
        const arr = JSON.parse(s);
        return parseUploadedFiles(arr);
      } catch {
        return [];
      }
    }
    if (s.startsWith("https://") || s.startsWith("http://")) {
      return [{ url: s, name: fileNameFromUrl(s) }];
    }
  }
  return [];
}

/** True if a stored value looks like one or more uploaded files. */
export function isFileValue(val: unknown): boolean {
  if (typeof val === "string") {
    const s = val.trim();
    if (s.startsWith("https://") || s.startsWith("http://")) return true;
    if (s.startsWith("[")) return parseUploadedFiles(s).length > 0;
    return false;
  }
  return parseUploadedFiles(val).length > 0;
}

/** Serialize an array of files back into a storable field value. Empty ⇒ "". */
export function filesToValue(files: UploadedFile[]): string {
  return files.length > 0 ? JSON.stringify(files) : "";
}

/** Collect every file URL across a formData object (for fileUrls[] persistence). */
export function collectFileUrls(formData: Record<string, unknown>): string[] {
  const urls: string[] = [];
  for (const v of Object.values(formData)) {
    if (isFileValue(v)) {
      for (const f of parseUploadedFiles(v)) urls.push(f.url);
    }
  }
  return urls;
}
