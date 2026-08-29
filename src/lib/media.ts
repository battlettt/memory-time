import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { supabase } from './supabase';

const MAX_PHOTO_WIDTH = 1600;
const SIGNED_URL_TTL = 60 * 60 * 24 * 365;

/**
 * Read a local file into bytes for upload.
 *
 * The two platforms need different routes. On web a recording or picked image
 * is a `blob:`/`data:` URL, which expo-file-system cannot open at all — that
 * failed every web upload — but `fetch` reads both natively. On device `fetch`
 * against `file://` is unreliable, so the filesystem `File` class reads it
 * instead; its `arrayBuffer()` also avoids the base64 round-trip that the old
 * (now deprecated) `readAsStringAsync` path needed.
 */
async function readFileBytes(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error(`Could not read that file (${response.status})`);
    return response.arrayBuffer();
  }
  return new File(uri).arrayBuffer();
}

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

  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? path;
}

export async function uploadPhoto(familyId: string, localUri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: MAX_PHOTO_WIDTH } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return uploadTo('memory-photos', `${familyId}/${Date.now()}.jpg`, manipulated.uri, 'image/jpeg');
}

export async function uploadVoiceNote(familyId: string, localUri: string): Promise<string> {
  // Browsers record WebM/Opus; iOS and Android record m4a.
  const isWeb = Platform.OS === 'web';
  const extension = isWeb ? 'webm' : 'm4a';
  const contentType = isWeb ? 'audio/webm' : 'audio/m4a';
  return uploadTo(
    'memory-voice-notes',
    `${familyId}/${Date.now()}.${extension}`,
    localUri,
    contentType
  );
}
