import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Button } from '@/components/common';
import { PlantImage } from '@/components/plants';
import { Text, View } from '@/components/Themed';
import { usePlant } from '@/features/plants';

export default function PlantDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: plant, loading, error, reload } = usePlant(slug);

  if (loading) {
    return <ActivityIndicator style={styles.center} />;
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Could not load this plant. Check your connection.</Text>
        <Button title="Try again" onPress={reload} />
      </View>
    );
  }
  if (!plant) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={styles.message}>That plant could not be found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: plant.name }} />
      <View style={styles.image}>
        <PlantImage plant={plant} size={200} />
      </View>
      <Text style={styles.name}>{plant.name}</Text>
      {plant.description ? <Text style={styles.description}>{plant.description}</Text> : null}

      <Text style={styles.heading}>Growing seasons</Text>
      <Text style={styles.placeholder}>
        Growing information will be available when templates are configured.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  message: { textAlign: 'center', opacity: 0.7 },
  content: { padding: 24 },
  image: { alignItems: 'center', marginBottom: 20 },
  name: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  description: { fontSize: 16, lineHeight: 22, opacity: 0.85 },
  heading: { fontSize: 18, fontWeight: '600', marginTop: 28, marginBottom: 6 },
  placeholder: { fontSize: 14, opacity: 0.6, lineHeight: 20 },
});
