import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { MAX_ACTIVE_CROPS } from '@/features/crops';
import type { Plant } from '@/types';
import { PlantImage } from './PlantImage';

interface YourCropsProps {
  /** The plants for the user's planned and active crops. */
  plants: readonly Plant[];
  onPressPlant: (plant: Plant) => void;
}

/** The user's selected plants with an "X / 5" counter. */
export function YourCrops({ plants, onPressPlant }: YourCropsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Your Crops</Text>
        <Text accessibilityLabel={`${plants.length} of ${MAX_ACTIVE_CROPS} crops selected`}>
          {plants.length} / {MAX_ACTIVE_CROPS}
        </Text>
      </View>
      {plants.length === 0 ? (
        <Text style={styles.empty}>Add plants to get started</Text>
      ) : (
        <View style={styles.row}>
          {plants.map((plant) => (
            <Pressable
              key={plant.id}
              accessibilityRole="button"
              accessibilityLabel={plant.name}
              onPress={() => onPressPlant(plant)}
              style={styles.item}
            >
              <PlantImage plant={plant} size={56} />
              <Text style={styles.name} numberOfLines={1}>
                {plant.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={styles.browse}>Browse All</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 8, paddingBottom: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  title: { fontSize: 18, fontWeight: '600' },
  empty: { opacity: 0.6, paddingHorizontal: 8, paddingTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 8 },
  item: { alignItems: 'center', width: 76, paddingVertical: 4 },
  name: { fontSize: 12, marginTop: 4 },
  browse: { fontSize: 18, fontWeight: '600', paddingHorizontal: 8, paddingTop: 20 },
});
