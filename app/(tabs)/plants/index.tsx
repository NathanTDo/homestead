import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, ErrorState, LoadingState, SearchInput } from '@/components/common';
import { PlantCard, YourCrops } from '@/components/plants';
import { View } from '@/components/Themed';
import { useFarm } from '@/features/farm';
import { usePlants } from '@/features/plants';
import type { Plant } from '@/types';

export default function PlantsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { plants, allPlants, loading, error, offline, reload } = usePlants(query);
  const { crops } = useFarm();

  const cropPlants = crops
    .map((crop) => allPlants.find((plant) => plant.id === crop.plant_id))
    .filter((plant): plant is Plant => plant !== undefined);
  const openPlant = (plant: Plant) => router.push(`/plants/${plant.slug}`);

  return (
    // This screen has no header, so it keeps its content below the status bar / notch itself.
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.search}>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Search plants" />
      </View>

      {loading ? (
        <LoadingState message="Loading plants" />
      ) : error ? (
        <ErrorState message="Could not load plants." offline={offline} onRetry={reload} />
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(plant) => plant.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<YourCrops plants={cropPlants} onPressPlant={openPlant} />}
          renderItem={({ item }) => <PlantCard plant={item} onPress={openPlant} />}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              message={query.trim() ? 'No plants match your search' : 'No plants available yet'}
              hint={query.trim() ? 'Try a different name.' : undefined}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { padding: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 8, paddingBottom: 24 },
});
