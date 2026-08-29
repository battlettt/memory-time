import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { saveElderRecording } from '../lib/elderRecordings';
import { colors, iconSize, minTapTarget, radius, spacing, typography } from '../lib/theme';

interface Props {
  familyId: string;
  memoryId: string;
  /** Shown in the idle label, e.g. "Record Rose telling it". */
  personName: string;
}

type State = 'idle' | 'recording' | 'saving' | 'saved' | 'failed';

/**
 * Capture the person's own telling, during a session.
 *
 * Deliberately small and off to one side: the session belongs to the two
 * people having it, and a prominent record button would turn a quiet moment
 * into a performance. It is here because this is where they are already
 * talking about their own life.
 */
export function ElderAnswerRecorder({ familyId, memoryId, personName }: Props) {
  const [state, setState] = useState<State>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

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
    if (!recording) return;
    setState('saving');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('nothing recorded');
      await saveElderRecording({ familyId, memoryId, localUri: uri });
      setState('saved');
    } catch {
      setRecording(null);
      setState('failed');
    }
  };

  const label = {
    idle: `Record ${personName} telling it`,
    recording: 'Recording — tap to stop',
    saving: 'Saving…',
    saved: 'Saved in their own voice',
    failed: "Couldn't save that — tap to retry",
  }[state];

  const icon = {
    idle: 'mic-outline',
    recording: 'stop-circle',
    saving: 'ellipsis-horizontal',
    saved: 'checkmark-circle',
    failed: 'alert-circle-outline',
  }[state] as keyof typeof Ionicons.glyphMap;

  const tint =
    state === 'recording'
      ? colors.destructive
      : state === 'saved'
        ? colors.success
        : state === 'failed'
          ? colors.destructive
          : colors.subtext;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={state === 'recording' ? stop : state === 'saving' ? undefined : start}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={iconSize.md} color={tint} />
      <Text style={[typography.caption, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: minTapTarget,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  pressed: { opacity: 0.7 },
});
