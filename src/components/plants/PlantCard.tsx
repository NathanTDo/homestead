import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import type { Plant } from '@/types';
import { PlantImage } from './PlantImage';

interface PlantCardProps {
  plant: Plant;
  onPress: (plant: Plant) => void;
}

export function PlantCard({ plant, onPress }: PlantCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={plant.name}
      onPress={() => onPress(plant)}
      style={styles.card}
    >
      <PlantImage plant={plant} size={96} />
      <Text style={styles.name} numberOfLines={1}>
        {plant.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', padding: 12 },
  name: { marginTop: 8, fontSize: 15, fontWeight: '600' },
});
