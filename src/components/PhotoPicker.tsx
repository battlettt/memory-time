import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, iconSize, radius, spacing, typography } from '../lib/theme';

interface Props {
  uri: string | null;
  onChange: (uri: string | null) => void;
}

export function PhotoPicker({ uri, onChange }: Props) {
  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.box, uri && styles.boxFilled, pressed && styles.pressed]}
        onPress={pick}
        accessibilityRole="button"
        accessibilityLabel={uri ? 'Change photo' : 'Add a photo'}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderWrap}>
            <Ionicons name="image-outline" size={iconSize.xl} color={colors.primary} />
            <Text style={typography.bodyStrong}>Add a photo</Text>
            <Text style={typography.caption}>A face makes a memory much easier to place</Text>
          </View>
        )}
      </Pressable>
      {uri && (
        <Pressable
          onPress={() => onChange(null)}
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
          hitSlop={10}
          style={styles.remove}
        >
          <Ionicons name="close" size={iconSize.sm} color={colors.onPrimary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  box: {
    height: 200,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  boxFilled: { borderStyle: 'solid', borderColor: colors.border },
  pressed: { opacity: 0.85 },
  placeholderWrap: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg },
  preview: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(34,32,29,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
