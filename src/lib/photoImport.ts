import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';
import type { DatePrecision, MemoryCategory } from './types';

export const MAX_IMPORT_BATCH = 8;

/** Width sent to the model. Large enough to read a face, small enough to be cheap. */
const DRAFT_WIDTH = 900;

export interface PickedPhoto {
  /** Local URI of the full-size original, uploaded only once a draft is kept. */
  uri: string;
  base64: string;
  takenOn: string | null;
}

export interface MemoryDraft {
  index: number;
  question: string;
  answer: string;
  category: MemoryCategory;
  occurredOn: string | null;
  occurredPrecision: DatePrecision | null;
  /** False when the draft still contains a bracketed blank for the family to fill in. */
  confident: boolean;
}

/**
 * EXIF dates look like "2021:08:29 14:30:00".
 *
 * This is the single most valuable field in the file: it is the one piece of
 * a memory's date that nobody has to remember, and it is what makes "42 years
 * ago today" possible without anyone typing a thing.
 */
function exifDate(exif: Record<string, any> | undefined): string | null {
  const raw = exif?.DateTimeOriginal ?? exif?.DateTime ?? exif?.CreateDate;
  if (typeof raw !== 'string') return null;
  const match = raw.match(/^(\d{4})[:-](\d{2})[:-](\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  if (Number(year) < 1826 || Number(year) > new Date().getFullYear()) return null;
  return `${year}-${month}-${day}`;
}

export async function pickPhotosForImport(): Promise<PickedPhoto[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: MAX_IMPORT_BATCH,
    exif: true,
    quality: 1,
  });
  if (result.canceled) return [];

  return Promise.all(
    result.assets.slice(0, MAX_IMPORT_BATCH).map(async (asset) => {
      const small = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: DRAFT_WIDTH } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      return {
        uri: asset.uri,
        base64: small.base64 ?? '',
        takenOn: exifDate(asset.exif as Record<string, any> | undefined),
      };
    })
  );
}

/** Take a photo with the camera — the shoebox route, for prints that were never digital. */
export async function capturePhotoForImport(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({ exif: true, quality: 1 });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const small = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: DRAFT_WIDTH } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return {
    uri: asset.uri,
    base64: small.base64 ?? '',
    // A photograph of a print was taken today; the EXIF date describes the
    // act of scanning, not the moment in the picture.
    takenOn: null,
  };
}

export async function draftMemoriesFromPhotos(
  familyId: string,
  photos: PickedPhoto[]
): Promise<MemoryDraft[]> {
  const { data, error } = await supabase.functions.invoke('draft-memories', {
    body: {
      familyId,
      images: photos.map((p) => ({
        base64: p.base64,
        mediaType: 'image/jpeg',
        takenOn: p.takenOn,
      })),
    },
  });
  if (error) throw new Error(error.message);
  return data?.drafts ?? [];
}
