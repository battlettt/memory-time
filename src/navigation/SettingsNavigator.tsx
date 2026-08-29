import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { WeeklyReportScreen } from '../screens/settings/WeeklyReportScreen';
import { HandoffSheetScreen } from '../screens/settings/HandoffSheetScreen';
import { stackScreenOptions, pushedScreenOptions } from './stackOptions';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen
        name="WeeklyReport"
        component={WeeklyReportScreen}
        options={{ ...pushedScreenOptions, title: 'This week' }}
      />
      <Stack.Screen
        name="HandoffSheet"
        component={HandoffSheetScreen}
        options={{ ...pushedScreenOptions, title: 'For a new carer' }}
      />
    </Stack.Navigator>
  );
}
