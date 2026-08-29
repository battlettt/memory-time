import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LifeStoryHomeScreen } from '../screens/lifestory/LifeStoryHomeScreen';
import { EditSectionScreen } from '../screens/lifestory/EditSectionScreen';
import { stackScreenOptions, pushedScreenOptions } from './stackOptions';
import type { LifeStoryStackParamList } from './types';

const Stack = createNativeStackNavigator<LifeStoryStackParamList>();

export function LifeStoryNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="LifeStoryHome" component={LifeStoryHomeScreen} />
      <Stack.Screen
        name="EditSection"
        component={EditSectionScreen}
        options={{ ...pushedScreenOptions, title: 'Chapter' }}
      />
    </Stack.Navigator>
  );
}
