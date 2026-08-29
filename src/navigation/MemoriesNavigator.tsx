import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MemoriesHomeScreen } from '../screens/memories/MemoriesHomeScreen';
import { TopicPromptsScreen } from '../screens/memories/TopicPromptsScreen';
import { AddMemoryScreen } from '../screens/memories/AddMemoryScreen';
import { MemoryDetailScreen } from '../screens/memories/MemoryDetailScreen';
import { ImportPhotosScreen } from '../screens/memories/ImportPhotosScreen';
import { stackScreenOptions, pushedScreenOptions } from './stackOptions';
import type { MemoriesStackParamList } from './types';

const Stack = createNativeStackNavigator<MemoriesStackParamList>();

export function MemoriesNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="MemoriesHome" component={MemoriesHomeScreen} />
      <Stack.Screen
        name="TopicPrompts"
        component={TopicPromptsScreen}
        options={{ ...pushedScreenOptions, title: 'Topic ideas' }}
      />
      <Stack.Screen
        name="AddMemory"
        component={AddMemoryScreen}
        options={{ ...pushedScreenOptions, title: 'Add a memory' }}
      />
      <Stack.Screen
        name="MemoryDetail"
        component={MemoryDetailScreen}
        options={{ ...pushedScreenOptions, title: 'Memory' }}
      />
      <Stack.Screen
        name="ImportPhotos"
        component={ImportPhotosScreen}
        options={{ ...pushedScreenOptions, title: 'Add from photos' }}
      />
    </Stack.Navigator>
  );
}
