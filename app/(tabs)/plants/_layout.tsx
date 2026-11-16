import { Stack } from 'expo-router';

export default function PlantsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Plants' }} />
      <Stack.Screen name="[slug]" options={{ title: '' }} />
    </Stack>
  );
}
