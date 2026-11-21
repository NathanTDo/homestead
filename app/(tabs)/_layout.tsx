import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { palette } from '@/constants/Colors';
import { MAX_ACTIVE_CROPS } from '@/features/crops';
import { FarmProvider, useFarm } from '@/features/farm';

export default function TabLayout() {
  return (
    <FarmProvider>
      <TabsNavigator />
    </FarmProvider>
  );
}

function TabsNavigator() {
  const { crops } = useFarm();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
        tabBarBadgeStyle: { backgroundColor: palette.accent, color: palette.onAccent },
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          headerShown: false, // the nested stack in calendar/ draws its own header
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={26}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: 'Plants',
          headerShown: false, // the nested stack in plants/ draws its own header
          tabBarBadge: crops.length > 0 ? `${crops.length}/${MAX_ACTIVE_CROPS}` : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={26} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={26}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}
