import { useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible';
import { Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { AuthProvider } from './src/state/AuthContext';
import { FamilyProvider } from './src/state/FamilyContext';
import { ElderModeProvider } from './src/state/ElderModeContext';
import { FamilySettingsProvider } from './src/lib/useFamilySettings';
import { I18nProvider } from './src/lib/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { colors } from './src/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    Lora_600SemiBold,
    Lora_700Bold,
  });

  const onLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayout}>
        <ErrorBoundary>
          {/* Outermost of the app providers: the sign-in and error screens
              need translating too, and none of this depends on a session. */}
          <I18nProvider>
            <AuthProvider>
              <FamilyProvider>
                <FamilySettingsProvider>
                  <ElderModeProvider>
                    <RootNavigator />
                    <StatusBar style="dark" />
                  </ElderModeProvider>
                </FamilySettingsProvider>
              </FamilyProvider>
            </AuthProvider>
          </I18nProvider>
        </ErrorBoundary>
      </View>
    </SafeAreaProvider>
  );
}
