import { Image, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import type { Plant } from '@/types';
import { getPlantImage, getTileColor } from '@/utils/images';

interface PlantImageProps {
  plant: Pick<Plant, 'name' | 'slug' | 'image_url'>;
  size: number;
}

/** The plant's bundled image, or a colored tile with its first letter when there isn't one. */
export function PlantImage({ plant, size }: PlantImageProps) {
  const source = getPlantImage(plant.image_url);
  const radius = Math.round(size / 8);

  if (source) {
    return (
      <Image
        source={source}
        accessibilityLabel={plant.name}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  return (
    <View
      accessibilityLabel={plant.name}
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: getTileColor(plant.image_url ?? plant.slug),
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.45 }]}>
        {plant.name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
  letter: { color: '#fff', fontWeight: 'bold' },
});
