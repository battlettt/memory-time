import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../state/AuthContext';
import { useFamily } from '../state/FamilyContext';
import { useElderMode } from '../state/ElderModeContext';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { FamilySetupScreen } from '../screens/auth/FamilySetupScreen';
import { ElderModeScreen } from '../screens/elder/ElderModeScreen';
import { MainTabs } from './MainTabs';
import { colors } from '../lib/theme';

export function RootNavigator() {
  const { session, loading: authLoading } = useAuth();
  const { current, loading: familyLoading } = useFamily();
  const { active: elderMode } = useElderMode();

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!session ? (
        <SignInScreen />
      ) : familyLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !current ? (
        <FamilySetupScreen />
      ) : elderMode ? (
        // Replaces the tab navigator outright. A lock you can tap past is not
        // a lock, and the whole point is that the device can be handed over.
        <ElderModeScreen />
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
}
