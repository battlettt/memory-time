import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useT } from '../lib/i18n';
import { colors, iconSize, minTapTarget, radius, spacing, typography } from '../lib/theme';

interface Props {
  uri: string;
  /** Who recorded it, so the listener knows whose voice they're about to hear. */
  attribution?: string;
}

/**
 * Plays a family member's recorded voice note.
 *
 * A familiar voice is a stronger retrieval cue than written text for someone
 * with memory impairment, which is the whole reason voice notes exist here —
 * so playback belongs anywhere an answer is revealed or browsed.
 */
export function VoicePlayer({ uri, attribution }: Props) {
  const t = useT();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Unload on unmount, otherwise audio keeps playing after leaving the screen.
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  // A new memory means a new clip; drop the old one.
  useEffect(() => {
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setPlaying(false);
  }, [uri]);

  const toggle = async () => {
    try {
      if (soundRef.current) {
        if (playing) {
          await soundRef.current.pauseAsync();
          setPlaying(false);
        } else {
          await soundRef.current.replayAsync();
          setPlaying(true);
        }
        return;
      }

      setLoading(true);
      // Play through the ringer switch — an elder holding the tablet should
      // not get silence because a silent-mode toggle was flipped weeks ago.
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setPlaying(false);
      });
      setPlaying(true);
      setFailed(false);
    } catch {
      // Say so rather than leaving a button that looks fine and does nothing.
      setPlaying(false);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        playing
          ? t('voice.a11yPause')
          : t('voice.a11yPlay', { name: attribution ?? t('common.aFamilyMember') })
      }
      onPress={toggle}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <View style={[styles.icon, failed && styles.iconFailed]}>
        {loading ? (
          <ActivityIndicator color={colors.onAccent} size="small" />
        ) : (
          <Ionicons
            name={failed ? 'alert-circle-outline' : playing ? 'pause' : 'play'}
            size={iconSize.md}
            color={colors.onAccent}
          />
        )}
      </View>
      <View style={styles.text}>
        <Text style={typography.bodyStrong}>
{failed ? t('voice.failed') : playing ? t('voice.playing') : t('voice.play')}
        </Text>
        {failed ? (
          <Text style={typography.caption}>{t('voice.retry')}</Text>
        ) : (
          attribution && (
            <Text style={typography.caption}>
              {t('voice.recordedBy', { name: attribution })}
            </Text>
          )
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTapTarget,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFailed: { backgroundColor: colors.destructive },
  text: { flex: 1, gap: 1 },
});
