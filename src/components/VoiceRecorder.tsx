import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { PrimaryButton } from './PrimaryButton';
import { useLiveTranscription } from '../lib/transcription';
import { useT } from '../lib/i18n';
import { colors, iconSize, radius, spacing, typography } from '../lib/theme';

interface Props {
  uri: string | null;
  onChange: (uri: string | null) => void;
  /**
   * Called once with the finished transcript, where speech recognition is
   * available. The recording is always the primary artefact — this just saves
   * the contributor writing the same thing out twice.
   */
  onTranscript?: (text: string) => void;
  /** BCP-47, so a memory recorded in Punjabi is transcribed as Punjabi. */
  lang?: string;
}

export function VoiceRecorder({ uri, onChange, onTranscript, lang }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const t = useT();
  const transcription = useLiveTranscription(lang || 'en-GB');

  const start = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(rec);
    setIsRecording(true);
    // Best effort. If recognition refuses to start, the recording carries on
    // regardless — losing the transcript is a nuisance, losing the audio is not.
    if (onTranscript) transcription.start();
  };

  const stop = async () => {
    if (!recording) return;
    const finalText = transcription.stop();
    await recording.stopAndUnloadAsync();
    const resultUri = recording.getURI();
    setRecording(null);
    setIsRecording(false);
    if (resultUri) onChange(resultUri);
    if (finalText && onTranscript) onTranscript(finalText);
  };

  const statusColor = isRecording ? colors.destructive : uri ? colors.success : colors.subtext;
  const showLive = isRecording && !!transcription.transcript;

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
{isRecording ? t('recorder.recording') : uri ? t('recorder.saved') : t('recorder.label')}
          </Text>
          {!uri && !isRecording && (
            <Text style={typography.caption}>
{t('recorder.hint')}
            </Text>
          )}
        </View>
      </View>

      {showLive && (
        <View style={styles.live}>
          <Text style={typography.caption}>{t('recorder.live')}</Text>
          <Text style={typography.body}>{transcription.transcript}</Text>
        </View>
      )}

      <PrimaryButton
label={isRecording ? t('recorder.stop') : uri ? t('recorder.again') : t('recorder.start')}
        icon={isRecording ? 'stop' : 'mic'}
        variant="secondary"
        onPress={isRecording ? stop : start}
      />
      {uri && !isRecording && (
        <PrimaryButton label={t('recorder.remove')} variant="ghost" onPress={() => onChange(null)} />
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
  live: {
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
});
