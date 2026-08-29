import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useFamily } from '../../state/FamilyContext';
import { addMemory } from '../../lib/useMemories';
import { saveElderRecording } from '../../lib/elderRecordings';
import { supabase } from '../../lib/supabase';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { PracticeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PracticeStackParamList, 'Grandchild'>;

/**
 * A job for a grandchild.
 *
 * Children are the most willing recorders in any family and the least
 * self-conscious about asking, and older people answer them differently —
 * more patiently, and usually at greater length. This turns "go and talk to
 * your grandmother" from a chore into something with a task attached.
 *
 * The questions are theirs to ask out loud, so they are written to be read
 * aloud by an eight-year-old.
 */
const KID_QUESTIONS = [
  'What did you play when you were my age?',
  'Did you ever get in trouble at school?',
  'What was your favourite dinner when you were little?',
  'Did you have a pet? What was it called?',
  'What was the best present you ever got?',
  'Were you ever really scared of something?',
  'What did your mum shout when she wanted you home?',
  'What is the funniest thing that ever happened to you?',
  'Did you have a best friend? What did you do together?',
  'What is something you were really good at?',
  'What did music sound like when you were young?',
  'What is the furthest you ever travelled?',
];

type State = 'ready' | 'recording' | 'saving' | 'saved' | 'failed';

export function GrandchildScreen({ navigation }: Props) {
  const { current } = useFamily();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * KID_QUESTIONS.length));
  const [state, setState] = useState<State>('ready');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const question = KID_QUESTIONS[index];
  const name = current?.family.care_recipient_name ?? 'them';
  const asked = useMemo(() => new Set<number>(), []);

  const nextQuestion = () => {
    asked.add(index);
    let next = index;
    for (let i = 0; i < 20 && (next === index || asked.has(next)); i += 1) {
      next = Math.floor(Math.random() * KID_QUESTIONS.length);
    }
    setIndex(next);
    setState('ready');
  };

  const start = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setState('recording');
    } catch {
      setState('failed');
    }
  };

  const stop = async () => {
    if (!recording || !current) return;
    setState('saving');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('nothing recorded');

      await addMemory({
        familyId: current.family.id,
        memberId: current.member.id,
        category: 'identity',
        question,
        answer: `${name} answered this one out loud.`,
        source: 'app',
        needsReview: true,
      });

      const { data: saved } = await supabase
        .from('memories')
        .select('id')
        .eq('family_id', current.family.id)
        .eq('question', question)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (saved?.id) {
        await saveElderRecording({
          familyId: current.family.id,
          memoryId: saved.id,
          localUri: uri,
        });
      }
      setState('saved');
    } catch {
      setRecording(null);
      setState('failed');
    }
  };

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={typography.label}>ASK {name.toUpperCase()}</Text>
        <Text style={typography.subtext}>
          Read the question out loud, press the big button, and let them answer.
        </Text>
      </View>

      <Card style={styles.questionCard}>
        <Text style={typography.title}>{question}</Text>
      </Card>

      {state === 'saved' ? (
        <Card style={styles.done}>
          <Ionicons name="checkmark-circle" size={iconSize.xl} color={colors.success} />
          <Text style={typography.serifLarge}>Saved</Text>
          <Text style={[typography.body, styles.centered]}>
            That's now kept in {name}'s own voice. The whole family can hear it.
          </Text>
        </Card>
      ) : (
        <PrimaryButton
          label={
            state === 'recording'
              ? 'Stop — they finished'
              : state === 'saving'
                ? 'Saving…'
                : state === 'failed'
                  ? "That didn't work — try again"
                  : 'Start recording'
          }
          icon={state === 'recording' ? 'stop' : 'mic'}
          variant={state === 'recording' ? 'success' : 'primary'}
          loading={state === 'saving'}
          onPress={state === 'recording' ? stop : start}
        />
      )}

      <PrimaryButton
        label="Ask a different question"
        icon="shuffle"
        variant="secondary"
        onPress={nextQuestion}
      />
      <PrimaryButton label="All done" variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  questionCard: {
    padding: spacing.xl,
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoft,
    borderRadius: radius.xl,
  },
  done: { padding: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  centered: { textAlign: 'center' },
});
