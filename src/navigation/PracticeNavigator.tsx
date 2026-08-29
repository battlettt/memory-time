import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PracticeHomeScreen } from '../screens/practice/PracticeHomeScreen';
import { SessionScreen } from '../screens/practice/SessionScreen';
import { stackScreenOptions, pushedScreenOptions } from './stackOptions';
import type { PracticeStackParamList } from './types';

const Stack = createNativeStackNavigator<PracticeStackParamList>();

export function PracticeNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="PracticeHome" component={PracticeHomeScreen} />
      <Stack.Screen
        name="Session"
        component={SessionScreen}
        options={{ ...pushedScreenOptions, title: 'Session' }}
      />
    </Stack.Navigator>
  );
}
