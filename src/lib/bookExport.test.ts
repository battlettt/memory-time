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
});
