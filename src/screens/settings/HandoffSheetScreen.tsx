import React, { useMemo, useState } from 'react';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState } from '../../components/EmptyState';
import { useFamily } from '../../state/FamilyContext';
import { useMemories } from '../../lib/useMemories';
import { useLifeStory } from '../../lib/useLifeStory';
import { languageLabel } from '../../lib/languages';
import { TOPIC_LABELS, type LifeStorySectionKey } from '../../lib/types';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';

/**
 * One page for whoever is looking after them next.
 *
 * Paid carers and care-home staff rotate constantly and arrive knowing
 * nothing — not what she likes to be called, not that her husband died in
 * 2019 and asking after him lands badly, not that she settles when you put
 * the radio on. The family knows all of it and has nowhere to put it, and
 * ends up repeating it to a new face every fortnight.
 *
 * Everything here is assembled from what the family has already written, so
 * it costs them nothing extra to produce.
 */
const SHEET_ORDER: LifeStorySectionKey[] = [
  'personality',
  'favorites',
  'family',
  'career',
  'early_life',
  'stories',
];

export function HandoffSheetScreen() {
  const { current } = useFamily();
  const { memories } = useMemories(current?.family.id ?? null);
  const { sections } = useLifeStory(current?.family.id ?? null);
  const [copied, setCopied] = useState(false);

  const name = current?.family.care_recipient_name ?? 'them';

  const anchors = useMemo(() => memories.filter((m) => m.is_anchor), [memories]);
  const languages = useMemo(
    () => Array.from(new Set(memories.map((m) => m.language).filter(Boolean))) as string[],
    [memories]
  );

  const written = SHEET_ORDER.map((key) => ({
    key,
    section: sections.find((s) => s.section_key === key && s.content.trim()),
  })).filter((x) => x.section);

  const plainText = useMemo(() => {
    const lines: string[] = [`About ${name}`, ''];

    if (anchors.length > 0) {
      lines.push('The people who matter most:');
      anchors.forEach((a) => lines.push(`  · ${a.answer}`));
      lines.push('');
    }

    if (languages.length > 0) {
      lines.push(
        `${name} may return to ${languages.map((l) => languageLabel(l)).join(' or ')}. Family recordings in that language are in the app.`,
        ''
      );
    }

    written.forEach(({ key, section }) => {
      lines.push(`${TOPIC_LABELS[key]}:`);
      lines.push(`  ${section!.content.trim().replace(/\n+/g, '\n  ')}`);
      lines.push('');
    });

    lines.push(
      'If a name or a date comes out wrong, let it go. Correcting costs more',
      'than the mistake — going along with it keeps the conversation, and the',
      'conversation is the point.'
    );

    return lines.join('\n');
  }, [name, anchors, languages, written]);

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Share.share({ message: plainText, title: `About ${name}` });
        return;
      } catch {
        /* fall through to copying */
      }
    }
    await Clipboard.setStringAsync(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (written.length === 0 && anchors.length === 0) {
    return (
      <Screen>
        <ScreenHeader title={`About ${name}`} />
        <EmptyState
          icon="document-text-outline"
          title="Nothing to hand over yet"
          body={`Write a chapter or two of ${name}'s story, or mark a few memories as always-ask, and this page assembles itself from those.`}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title={`About ${name}`}
        subtitle="For a new carer, a respite stay, or a hospital admission."
      />

      {anchors.length > 0 && (
        <Card style={styles.section}>
          <Text style={typography.label}>THE PEOPLE WHO MATTER MOST</Text>
          {anchors.map((a) => (
            <Text key={a.id} style={typography.body}>
              · {a.answer}
            </Text>
          ))}
        </Card>
      )}

      {languages.length > 0 && (
        <Card style={styles.language}>
          <Ionicons name="language-outline" size={iconSize.md} color={colors.accentStrong} />
          <Text style={[typography.body, styles.languageText]}>
            {name} may return to {languages.map((l) => languageLabel(l)).join(' or ')}. There are
            family recordings in the app.
          </Text>
        </Card>
      )}

      {written.map(({ key, section }) => (
        <Card key={key} style={styles.section}>
          <Text style={typography.label}>{TOPIC_LABELS[key].toUpperCase()}</Text>
          <Text style={typography.body}>{section!.content.trim()}</Text>
        </Card>
      ))}

      <Card style={styles.advice}>
        <Ionicons name="heart-outline" size={iconSize.md} color={colors.primary} />
        <Text style={[typography.body, styles.languageText]}>
          If a name or a date comes out wrong, let it go. Correcting costs more than the mistake —
          going along with it keeps the conversation, and the conversation is the point.
        </Text>
      </Card>

      <PrimaryButton
        label={copied ? 'Copied' : Platform.OS === 'web' ? 'Copy this page' : 'Send this page'}
        icon={copied ? 'checkmark' : 'share-outline'}
        onPress={handleShare}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { padding: spacing.md, gap: spacing.xs },
  language: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoft,
  },
  languageText: { flex: 1 },
  advice: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
    borderRadius: radius.lg,
  },
});
