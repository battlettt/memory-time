import { buildBookHtml } from './bookExport';
import type { LifeStorySection, Memory } from './types';

const section = (key: string, content: string) =>
  ({
    id: key,
    family_id: 'f',
    section_key: key,
    title: key,
    content,
    photo_path: null,
    photo_url: null,
    added_by: 'm1',
    updated_at: new Date().toISOString(),
  }) as LifeStorySection;

const input = {
  familyName: 'The Whitfield Family',
  careRecipientName: 'Grandma Rose',
  nameFor: () => 'Sarah',
  // No photo_url, so nothing is fetched and the test stays offline.
  memories: [] as Memory[],
  sections: [
    section('early_life', 'She grew up above the shop.\n\nThere were four of them.'),
    section('career', 'Thirty-two years at St. Mary’s.'),
  ],
};

describe('buildBookHtml', () => {
  it('puts the person on the cover, not the app', async () => {
    const html = await buildBookHtml(input);
    expect(html).toContain('<h1>Grandma Rose</h1>');
    expect(html).toContain('Collected by The Whitfield Family');
  });

  it('includes written chapters in reading order', async () => {
    const html = await buildBookHtml(input);
    expect(html.indexOf('Childhood')).toBeLessThan(html.indexOf('Career'));
  });

  it('turns blank lines into separate paragraphs', async () => {
    const html = await buildBookHtml(input);
    expect(html).toContain('<p>She grew up above the shop.</p>');
    expect(html).toContain('<p>There were four of them.</p>');
  });

  it('leaves out chapters nobody has written', async () => {
    const html = await buildBookHtml({
      ...input,
      sections: [...input.sections, section('stories', '   ')],
    });
    expect(html).not.toContain('Notable stories');
  });

  it('escapes text rather than letting it become markup', async () => {
    const html = await buildBookHtml({
      ...input,
      sections: [section('early_life', 'Bread & butter <always>')],
    });
    expect(html).toContain('Bread &amp; butter &lt;always&gt;');
    expect(html).not.toContain('<always>');
  });

  it('produces a standalone document with no external references', async () => {
    const html = await buildBookHtml(input);
    // A book full of links that expire in an hour would be worse than none.
    expect(html).not.toMatch(/src="https?:/);
    expect(html).not.toMatch(/<link|<script/);
  });

  it('numbers the chapters', async () => {
    const html = await buildBookHtml(input);
    expect(html).toContain('Chapter 1');
    expect(html).toContain('Chapter 2');
  });

  it('opens with an epigraph rather than straight into text', async () => {
    const html = await buildBookHtml(input);
    expect(html).toContain('These are the things we did not want to lose');
  });

  it('names the people who contributed', async () => {
    // The point of the closing page: this is a family's collective work,
    // not an export from an app.
    const html = await buildBookHtml({
      ...input,
      memories: [
        { id: '1', added_by: 'm1', photo_url: null },
        { id: '2', added_by: 'm2', photo_url: null },
      ] as Memory[],
      nameFor: (id) => (id === 'm1' ? 'Sarah' : 'Michael'),
    });
    expect(html).toContain('Remembered by');
    expect(html).toContain('Sarah');
    expect(html).toContain('Michael');
  });

  it('does not list unknown contributors by their placeholder', async () => {
    const html = await buildBookHtml({
      ...input,
      memories: [{ id: '1', added_by: null, photo_url: null }] as Memory[],
      nameFor: () => 'A family member',
    });
    expect(html).not.toContain('A family member');
  });

  it('has no cover portrait when there are no photographs', async () => {
    const html = await buildBookHtml(input);
    expect(html).not.toContain('class="portrait"');
  });

  it('keeps the drop cap in CSS so paragraphs stay plain markup', async () => {
    const html = await buildBookHtml(input);
    expect(html).toContain('::first-letter');
    expect(html).toContain('<p>She grew up above the shop.</p>');
  });
});
