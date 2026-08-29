import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors, fonts } from '../lib/theme';

// Shared so pushed screens don't drop back to the default white/system-font
// header, which broke the warm ground the rest of the app sits on.
export const stackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
};

export const pushedScreenOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerTintColor: colors.primary,
  headerTitleStyle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  contentStyle: { backgroundColor: colors.background },
};
