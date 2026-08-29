import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { supabase } from './supabase';

export const PHOTO_BUCKET = 'memory-photos';
export const VOICE_BUCKET = 'memory-voice-notes';

const MAX_PHOTO_WIDTH = 1600;

/**
 * Signed URLs are now short-lived and resolved at read time.
 *
 * They used to be minted with a 365-day TTL and written straight into
 * `memories.photo_url`. That is a time bomb in an app whose entire promise is
 * permanence: on day 366 every photograph in the family archive goes blank,
 * with nothing in the database to recover from. The durable reference is the
 * storage *path*; the URL is derived, cached in memory, and re-minted well
 * before it lapses.
 */
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const CACHE_SAFETY_MARGIN_MS = 5 * 60 * 1000;

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

function cacheKey(bucket: string, path: string) {
  return `${bucket}/${path}`;
}

/**
 * Read a local file into bytes for upload.
 *
 * The two platforms need different routes. On web a recording or picked image
 * is a `blob:`/`data:` URL, which expo-file-system cannot open at all — that
 * failed every web upload silently — but `fetch` reads both natively. On device
 * `fetch` against `file://` is unreliable, so the filesystem `File` class reads
 * it instead; its `arrayBuffer()` also avoids the base64 round-trip that the
 * old (now deprecated) `readAsStringAsync` path needed.
 */
async function readFileBytes(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error(`Could not read that file (${response.status})`);
    return response.arrayBuffer();
  }
  return new File(uri).arrayBuffer();
}

/** Uploads and returns the storage *path*, never a URL. */
async function uploadTo(
  bucket: string,
  path: string,
  uri: string,
  contentType: string
): Promise<string> {
  const bytes = await readFileBytes(uri);
  if (bytes.byteLength === 0) throw new Error('That file came back empty — please try again.');

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType });
  if (error) throw new Error(error.message);

  return path;
}

export async function uploadPhoto(familyId: string, localUri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: MAX_PHOTO_WIDTH } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return uploadTo(PHOTO_BUCKET, `${familyId}/${Date.now()}.jpg`, manipulated.uri, 'image/jpeg');
}

export async function uploadVoiceNote(familyId: string, localUri: string): Promise<string> {
  // Browsers record WebM/Opus; iOS and Android record m4a.
  const isWeb = Platform.OS === 'web';
  const extension = isWeb ? 'webm' : 'm4a';
  const contentType = isWeb ? 'audio/webm' : 'audio/m4a';
  return uploadTo(
    VOICE_BUCKET,
    `${familyId}/${Date.now()}.${extension}`,
    localUri,
    contentType
  );
}

/** The elder's own answer, kept apart from family voice notes by path. */
export async function uploadElderRecording(familyId: string, localUri: string): Promise<string> {
  const isWeb = Platform.OS === 'web';
  const extension = isWeb ? 'webm' : 'm4a';
  const contentType = isWeb ? 'audio/webm' : 'audio/m4a';
  return uploadTo(
    VOICE_BUCKET,
    `${familyId}/elder/${Date.now()}.${extension}`,
    localUri,
    contentType
  );
}

/**
 * Resolve many paths at once, reusing anything still comfortably in date.
 * Batched because a list screen would otherwise fire one request per row.
 */
export async function signedUrlsFor(
  bucket: string,
  paths: string[]
): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};
  const now = Date.now();
  const missing: string[] = [];

  for (const path of Array.from(new Set(paths))) {
    const hit = signedUrlCache.get(cacheKey(bucket, path));
    if (hit && hit.expiresAt - CACHE_SAFETY_MARGIN_MS > now) {
      resolved[path] = hit.url;
    } else {
      missing.push(path);
    }
  }

  if (missing.length === 0) return resolved;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(missing, SIGNED_URL_TTL_SECONDS);

  // A failure here means photos render blank for this pass and are retried on
  // the next one — far better than persisting a URL that silently rots.
  if (error || !data) return resolved;

  const expiresAt = now + SIGNED_URL_TTL_SECONDS * 1000;
  for (const entry of data) {
    if (entry.signedUrl && entry.path) {
      resolved[entry.path] = entry.signedUrl;
      signedUrlCache.set(cacheKey(bucket, entry.path), { url: entry.signedUrl, expiresAt });
    }
  }
  return resolved;
}

export async function signedUrlFor(bucket: string, path: string): Promise<string | null> {
  const map = await signedUrlsFor(bucket, [path]);
  return map[path] ?? null;
}

export async function removeObject(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
  signedUrlCache.delete(cacheKey(bucket, path));
}

/** Exposed for tests and for sign-out, so one family's URLs never leak into another's session. */
export function clearSignedUrlCache(): void {
  signedUrlCache.clear();
}
