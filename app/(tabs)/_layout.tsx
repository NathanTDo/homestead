import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
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
  const colorScheme = useColorScheme();
  const { crops } = useFarm();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: 'Plants',
          headerShown: false, // the nested stack in plants/ draws its own header
          tabBarBadge: crops.length > 0 ? `${crops.length}/${MAX_ACTIVE_CROPS}` : undefined,
          tabBarIcon: ({ color }) => <Ionicons name="leaf" size={24} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
