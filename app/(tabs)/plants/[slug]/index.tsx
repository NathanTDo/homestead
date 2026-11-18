import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';
import { Button } from '@/components/common';
import { PlantImage } from '@/components/plants';
import { Text, View } from '@/components/Themed';
import { MAX_ACTIVE_CROPS, canAddCrop, describeCropError } from '@/features/crops';
import { useFarm } from '@/features/farm';
import { usePlant } from '@/features/plants';
import { formatDate } from '@/utils/dates';
import { palette } from '@/constants/Colors';

export default function PlantDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data: plant, loading, error, reload } = usePlant(slug);
  const { crops, addCrop, removeCrop } = useFarm();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) {
    return <ActivityIndicator color={palette.text} style={styles.center} />;
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

  const crop = crops.find((c) => c.plant_id === plant.id);
  const full = !canAddCrop(crops.length);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
    } catch (e) {
      setActionError(describeCropError(e));
    } finally {
      setBusy(false);
    }
  }

  function confirmRemove() {
    if (!plant || !crop) return;
    Alert.alert('Remove from your farm?', `${plant.name} will be removed from your crops.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => run(() => removeCrop(crop.id)) },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: plant.name }} />
      <View style={styles.image}>
        <PlantImage plant={plant} size={200} />
      </View>
      <Text style={styles.name}>{plant.name}</Text>
      {plant.description ? <Text style={styles.description}>{plant.description}</Text> : null}

      <View style={styles.actions}>
        {crop ? (
          <>
            <Text style={styles.added}>
              {crop.status === 'active' ? 'Schedule created' : 'Added to your farm'}
            </Text>
            {crop.status === 'active' && crop.planting_date ? (
              <Text style={styles.note}>Planting on {formatDate(crop.planting_date)}</Text>
            ) : (
              <Button
                title="Set up schedule"
                onPress={() => router.push(`/plants/${plant.slug}/select-template`)}
              />
            )}
            <Button title="Remove" variant="link" onPress={confirmRemove} loading={busy} />
          </>
        ) : (
          <>
            <Button
              title="Add to farm"
              onPress={() => run(() => addCrop(plant.id))}
              loading={busy}
              disabled={full}
            />
            {full ? (
              <Text style={styles.note}>
                Your farm has {MAX_ACTIVE_CROPS} crops. Remove one to add another.
              </Text>
            ) : null}
          </>
        )}
        {actionError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {actionError}
          </Text>
        ) : null}
      </View>

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
  actions: { marginTop: 24, gap: 8 },
  added: { textAlign: 'center', fontSize: 16, fontWeight: '600' },
  note: { textAlign: 'center', opacity: 0.7 },
  error: { color: palette.danger, textAlign: 'center' },
  heading: { fontSize: 18, fontWeight: '600', marginTop: 28, marginBottom: 6 },
  placeholder: { fontSize: 14, opacity: 0.6, lineHeight: 20 },
});
