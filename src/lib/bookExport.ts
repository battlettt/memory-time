import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatOccurred } from './dates';
import { languageLabel } from './languages';
import { TOPIC_LABELS, type LifeStorySection, type LifeStorySectionKey, type Memory } from './types';

/**
 * The book.
 *
 * Everything else in this app lives behind a login, on a phone, in a database
 * somebody has to keep paying for. This is the part that survives all of
 * that: a document a family can print, put on a shelf, and hand to somebody
 * at a funeral. It is also the thing that makes months of contributing feel
 * like it produced something, rather than feeding a system.
 *
 * Photographs are embedded as data URIs at export time, because the storage
 * URLs are signed and short-lived — a book full of links that expire in an
 * hour would be worse than no book.
 */

const CHAPTER_ORDER: LifeStorySectionKey[] = [
  'early_life',
  'family',
  'career',
  'personality',
  'favorites',
  'stories',
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Fetch a photo and inline it, so the document stands alone forever. */
async function toDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.size > 4 * 1024 * 1024) return null;

    if (Platform.OS === 'web') {
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }

    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return `data:${blob.type || 'image/jpeg'};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

const STYLES = `
  @page { margin: 18mm 16mm; }
  body { font-family: Georgia, "Times New Roman", serif; color: #22201D; line-height: 1.55;
         font-size: 12pt; margin: 0; }
  .cover { text-align: center; padding: 46mm 0 30mm; page-break-after: always; }
  .cover h1 { font-size: 34pt; margin: 0 0 10mm; line-height: 1.15; }
  .cover .sub { font-size: 13pt; color: #6B6560; }
  h2 { font-size: 19pt; margin: 0 0 4mm; page-break-after: avoid; }
  .chapter { page-break-before: always; }
  .chapter img { width: 100%; max-height: 105mm; object-fit: cover; border-radius: 3mm;
                 margin-bottom: 5mm; }
  p { margin: 0 0 4mm; }
  .plate { page-break-inside: avoid; margin-bottom: 9mm; }
  .plate img { width: 100%; border-radius: 3mm; }
  .plate .caption { font-size: 12pt; margin-top: 2mm; }
  .plate .meta { font-size: 10pt; color: #6B6560; }
  .note { font-style: italic; color: #4A453F; }
  .closing { page-break-before: always; font-size: 11pt; color: #6B6560; }
`;

export interface BookInput {
  familyName: string;
  careRecipientName: string;
  sections: LifeStorySection[];
  memories: Memory[];
  /** Resolves a member id to a display name. */
  nameFor: (id: string | null) => string;
}

export async function buildBookHtml(input: BookInput): Promise<string> {
  const { careRecipientName, familyName, sections, memories, nameFor } = input;

  const plates = memories.filter((m) => m.photo_url);
  const embedded = await Promise.all(
    plates.map(async (m) => ({ memory: m, dataUri: await toDataUri(m.photo_url!) }))
  );

  const chapters = CHAPTER_ORDER.map((key) => sections.find((s) => s.section_key === key))
    .filter((s): s is LifeStorySection => !!s && s.content.trim().length > 0)
    .map(
      (s) => `<div class="chapter">
        <h2>${escapeHtml(TOPIC_LABELS[s.section_key])}</h2>
        ${paragraphs(s.content)}
      </div>`
    )
    .join('');

  const platesHtml = embedded
    .filter((p) => p.dataUri)
    .map((p) => {
      const when = formatOccurred(p.memory.occurred_on, p.memory.occurred_precision);
      const lang = languageLabel(p.memory.language);
      const meta = [when, lang, `Shared by ${nameFor(p.memory.added_by)}`]
        .filter(Boolean)
        .join(' · ');
      return `<div class="plate">
        <img src="${p.dataUri}" alt="">
        <div class="caption">${escapeHtml(p.memory.answer)}</div>
        ${p.memory.note ? `<div class="caption note">“${escapeHtml(p.memory.note)}”</div>` : ''}
        <div class="meta">${escapeHtml(meta)}</div>
      </div>`;
    })
    .join('');

  const year = new Date().getFullYear();

  return `<!doctype html><html><head><meta charset="utf-8">
<title>${escapeHtml(careRecipientName)}</title><style>${STYLES}</style></head><body>
  <div class="cover">
    <h1>${escapeHtml(careRecipientName)}</h1>
    <div class="sub">Collected by ${escapeHtml(familyName)}<br>${year}</div>
  </div>
  ${chapters}
  ${platesHtml ? `<div class="chapter"><h2>Photographs</h2>${platesHtml}</div>` : ''}
  <div class="closing">
    <p>Assembled from memories written by the family in Memory Time.</p>
  </div>
</body></html>`;
}

export interface ExportResult {
  status: 'shared' | 'printed' | 'unavailable';
  uri?: string;
}

export async function exportBook(input: BookInput): Promise<ExportResult> {
  const html = await buildBookHtml(input);

  // On web there is no filesystem to share from; the browser's own print
  // dialog offers "Save as PDF", which is the same outcome by another route.
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return { status: 'printed' };
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    return { status: 'shared', uri };
  }
  return { status: 'unavailable', uri };
}
