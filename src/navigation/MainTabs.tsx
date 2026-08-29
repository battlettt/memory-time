import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PracticeNavigator } from './PracticeNavigator';
import { MemoriesNavigator } from './MemoriesNavigator';
import { OnThisDayScreen } from '../screens/onthisday/OnThisDayScreen';
import { LifeStoryNavigator } from './LifeStoryNavigator';
import { SettingsNavigator } from './SettingsNavigator';
import { colors, fonts } from '../lib/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<keyof MainTabParamList, { active: IoniconName; inactive: IoniconName }> = {
  PracticeTab: { active: 'today', inactive: 'today-outline' },
  MemoriesTab: { active: 'albums', inactive: 'albums-outline' },
  OnThisDayTab: { active: 'images', inactive: 'images-outline' },
  LifeStoryTab: { active: 'book', inactive: 'book-outline' },
  SettingsTab: { active: 'settings', inactive: 'settings-outline' },
};

// "Today" and "Album" replace "Practice" and "Browse": the first names the
// daily ritual rather than the drill, and the second stops two separate tabs
// from both presenting themselves as "Memories".
export function MainTabs() {
  const insets = useSafeAreaInsets();

  // The bar is sized explicitly from the safe-area inset. A bare fixed height
  // clipped the labels on devices with a home indicator; omitting height
  // entirely dropped them altogether. Measuring the inset handles both.
  const barHeight = 58 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: barHeight,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
        tabBarIcon: ({ focused, color }) => (
          <Ionicons
            name={focused ? ICONS[route.name].active : ICONS[route.name].inactive}
            size={23}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="PracticeTab" component={PracticeNavigator} options={{ title: 'Today' }} />
      <Tab.Screen name="MemoriesTab" component={MemoriesNavigator} options={{ title: 'Memories' }} />
      <Tab.Screen name="OnThisDayTab" component={OnThisDayScreen} options={{ title: 'Album' }} />
      <Tab.Screen name="LifeStoryTab" component={LifeStoryNavigator} options={{ title: 'Story' }} />
      <Tab.Screen name="SettingsTab" component={SettingsNavigator} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}
