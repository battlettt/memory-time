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
import { useI18n, useT } from '../../lib/i18n';
import { colors, iconSize, spacing, typography } from '../../lib/theme';
import type { Memory } from '../../lib/types';

function MemoryList({ memories, empty }: { memories: Memory[]; empty: string }) {
  const t = useT();
  if (memories.length === 0) return <Text style={typography.caption}>{empty}</Text>;
  return (
    <View style={styles.list}>
      {memories.slice(0, 6).map((m) => (
        <Text key={m.id} style={typography.body} numberOfLines={1}>
          · {m.answer}
        </Text>
      ))}
      {memories.length > 6 && (
        <Text style={typography.caption}>{t('report.andMore', { count: memories.length - 6 })}</Text>
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
  const { t, tCount } = useI18n();
  const { memories } = useMemories(current?.family.id ?? null);
  const { report, loading } = useWeeklyReport(current?.family.id ?? null, memories);

  const name = current?.family.care_recipient_name ?? 'them';

  if (loading || !report) {
    return (
      <Screen>
        <Text style={typography.body}>{t('common.loading')}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={t('report.title')} subtitle={t('report.subtitle')} />

      <Card elevation="raised" style={styles.headline}>
        <Text style={typography.serifLarge}>
          {report.sessionCount === 0
            ? t('report.noSessions')
            : report.minutesTogether < 1
              ? tCount('report.sessions', report.sessionCount, { name })
              : tCount('report.minutes', report.minutesTogether, { name })}
        </Text>
        {report.sessionCount > 0 && (
          <Text style={typography.subtext}>
{t('report.sessionLine', {
              sessions: tCount('report.sessionCount', report.sessionCount),
              memories: tCount('report.memoryCount', report.memoriesPractised),
            })}
          </Text>
        )}
      </Card>

      {report.timeOfDay && (
        <Card style={styles.finding}>
          <Ionicons name="sunny-outline" size={iconSize.md} color={colors.accentStrong} />
          <View style={styles.findingText}>
            <Text style={typography.bodyStrong}>
{t('report.timeOfDay', { name, bucket: t(`report.bucket.${report.timeOfDay.bucket}` as never) })}
            </Text>
            <Text style={typography.caption}>
{t('report.timeOfDayBody', {
                best: Math.round(report.timeOfDay.accuracy * 100),
                bucket: t(`report.bucket.${report.timeOfDay.bucket}` as never),
                other: Math.round(report.timeOfDay.comparedAccuracy * 100),
                otherBucket: t(`report.bucket.${report.timeOfDay.comparedWith}` as never),
                sample: report.timeOfDay.sample,
              })}
            </Text>
          </View>
        </Card>
      )}

      <Card style={styles.section}>
        <Text style={typography.label}>{t('report.holding')}</Text>
        <MemoryList
          memories={report.holding}
          empty={t('report.holdingEmpty')}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={typography.label}>{t('report.slipping')}</Text>
        <Text style={typography.caption}>
{t('report.slippingBody')}
        </Text>
        <MemoryList memories={report.slipping} empty={t('report.slippingEmpty')} />
      </Card>

      {report.resting.length > 0 && (
        <Card style={styles.section}>
          <Text style={typography.label}>{t('report.resting')}</Text>
          <Text style={typography.caption}>
{t('report.restingBody')}
          </Text>
          <MemoryList memories={report.resting} empty="" />
        </Card>
      )}

      <Card style={styles.section}>
        <Text style={typography.label}>{t('report.added')}</Text>
        <MemoryList
          memories={report.added}
          empty={t('report.addedEmpty')}
        />
      </Card>

      {report.sessionCount === 0 && report.added.length === 0 && (
        <EmptyState
          icon="calendar-outline"
          title={t('report.quiet.title')}
          body={t('report.quiet.body')}
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
