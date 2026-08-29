import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../state/AuthContext';
import { useFamily } from '../state/FamilyContext';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { FamilySetupScreen } from '../screens/auth/FamilySetupScreen';
import { MainTabs } from './MainTabs';
import { colors } from '../lib/theme';

export function RootNavigator() {
  const { session, loading: authLoading } = useAuth();
  const { current, loading: familyLoading } = useFamily();

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
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
}
