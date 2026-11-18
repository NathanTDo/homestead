import { Stack } from 'expo-router';

export default function PlantsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[slug]/index" options={{ title: '' }} />
      <Stack.Screen name="[slug]/select-template" options={{ title: 'Choose a Season' }} />
    </Stack>
  );
}
