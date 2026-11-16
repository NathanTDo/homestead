import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { Button, SearchInput } from '@/components/common';
import { PlantCard } from '@/components/plants';
import { Text, View } from '@/components/Themed';
import { usePlants } from '@/features/plants';

export default function PlantsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { plants, loading, error, reload } = usePlants(query);

  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Search plants" />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.message}>Could not load plants. Check your connection.</Text>
          <Button title="Try again" onPress={reload} />
        </View>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(plant) => plant.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <PlantCard plant={item} onPress={(plant) => router.push(`/plants/${plant.slug}`)} />
          )}
          ListEmptyComponent={
            <Text style={styles.message}>
              {query.trim() ? `No plants match "${query.trim()}".` : 'No plants available yet.'}
            </Text>
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
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  message: { textAlign: 'center', opacity: 0.7, marginTop: 24 },
});
