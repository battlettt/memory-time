import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { useFamily } from '../../state/FamilyContext';
import { useMemories } from '../../lib/useMemories';
import { useWeeklyReport } from '../../lib/useInsights';
import { BUCKET_LABEL, headlineFor } from '../../lib/insights';
import { colors, iconSize, spacing, typography } from '../../lib/theme';
import type { Memory } from '../../lib/types';

function MemoryList({ memories, empty }: { memories: Memory[]; empty: string }) {
  if (memories.length === 0) return <Text style={typography.caption}>{empty}</Text>;
  return (
    <View style={styles.list}>
      {memories.slice(0, 6).map((m) => (
        <Text key={m.id} style={typography.body} numberOfLines={1}>
          · {m.answer}
        </Text>
      ))}
      {memories.length > 6 && (
        <Text style={typography.caption}>and {memories.length - 6} more</Text>
      )}
    </View>
  );
}

/**
 * The caregiver is doing all the work here and, until now, got nothing back.
 *
 * The headline is deliberately time spent together rather than recall
 * accuracy. Accuracy is the obvious metric and the wrong one to lead with: it
 * turns a degenerative illness into a weekly exam the family is failing, and
 * it will trend down however well anyone does.
 */
export function WeeklyReportScreen() {
  const { current } = useFamily();
  const { memories } = useMemories(current?.family.id ?? null);
  const { report, loading } = useWeeklyReport(current?.family.id ?? null, memories);

  const name = current?.family.care_recipient_name ?? 'them';

  if (loading || !report) {
    return (
      <Screen>
        <Text style={typography.body}>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="This week" subtitle="Yours to keep, or to send on to the family." />

      <Card elevation="raised" style={styles.headline}>
        <Text style={typography.serifLarge}>{headlineFor(report, name)}</Text>
        {report.sessionCount > 0 && (
          <Text style={typography.subtext}>
            {report.sessionCount} {report.sessionCount === 1 ? 'session' : 'sessions'} ·{' '}
            {report.memoriesPractised}{' '}
            {report.memoriesPractised === 1 ? 'memory' : 'memories'} came up
          </Text>
        )}
      </Card>

      {report.timeOfDay && (
        <Card style={styles.finding}>
          <Ionicons name="sunny-outline" size={iconSize.md} color={colors.accentStrong} />
          <View style={styles.findingText}>
            <Text style={typography.bodyStrong}>
              {name} does better {BUCKET_LABEL[report.timeOfDay.bucket]}
            </Text>
            <Text style={typography.caption}>
              {Math.round(report.timeOfDay.accuracy * 100)}% recalled{' '}
              {BUCKET_LABEL[report.timeOfDay.bucket]} against{' '}
              {Math.round(report.timeOfDay.comparedAccuracy * 100)}%{' '}
              {BUCKET_LABEL[report.timeOfDay.comparedWith]}, over{' '}
              {report.timeOfDay.sample} answers. Worth trying sessions then.
            </Text>
          </View>
        </Card>
      )}

      <Card style={styles.section}>
        <Text style={typography.label}>HOLDING WELL</Text>
        <MemoryList
          memories={report.holding}
          empty="Nothing has reached a long interval yet. That takes a few weeks."
        />
      </Card>

      <Card style={styles.section}>
        <Text style={typography.label}>SLIPPING</Text>
        <Text style={typography.caption}>
          Missed more than once lately. Adding a photo or a voice note often helps more than
          practising harder.
        </Text>
        <MemoryList memories={report.slipping} empty="Nothing is slipping just now." />
      </Card>

      {report.resting.length > 0 && (
        <Card style={styles.section}>
          <Text style={typography.label}>RESTING</Text>
          <Text style={typography.caption}>
            These stopped being asked after several hard sessions. They're still in the album, and
            you can start any of them again from its page.
          </Text>
          <MemoryList memories={report.resting} empty="" />
        </Card>
      )}

      <Card style={styles.section}>
        <Text style={typography.label}>ADDED THIS WEEK</Text>
        <MemoryList
          memories={report.added}
          empty="Nothing new this week — the daily question is the easiest way in."
        />
      </Card>

      {report.sessionCount === 0 && report.added.length === 0 && (
        <EmptyState
          icon="calendar-outline"
          title="A quiet week"
          body={`Nothing is lost by missing a week — everything keeps its place in the schedule and comes back around when it's due.`}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { padding: spacing.lg, gap: spacing.xs },
  finding: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoft,
  },
  findingText: { flex: 1, gap: 2 },
  section: { padding: spacing.md, gap: spacing.xs },
  list: { gap: 2, marginTop: spacing.xs },
});
