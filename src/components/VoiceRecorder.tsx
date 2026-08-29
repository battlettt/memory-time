import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { PrimaryButton } from './PrimaryButton';
import { colors, iconSize, radius, spacing, typography } from '../lib/theme';

interface Props {
  uri: string | null;
  onChange: (uri: string | null) => void;
}

export function VoiceRecorder({ uri, onChange }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const start = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(rec);
    setIsRecording(true);
  };

  const stop = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const resultUri = recording.getURI();
    setRecording(null);
    setIsRecording(false);
    if (resultUri) onChange(resultUri);
  };

  const statusColor = isRecording
    ? colors.destructive
    : uri
      ? colors.success
      : colors.subtext;

  return (
    <View style={styles.container}>
      <View style={[styles.statusRow, isRecording && styles.statusRecording]}>
        <Ionicons
          name={isRecording ? 'radio-button-on' : uri ? 'checkmark-circle' : 'mic-outline'}
          size={iconSize.md}
          color={statusColor}
        />
        <View style={styles.statusText}>
          <Text style={typography.bodyStrong}>
            {isRecording ? 'Recording…' : uri ? 'Voice note saved' : 'Voice note'}
          </Text>
          {!uri && !isRecording && (
            <Text style={typography.caption}>
              Optional — a familiar voice is a stronger cue than text
            </Text>
          )}
        </View>
      </View>
      <PrimaryButton
        label={isRecording ? 'Stop recording' : uri ? 'Record again' : 'Record a voice note'}
        icon={isRecording ? 'stop' : 'mic'}
        variant="secondary"
        onPress={isRecording ? stop : start}
      />
      {uri && !isRecording && (
        <PrimaryButton label="Remove voice note" variant="ghost" onPress={() => onChange(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  statusRecording: { backgroundColor: colors.destructiveSoft },
  statusText: { flex: 1, gap: 1 },
});
