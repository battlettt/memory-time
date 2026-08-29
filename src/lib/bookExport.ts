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
  @page { margin: 20mm 18mm; }
  body { font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; color: #22201D;
         line-height: 1.6; font-size: 12pt; margin: 0;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* Cover: the person's name and their face, nothing else competing. */
  .cover { text-align: center; padding: 30mm 0 0; page-break-after: always; }
  .cover .portrait { width: 78mm; height: 78mm; object-fit: cover; border-radius: 50%;
                     margin: 0 auto 14mm; display: block; }
  .cover h1 { font-size: 40pt; margin: 0; line-height: 1.1; letter-spacing: -0.01em; }
  .cover .rule { width: 26mm; height: 1px; background: #B0740F; margin: 8mm auto; }
  .cover .sub { font-size: 12pt; color: #6B6560; line-height: 1.8; }

  .epigraph { page-break-after: always; padding: 62mm 18mm 0; text-align: center;
              font-style: italic; color: #4A453F; font-size: 13pt; }

  h2 { font-size: 20pt; margin: 0 0 2mm; page-break-after: avoid; font-weight: normal; }
  .chapter { page-break-before: always; }
  .chapter .eyebrow { font-size: 9pt; letter-spacing: 0.18em; text-transform: uppercase;
                      color: #B0740F; margin: 0 0 3mm; }
  .chapter .hrule { width: 100%; height: 1px; background: #E8E0D4; margin: 0 0 6mm; }
  /* Drop cap via CSS so the markup stays plain paragraphs. The eyebrow is a
     div rather than a p precisely so the cap lands on the first line of
     prose and not on the word "Chapter". */
  .chapter p:first-of-type::first-letter {
    float: left; font-size: 30pt; line-height: 0.86; padding: 1mm 2mm 0 0; color: #15605C;
  }
  p { margin: 0 0 4mm; text-align: justify; hyphens: auto; }

  .plates { page-break-before: always; }
  .plate { page-break-inside: avoid; margin: 0 0 12mm; }
  .plate img { width: 100%; border-radius: 2mm; }
  .plate .caption { font-size: 13pt; margin-top: 3mm; }
  .plate .meta { font-size: 9.5pt; color: #6B6560; letter-spacing: 0.04em; }
  .note { font-style: italic; color: #4A453F; }

  .closing { page-break-before: always; text-align: center; padding-top: 40mm;
             font-size: 11pt; color: #6B6560; }
  .closing .names { font-size: 13pt; color: #22201D; line-height: 2; margin: 6mm 0 10mm; }
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
      (s, index) => `<div class="chapter">
        <div class="eyebrow">Chapter ${index + 1}</div>
        <h2>${escapeHtml(TOPIC_LABELS[s.section_key])}</h2>
        <div class="hrule"></div>
        ${paragraphs(s.content)}
      </div>`
    )
    .join('');

  // The cover wants a face, not scenery. Anchors are the people who matter
  // most to this person, and 'identity' memories are about them directly, so
  // both are far better bets than whichever photograph happens to be first.
  const coverPhoto =
    embedded.find((p) => p.dataUri && p.memory.is_anchor) ??
    embedded.find((p) => p.dataUri && p.memory.category === 'identity') ??
    embedded.find((p) => p.dataUri);

  const platesHtml = embedded
    .filter((p) => p.dataUri && p !== coverPhoto)
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

  // Who actually put this together. Naming them is most of the point: this is
  // a family's collective work, not an export from an app.
  const contributors = Array.from(
    new Set(memories.map((m) => nameFor(m.added_by)).filter((n) => n && n !== 'A family member'))
  );

  const chapterCount = (chapters.match(/class="chapter"/g) || []).length;

  return `<!doctype html><html><head><meta charset="utf-8">
<title>${escapeHtml(careRecipientName)}</title><style>${STYLES}</style></head><body>
  <div class="cover">
    ${coverPhoto ? `<img class="portrait" src="${coverPhoto.dataUri}" alt="">` : ''}
    <h1>${escapeHtml(careRecipientName)}</h1>
    <div class="rule"></div>
    <div class="sub">A life, in the words of the people who were there<br>
      Collected by ${escapeHtml(familyName)}<br>${year}</div>
  </div>

  <div class="epigraph">
    <p>These are the things we did not want to lose:<br>
    the names, the places, the way you told it.</p>
  </div>

  ${chapters}
  ${platesHtml ? `<div class="plates"><p class="eyebrow">Plates</p><h2>Photographs</h2><div class="hrule"></div>${platesHtml}</div>` : ''}

  <div class="closing">
    <p>Remembered by</p>
    <div class="names">${contributors.map((n) => escapeHtml(n)).join('<br>')}</div>
    <p>${chapterCount} ${chapterCount === 1 ? 'chapter' : 'chapters'} and
       ${embedded.length} ${embedded.length === 1 ? 'photograph' : 'photographs'},
       gathered ${year}.</p>
  </div>
</body></html>`;
}

export interface ExportResult {
  status: 'shared' | 'printed' | 'unavailable';
  uri?: string;
}

/**
 * Print the book on web.
 *
 * expo-print's web path printed the *current document* rather than the HTML
 * handed to it, so "Make a book" produced a printout of whatever screen you
 * were looking at — the Settings page. Rendering into an isolated iframe and
 * printing that frame prints the book and nothing else.
 *
 * An iframe rather than a popup window on purpose: a popup is liable to be
 * blocked, and a blocked popup would look exactly like the button doing
 * nothing at all.
 */
function printHtmlOnWeb(html: string): Promise<void> {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';

    const cleanUp = () => {
      // Leave the frame in place briefly: removing it while the print dialog
      // is still open cancels the job in some browsers.
      setTimeout(() => frame.remove(), 60_000);
      resolve();
    };

    frame.onload = () => {
      try {
        const win = frame.contentWindow;
        if (!win) return cleanUp();
        win.focus();
        win.print();
      } catch {
        /* the book is still on screen in the frame; nothing else to do */
      }
      cleanUp();
    };

    frame.srcdoc = html;
    document.body.appendChild(frame);
  });
}

export async function exportBook(input: BookInput): Promise<ExportResult> {
  const html = await buildBookHtml(input);

  // On web there is no filesystem to share from; the browser's own print
  // dialog offers "Save as PDF", which is the same outcome by another route.
  if (Platform.OS === 'web') {
    await printHtmlOnWeb(html);
    return { status: 'printed' };
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    return { status: 'shared', uri };
  }
  return { status: 'unavailable', uri };
}
